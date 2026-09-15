import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  VoiceNoteStorage,
  VoiceNoteUpload,
} from '../../application/diario-sintomas/ports/voice-note.storage.js';

const EXTENSIONS: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
};
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;

export class LocalVoiceNoteStorage implements VoiceNoteStorage {
  constructor(
    private readonly directory = process.env.VOICE_NOTES_UPLOAD_DIR ??
      'uploads/voice-notes',
  ) {}

  async save(file: VoiceNoteUpload): Promise<string> {
    const extension = EXTENSIONS[file.mimetype];
    if (extension === undefined)
      throw new Error('Formato de áudio não suportado.');
    if (file.buffer.byteLength > MAX_AUDIO_SIZE)
      throw new Error('Nota de voz excede o tamanho máximo de 10 MB.');
    await mkdir(this.directory, { recursive: true });
    const key = `${randomUUID()}.${extension}`;
    await writeFile(join(this.directory, key), file.buffer, { flag: 'wx' });
    return key;
  }
  async remove(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
  read(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }
  private resolve(key: string): string {
    if (basename(key) !== key || !/^[0-9a-f-]+\.(mp3|m4a|wav)$/i.test(key))
      throw new Error('Chave de nota de voz inválida.');
    return join(this.directory, key);
  }
}
