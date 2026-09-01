import type {
  ArtigoRepository,
  ListArtigosInput,
  PaginatedArtigos,
} from '../ports/artigo.repository.js';

export class ListPublishedArtigosUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(
    input: Omit<ListArtigosInput, 'status' | 'onlyPublished' | 'autorId'>,
  ): Promise<PaginatedArtigos> {
    return this.artigos.listArtigos({
      ...input,
      onlyPublished: true,
    });
  }
}
