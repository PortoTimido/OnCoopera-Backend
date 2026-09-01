import { ArtigoApplicationError } from '../errors/artigo-application.error.js';
import type { ArtigoRepository } from '../ports/artigo.repository.js';

export class DeleteArtigoUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(id: string): Promise<void> {
    const artigo = await this.artigos.findArtigoById(id);

    if (artigo === null) {
      throw new ArtigoApplicationError('NOT_FOUND', 'Artigo nao encontrado.');
    }

    await this.artigos.desativarArtigo(id, new Date());
  }
}
