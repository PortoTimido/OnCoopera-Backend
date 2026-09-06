import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from '@japa/runner';
import { LocalVoiceNoteStorage } from '../../src/infrastructure/diario-sintomas/local-voice-note.storage.js';

test.group('diário de sintomas infrastructure', () => {
  test('armazena, lê e remove áudio local com chave opaca', async ({ assert }) => {
    const directory = await mkdtemp(join(tmpdir(), 'oncoopera-voice-'));
    try {
      const storage = new LocalVoiceNoteStorage(directory);
      const key = await storage.save({ buffer: Buffer.from('audio'), mimetype: 'audio/mpeg' });
      assert.match(key, /^[0-9a-f-]+\.mp3$/);
      assert.deepEqual(await storage.read(key), Buffer.from('audio'));
      await storage.remove(key);
      const error = await capture(() => storage.read(key));
      assert.instanceOf(error, Error);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  test('rejeita tipo não permitido', async ({ assert }) => {
    const directory = await mkdtemp(join(tmpdir(), 'oncoopera-voice-'));
    try {
      const error = await capture(() => new LocalVoiceNoteStorage(directory).save({ buffer: Buffer.alloc(1), mimetype: 'audio/ogg' }));
      assert.instanceOf(error, Error);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  test('rejeita arquivo acima de 10 MB', async ({ assert }) => {
    const directory = await mkdtemp(join(tmpdir(), 'oncoopera-voice-'));
    try {
      const error = await capture(() => new LocalVoiceNoteStorage(directory).save({ buffer: Buffer.alloc(10 * 1024 * 1024 + 1), mimetype: 'audio/mpeg' }));
      assert.instanceOf(error, Error);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
async function capture(fn: () => Promise<unknown>): Promise<unknown> { try { await fn(); return null; } catch (error) { return error; } }
