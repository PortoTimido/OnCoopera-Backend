export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');

export interface UploadableImage {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface StoredImage {
  objectKey: string;
  mimeType: string;
  size: number;
}

export interface ImageStorage {
  upload(folder: string, image: UploadableImage): Promise<StoredImage>;
  remove(objectKey: string): Promise<void>;
  getTemporaryUrl(objectKey: string): Promise<string>;
}
