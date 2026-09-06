export const VOICE_NOTE_STORAGE = Symbol('VOICE_NOTE_STORAGE');
export interface VoiceNoteUpload { buffer: Buffer; mimetype: string; }
export interface VoiceNoteStorage {
  save(file: VoiceNoteUpload): Promise<string>;
  remove(key: string): Promise<void>;
  read(key: string): Promise<Buffer>;
}
