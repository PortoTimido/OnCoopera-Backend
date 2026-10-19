import { Inject, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(MinioVoiceNoteStorage.name);
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
    if (!hasExpectedAudioSignature(file.buffer, file.mimetype))
      throw new Error(
        'O conteúdo do áudio não corresponde ao formato informado.',
      );

    const objectKey = `${FOLDER}/${randomUUID()}.${extension}`;
    const bucket = this.bucket();
    const requestId = file.requestId ?? 'missing';
    const startedAt = Date.now();
    this.logger.log(
      JSON.stringify({
        bucket,
        event: 'voice-note-minio-start',
        mimetype: file.mimetype,
        requestId,
        size: file.buffer.byteLength,
      }),
    );
    try {
      await this.ensureBucket(bucket, requestId);
      await this.client.putObject(
        bucket,
        objectKey,
        file.buffer,
        file.buffer.byteLength,
        { 'Content-Type': file.mimetype },
      );
      this.logger.log(
        JSON.stringify({
          durationMillis: Date.now() - startedAt,
          event: 'voice-note-minio-success',
          objectKey,
          requestId,
        }),
      );
      return objectKey;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          durationMillis: Date.now() - startedAt,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          event: 'voice-note-minio-failure',
          requestId,
        }),
      );
      throw error;
    }
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

  private async ensureBucket(bucket: string, requestId: string): Promise<void> {
    this.logger.debug(
      JSON.stringify({
        bucket,
        event: 'voice-note-minio-bucket-check',
        requestId,
      }),
    );
    if (!(await this.client.bucketExists(bucket))) {
      this.logger.log(
        JSON.stringify({
          bucket,
          event: 'voice-note-minio-bucket-create',
          requestId,
        }),
      );
      await this.client.makeBucket(bucket);
    }
  }

  private bucket(): string {
    return this.config.getOrThrow<string>('MINIO_BUCKET');
  }
}

function hasExpectedAudioSignature(buffer: Buffer, mimetype: string): boolean {
  if (mimetype === 'audio/mpeg')
    return (
      buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
      (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    );
  if (mimetype === 'audio/mp4' || mimetype === 'audio/x-m4a')
    return (
      buffer.length >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp'
    );
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  );
}
