import type {
  ImageStorage,
  UploadableImage,
} from '../../armazenamento-imagem/image-storage.port.js';
import { ApoioApplicationError } from '../errors/apoio-application.error.js';
import type { ApoioRepository } from '../ports/apoio.repository.js';

export class UploadApoioImagemUseCase {
  constructor(
    private readonly apoios: ApoioRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(apoioId: string, image: UploadableImage) {
    if ((await this.apoios.findById(apoioId)) === null) {
      throw new ApoioApplicationError('NOT_FOUND', 'Apoio nao encontrado.');
    }
    const uploaded = await this.storage.upload(`radar-apoio/${apoioId}`, image);
    try {
      await this.apoios.addImagem(apoioId, uploaded.objectKey);
    } catch (error) {
      await this.removeAfterPersistenceFailure(uploaded.objectKey);
      throw error;
    }
    return (await this.apoios.findById(apoioId))!;
  }

  private async removeAfterPersistenceFailure(
    objectKey: string,
  ): Promise<void> {
    try {
      await this.storage.remove(objectKey);
    } catch {
      // Preserve the original persistence error.
    }
  }
}

export class ReplaceApoioImagemUseCase {
  constructor(
    private readonly apoios: ApoioRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(apoioId: string, imagemId: string, image: UploadableImage) {
    const previousObjectKey = await this.apoios.findImagemObjectKey(
      apoioId,
      imagemId,
    );
    if (previousObjectKey === null) {
      throw new ApoioApplicationError(
        'NOT_FOUND',
        'Imagem do apoio nao encontrada.',
      );
    }
    const uploaded = await this.storage.upload(`radar-apoio/${apoioId}`, image);
    try {
      await this.apoios.replaceImagem(apoioId, imagemId, uploaded.objectKey);
    } catch (error) {
      await this.removeAfterPersistenceFailure(uploaded.objectKey);
      throw error;
    }
    await this.storage.remove(previousObjectKey);
    return (await this.apoios.findById(apoioId))!;
  }

  private async removeAfterPersistenceFailure(
    objectKey: string,
  ): Promise<void> {
    try {
      await this.storage.remove(objectKey);
    } catch {
      // Preserve the original persistence error.
    }
  }
}

export class DeleteApoioImagemUseCase {
  constructor(
    private readonly apoios: ApoioRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(apoioId: string, imagemId: string): Promise<void> {
    const objectKey = await this.apoios.removeImagem(apoioId, imagemId);
    if (objectKey === null) {
      throw new ApoioApplicationError(
        'NOT_FOUND',
        'Imagem do apoio nao encontrada.',
      );
    }
    await this.storage.remove(objectKey);
  }
}
