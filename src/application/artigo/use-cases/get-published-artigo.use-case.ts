import type { PublicArtigo } from '../../../domain/artigo/entities/artigo.entity.js';
import { ArtigoApplicationError } from '../errors/artigo-application.error.js';
import type { ArtigoRepository } from '../ports/artigo.repository.js';

export class GetPublishedArtigoUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(id: string): Promise<PublicArtigo> {
    const artigo = await this.artigos.findPublishedArtigoById(id);

    if (artigo === null) {
      throw new ArtigoApplicationError('NOT_FOUND', 'Artigo nao encontrado.');
    }

    return artigo;
  }
}
