import { test } from '@japa/runner';
import type { Client } from 'minio';
import type { ConfigService } from '@nestjs/config';
import { MinioVoiceNoteStorage } from '../../src/infrastructure/diario-sintomas/minio-voice-note.storage.js';

test.group('diário de sintomas infrastructure', () => {
  test('armazena, lê e remove áudio no MinIO com chave opaca', async ({
    assert,
  }) => {
    const objects = new Map<string, Buffer>();
    const calls: string[] = [];
    const client = {
      bucketExists: async () => false,
      makeBucket: async (bucket: string) => calls.push(`bucket:${bucket}`),
      putObject: async (
        bucket: string,
        key: string,
        content: Buffer,
        _size: number,
        meta: Record<string, string>,
      ) => {
        objects.set(key, content);
        calls.push(`put:${bucket}:${key}:${meta['Content-Type']}`);
      },
      removeObject: async (_bucket: string, key: string) => {
        objects.delete(key);
      },
      getObject: async (_bucket: string, key: string) => {
        const content = objects.get(key);
        if (content === undefined) throw new Error('objeto não encontrado');
        return (async function* () {
          yield content;
        })();
      },
    };
    const storage = new MinioVoiceNoteStorage(
      client as unknown as Client,
      config() as ConfigService,
    );

    const key = await storage.save({
      buffer: Buffer.from('audio'),
      mimetype: 'audio/mpeg',
    });
    assert.match(key, /^diario-sintomas\/notas-voz\/[0-9a-f-]{36}\.mp3$/);
    assert.equal(calls[0], 'bucket:oncoopera-images');
    assert.match(
      calls[1],
      /^put:oncoopera-images:diario-sintomas\/notas-voz\/.+:audio\/mpeg$/,
    );
    assert.deepEqual(await storage.read(key), Buffer.from('audio'));

    await storage.remove(key);
    const error = await capture(() => storage.read(key));
    assert.instanceOf(error, Error);
  });

  test('rejeita tipo não permitido', async ({ assert }) => {
    const storage = new MinioVoiceNoteStorage(
      {} as Client,
      config() as ConfigService,
    );
    const error = await capture(() =>
      storage.save({ buffer: Buffer.alloc(1), mimetype: 'audio/ogg' }),
    );
    assert.instanceOf(error, Error);
  });

  test('rejeita arquivo acima de 10 MB', async ({ assert }) => {
    const storage = new MinioVoiceNoteStorage(
      {} as Client,
      config() as ConfigService,
    );
    const error = await capture(() =>
      storage.save({
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
        mimetype: 'audio/mpeg',
      }),
    );
    assert.instanceOf(error, Error);
  });
});

function config() {
  const values: Record<string, string> = { MINIO_BUCKET: 'oncoopera-images' };
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
