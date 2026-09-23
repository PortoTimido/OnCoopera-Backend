import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { IMAGE_STORAGE } from '../../application/armazenamento-imagem/image-storage.port.js';
import {
  MINIO_CLIENT,
  MinioImageStorageService,
} from './minio-image-storage.service.js';

@Module({
  providers: [
    {
      provide: MINIO_CLIENT,
      useFactory: (config: ConfigService) =>
        new Client({
          endPoint: config.getOrThrow<string>('MINIO_ENDPOINT'),
          port: config.getOrThrow<number>('MINIO_PORT'),
          useSSL: config.getOrThrow<boolean>('MINIO_USE_SSL'),
          accessKey: config.getOrThrow<string>('MINIO_ACCESS_KEY'),
          secretKey: config.getOrThrow<string>('MINIO_SECRET_KEY'),
        }),
      inject: [ConfigService],
    },
    MinioImageStorageService,
    { provide: IMAGE_STORAGE, useExisting: MinioImageStorageService },
  ],
  exports: [IMAGE_STORAGE, MINIO_CLIENT],
})
export class ArmazenamentoImagemModule {}
