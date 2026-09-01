import type { PublicTaxonomia } from '../../../domain/artigo/entities/artigo.entity.js';
import { Categoria } from '../../../domain/artigo/entities/categoria.entity.js';
import { Tag } from '../../../domain/artigo/entities/tag.entity.js';
import type { ArtigoRepository } from '../ports/artigo.repository.js';

export class ListCategoriasUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(search?: string): Promise<PublicTaxonomia[]> {
    return this.artigos.listCategorias(search);
  }
}

export class CreateCategoriaUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(nome: string): Promise<PublicTaxonomia> {
    const categoria = Categoria.create({ id: 'preview', nome });

    return this.artigos.createCategoria({ nome: categoria.nome });
  }
}

export class UpdateCategoriaUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(id: string, nome: string): Promise<PublicTaxonomia> {
    const categoria = Categoria.create({ id, nome });

    return this.artigos.updateCategoria(id, { nome: categoria.nome });
  }
}

export class DeleteCategoriaUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(id: string): Promise<void> {
    await this.artigos.deleteCategoria(id);
  }
}

export class ListTagsUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(search?: string): Promise<PublicTaxonomia[]> {
    return this.artigos.listTags(search);
  }
}

export class CreateTagUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(nome: string): Promise<PublicTaxonomia> {
    const tag = Tag.create({ id: 'preview', nome });

    return this.artigos.createTag({ nome: tag.nome });
  }
}

export class UpdateTagUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(id: string, nome: string): Promise<PublicTaxonomia> {
    const tag = Tag.create({ id, nome });

    return this.artigos.updateTag(id, { nome: tag.nome });
  }
}

export class DeleteTagUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(id: string): Promise<void> {
    await this.artigos.deleteTag(id);
  }
}
