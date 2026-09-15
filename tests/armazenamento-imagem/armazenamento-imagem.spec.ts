import { test } from '@japa/runner';
import { BadRequestException } from '@nestjs/common';
import type { Client } from 'minio';
import type { ConfigService } from '@nestjs/config';
import { MinioImageStorageService } from '../../src/infrastructure/armazenamento-imagem/minio-image-storage.service.js';
import {
  DeleteArtigoImagemUseCase,
  UploadArtigoImagemUseCase,
} from '../../src/application/artigo/use-cases/manage-artigo-imagem.use-cases.js';
import { DeleteApoioImagemUseCase } from '../../src/application/radar-apoio/use-cases/manage-apoio-imagem.use-cases.js';
import type { UploadableImage } from '../../src/application/armazenamento-imagem/image-storage.port.js';

const jpeg: UploadableImage = {
  buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  mimetype: 'image/jpeg',
  originalname: 'capa.jpg',
  size: 4,
};

test.group('armazenamento de imagens', () => {
  test('envia imagem vÃ¡lida com chave opaca e URL assinada', async ({ assert }) => {
    const calls: string[] = [];
    const client = {
      bucketExists: async () => false,
      makeBucket: async (bucket: string) => calls.push(`bucket:${bucket}`),
      putObject: async (
        bucket: string,
        key: string,
        _content: Buffer,
        _size: number,
        meta: Record<string, string>,
      ) => calls.push(`put:${bucket}:${key}:${meta['Content-Type']}`),
      removeObject: async () => undefined,
      presignedGetObject: async (_bucket: string, key: string, expiry: number) =>
        `https://signed.example/${key}?expires=${expiry}`,
    };
    const storage = new MinioImageStorageService(
      client as unknown as Client,
      config() as ConfigService,
    );

    const stored = await storage.upload('artigos/artigo-1', jpeg);

    assert.match(
      stored.objectKey,
      /^artigos\/artigo-1\/[0-9a-f-]{36}\.jpg$/,
    );
    assert.equal(stored.mimeType, 'image/jpeg');
    assert.equal(calls[0], 'bucket:oncoopera-images');
    assert.match(calls[1]!, /^put:oncoopera-images:artigos\/artigo-1\//);
    assert.equal(
      await storage.getTemporaryUrl(stored.objectKey),
      `https://signed.example/${stored.objectKey}?expires=900`,
    );
  });

  test('rejeita MIME, extensÃ£o ou conteÃºdo divergentes', async ({ assert }) => {
    const storage = new MinioImageStorageService(
      {} as Client,
      config() as ConfigService,
    );
    const error = await capture(() =>
      storage.upload('artigos/artigo-1', { ...jpeg, mimetype: 'image/png' }),
    );
    assert.instanceOf(error, BadRequestException);
  });

  test('substitui capa somente apÃ³s persistir e remove novo objeto em falha', async ({ assert }) => {
    const storage = new MemoryStorage();
    const repository = new ArticleImageRepository();
    const useCase = new UploadArtigoImagemUseCase(repository, storage);

    await useCase.execute('artigo-1', jpeg);
    assert.deepEqual(storage.removed, ['artigos/artigo-1/old.jpg']);
    assert.equal(repository.objectKey, 'artigos/artigo-1/new.jpg');

    repository.failSave = true;
    const error = await capture(() => useCase.execute('artigo-1', jpeg));
    assert.instanceOf(error, Error);
    assert.equal(storage.removed.at(-1), 'artigos/artigo-1/new.jpg');
  });

  test('exclui referÃªncia e objeto de imagem do apoio', async ({ assert }) => {
    const storage = new MemoryStorage();
    const repository = {
      removeImagem: async () => 'radar-apoio/apoio-1/imagem.webp',
    };
    const useCase = new DeleteApoioImagemUseCase(repository as never, storage);

    await useCase.execute('apoio-1', 'imagem-1');

    assert.deepEqual(storage.removed, ['radar-apoio/apoio-1/imagem.webp']);
  });

  test('exclui objeto da capa do artigo', async ({ assert }) => {
    const storage = new MemoryStorage();
    const repository = new ArticleImageRepository();
    const useCase = new DeleteArtigoImagemUseCase(repository, storage);

    await useCase.execute('artigo-1');

    assert.deepEqual(storage.removed, ['artigos/artigo-1/old.jpg']);
    assert.equal(repository.objectKey, null);
  });
});

class MemoryStorage {
  readonly removed: string[] = [];

  async upload() {
    return {
      objectKey: 'artigos/artigo-1/new.jpg',
      mimeType: 'image/jpeg',
      size: 4,
    };
  }

  async remove(objectKey: string): Promise<void> {
    this.removed.push(objectKey);
  }

  async getTemporaryUrl(objectKey: string): Promise<string> {
    return `https://signed.example/${objectKey}`;
  }
}

class ArticleImageRepository {
  objectKey: string | null = 'artigos/artigo-1/old.jpg';
  failSave = false;

  async findArtigoById() {
    return {
      id: 'artigo-1',
      imagemUrl: this.objectKey === null ? null : 'https://signed.example/image',
    };
  }

  async findImagemObjectKey() {
    return this.objectKey;
  }

  async setImagemObjectKey(_id: string, objectKey: string | null): Promise<void> {
    if (this.failSave) throw new Error('falha de banco');
    this.objectKey = objectKey;
  }
}

function config() {
  const values: Record<string, string | number> = {
    MINIO_BUCKET: 'oncoopera-images',
    MINIO_URL_EXPIRATION_SECONDS: 900,
    IMAGE_MAX_SIZE_BYTES: 5 * 1024 * 1024,
  };
  return { getOrThrow: <T>(key: string) => values[key] as T };
}

async function capture(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}
