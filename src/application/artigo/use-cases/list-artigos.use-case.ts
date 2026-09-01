import type {
  ArtigoRepository,
  ListArtigosInput,
  PaginatedArtigos,
} from '../ports/artigo.repository.js';

export class ListArtigosUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(input: ListArtigosInput): Promise<PaginatedArtigos> {
    return this.artigos.listArtigos(input);
  }
}
