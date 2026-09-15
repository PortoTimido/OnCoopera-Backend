import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Client } from 'minio';
import type {
  ImageStorage,
  StoredImage,
  UploadableImage,
} from '../../application/armazenamento-imagem/image-storage.port.js';

export const MINIO_CLIENT = Symbol('MINIO_CLIENT');

const IMAGE_TYPES = {
  jpeg: { mimeType: 'image/jpeg', extensions: ['jpg', 'jpeg'] },
  png: { mimeType: 'image/png', extensions: ['png'] },
  webp: { mimeType: 'image/webp', extensions: ['webp'] },
} as const;

type ImageType = keyof typeof IMAGE_TYPES;

@Injectable()
export class MinioImageStorageService implements ImageStorage {
  constructor(
    @Inject(MINIO_CLIENT) private readonly client: Client,
    private readonly config: ConfigService,
  ) {}

  async upload(folder: string, image: UploadableImage): Promise<StoredImage> {
    const type = this.validate(image);
    const extension = extensionOf(image.originalname);
    const objectKey = `${folder}/${randomUUID()}.${extension}`;
    const bucket = this.bucket();

    await this.ensureBucket(bucket);
    await this.client.putObject(bucket, objectKey, image.buffer, image.size, {
      'Content-Type': IMAGE_TYPES[type].mimeType,
    });

    return {
      objectKey,
      mimeType: IMAGE_TYPES[type].mimeType,
      size: image.size,
    };
  }

  async remove(objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucket(), objectKey);
  }

  getTemporaryUrl(objectKey: string): Promise<string> {
    return this.client.presignedGetObject(
      this.bucket(),
      objectKey,
      this.config.getOrThrow<number>('MINIO_URL_EXPIRATION_SECONDS'),
    );
  }

  private async ensureBucket(bucket: string): Promise<void> {
    if (!(await this.client.bucketExists(bucket))) {
      // Buckets created by MinIO are private by default. No anonymous policy is set.
      await this.client.makeBucket(bucket);
    }
  }

  private validate(image: UploadableImage): ImageType {
    const maxSize = this.config.getOrThrow<number>('IMAGE_MAX_SIZE_BYTES');
    if (image.size <= 0 || image.size > maxSize) {
      throw new BadRequestException(
        `A imagem deve ter no mÃ¡ximo ${maxSize} bytes.`,
      );
    }

    const type = detectImageType(image.buffer);
    if (type === null) {
      throw new BadRequestException(
        'O arquivo enviado nÃ£o Ã© uma imagem vÃ¡lida.',
      );
    }

    const extension = extensionOf(image.originalname);
    const expected = IMAGE_TYPES[type];
    if (
      image.mimetype !== expected.mimeType ||
      !expected.extensions.includes(extension as never)
    ) {
      throw new BadRequestException(
        'MIME type, extensÃ£o e conteÃºdo da imagem devem ser compatÃ­veis.',
      );
    }

    return type;
  }

  private bucket(): string {
    return this.config.getOrThrow<string>('MINIO_BUCKET');
  }
}

function extensionOf(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  if (extension.length === 0) {
    throw new BadRequestException(
      'A imagem deve possuir uma extensÃ£o vÃ¡lida.',
    );
  }
  return extension;
}

function detectImageType(buffer: Buffer): ImageType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return 'jpeg';
  if (
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'png';
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'webp';
  return null;
}
