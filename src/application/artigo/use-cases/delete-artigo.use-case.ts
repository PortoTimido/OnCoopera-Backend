import { ArtigoApplicationError } from '../errors/artigo-application.error.js';
import type { ArtigoRepository } from '../ports/artigo.repository.js';
import type { ImageStorage } from '../../armazenamento-imagem/image-storage.port.js';

export class DeleteArtigoUseCase {
  constructor(
    private readonly artigos: ArtigoRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(id: string): Promise<void> {
    const artigo = await this.artigos.findArtigoById(id);

    if (artigo === null) {
      throw new ArtigoApplicationError('NOT_FOUND', 'Artigo nao encontrado.');
    }

    const objectKey = await this.artigos.desativarArtigo(id, new Date());
    if (objectKey !== null) await this.storage.remove(objectKey);
  }
}
