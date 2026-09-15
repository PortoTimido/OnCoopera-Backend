import type {
  ImageStorage,
  UploadableImage,
} from '../../armazenamento-imagem/image-storage.port.js';
import { ArtigoApplicationError } from '../errors/artigo-application.error.js';
import type { ArtigoRepository } from '../ports/artigo.repository.js';

export class UploadArtigoImagemUseCase {
  constructor(
    private readonly artigos: ArtigoRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(id: string, image: UploadableImage) {
    if ((await this.artigos.findArtigoById(id)) === null) {
      throw new ArtigoApplicationError('NOT_FOUND', 'Artigo nao encontrado.');
    }
    const previousObjectKey = await this.artigos.findImagemObjectKey(id);
    const uploaded = await this.storage.upload(`artigos/${id}`, image);
    try {
      await this.artigos.setImagemObjectKey(id, uploaded.objectKey);
    } catch (error) {
      await this.removeAfterPersistenceFailure(uploaded.objectKey);
      throw error;
    }
    if (previousObjectKey !== null)
      await this.storage.remove(previousObjectKey);
    return (await this.artigos.findArtigoById(id))!;
  }

  private async removeAfterPersistenceFailure(
    objectKey: string,
  ): Promise<void> {
    try {
      await this.storage.remove(objectKey);
    } catch {
      // The original persistence error is more useful to the caller.
    }
  }
}

export class DeleteArtigoImagemUseCase {
  constructor(
    private readonly artigos: ArtigoRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(id: string): Promise<void> {
    if ((await this.artigos.findArtigoById(id)) === null) {
      throw new ArtigoApplicationError('NOT_FOUND', 'Artigo nao encontrado.');
    }
    const objectKey = await this.artigos.findImagemObjectKey(id);
    if (objectKey === null) return;
    await this.artigos.setImagemObjectKey(id, null);
    await this.storage.remove(objectKey);
  }
}
