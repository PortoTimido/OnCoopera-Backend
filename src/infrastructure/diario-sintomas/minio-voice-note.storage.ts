import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { Client } from 'minio';
import type {
  VoiceNoteStorage,
  VoiceNoteUpload,
} from '../../application/diario-sintomas/ports/voice-note.storage.js';
import { MINIO_CLIENT } from '../armazenamento-imagem/minio-image-storage.service.js';

const EXTENSIONS: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
};
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
const FOLDER = 'diario-sintomas/notas-voz';

@Injectable()
export class MinioVoiceNoteStorage implements VoiceNoteStorage {
  constructor(
    @Inject(MINIO_CLIENT) private readonly client: Client,
    private readonly config: ConfigService,
  ) {}

  async save(file: VoiceNoteUpload): Promise<string> {
    const extension = EXTENSIONS[file.mimetype];
    if (extension === undefined)
      throw new Error('Formato de áudio não suportado.');
    if (file.buffer.byteLength > MAX_AUDIO_SIZE)
      throw new Error('Nota de voz excede o tamanho máximo de 10 MB.');

    const objectKey = `${FOLDER}/${randomUUID()}.${extension}`;
    const bucket = this.bucket();
    await this.ensureBucket(bucket);
    await this.client.putObject(
      bucket,
      objectKey,
      file.buffer,
      file.buffer.byteLength,
      { 'Content-Type': file.mimetype },
    );
    return objectKey;
  }

  async remove(objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucket(), objectKey);
  }

  async read(objectKey: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket(), objectKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }

  private async ensureBucket(bucket: string): Promise<void> {
    if (!(await this.client.bucketExists(bucket))) {
      await this.client.makeBucket(bucket);
    }
  }

  private bucket(): string {
    return this.config.getOrThrow<string>('MINIO_BUCKET');
  }
}
