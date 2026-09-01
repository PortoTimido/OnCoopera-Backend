import { test } from '@japa/runner';
import { ArtigoApplicationError } from '../../src/application/artigo/errors/artigo-application.error.js';
import type {
  ArtigoRepository,
  CreateArtigoRepositoryInput,
  ListArtigosInput,
  PaginatedArtigos,
  UpdateArtigoRepositoryInput,
  UpsertTaxonomiaInput,
} from '../../src/application/artigo/ports/artigo.repository.js';
import { CreateArtigoUseCase } from '../../src/application/artigo/use-cases/create-artigo.use-case.js';
import { DeleteArtigoUseCase } from '../../src/application/artigo/use-cases/delete-artigo.use-case.js';
import { GetPublishedArtigoUseCase } from '../../src/application/artigo/use-cases/get-published-artigo.use-case.js';
import { ListPublishedArtigosUseCase } from '../../src/application/artigo/use-cases/list-published-artigos.use-case.js';
import {
  CreateCategoriaUseCase,
  DeleteCategoriaUseCase,
  UpdateTagUseCase,
} from '../../src/application/artigo/use-cases/manage-taxonomia.use-cases.js';
import { UpdateArtigoUseCase } from '../../src/application/artigo/use-cases/update-artigo.use-case.js';
import type {
  PublicArtigo,
  PublicTaxonomia,
} from '../../src/domain/artigo/entities/artigo.entity.js';

test.group('artigo application', () => {
  test('cria artigo publicado com autor autenticado e data de publicacao', async ({
    assert,
  }) => {
    const repository = new InMemoryArtigoRepository();
    const createArtigo = new CreateArtigoUseCase(repository);

    const output = await createArtigo.execute({
      autorId: 'admin-1',
      titulo: 'Artigo publicado',
      conteudo: 'Conteudo',
      tempoLeituraMinutos: 5,
      imagemUrl: null,
      status: 'PUBLICADO',
      categoriaIds: ['categoria-1'],
      tagIds: ['tag-1'],
    });

    assert.equal(repository.created[0]?.autorId, 'admin-1');
    assert.equal(output.status, 'PUBLICADO');
    assert.instanceOf(output.dataPublicacao, Date);
  });

  test('atualiza artigo e substitui categorias e tags', async ({ assert }) => {
    const repository = new InMemoryArtigoRepository();
    const updateArtigo = new UpdateArtigoUseCase(repository);

    const output = await updateArtigo.execute('artigo-1', {
      titulo: 'Novo titulo',
      status: 'PUBLICADO',
      categoriaIds: ['categoria-2'],
      tagIds: [],
    });

    assert.equal(output.titulo, 'Novo titulo');
    assert.equal(output.status, 'PUBLICADO');
    assert.deepEqual(repository.updated[0]?.categoriaIds, ['categoria-2']);
    assert.deepEqual(repository.updated[0]?.tagIds, []);
  });

  test('mobile lista e consulta apenas publicados', async ({ assert }) => {
    const repository = new InMemoryArtigoRepository();
    const listPublished = new ListPublishedArtigosUseCase(repository);
    const getPublished = new GetPublishedArtigoUseCase(repository);

    const listOutput = await listPublished.execute({ page: 1, pageSize: 20 });
    const getOutput = await getPublished.execute('artigo-publicado');
    const error = await captureError(() => getPublished.execute('artigo-1'));

    assert.equal(repository.lastListInput?.onlyPublished, true);
    assert.equal(listOutput.data.every((artigo) => artigo.status === 'PUBLICADO'), true);
    assert.equal(getOutput.id, 'artigo-publicado');
    assert.instanceOf(error, ArtigoApplicationError);
    assert.equal((error as ArtigoApplicationError).code, 'NOT_FOUND');
  });

  test('desativa artigo sem remover registro', async ({ assert }) => {
    const repository = new InMemoryArtigoRepository();
    const deleteArtigo = new DeleteArtigoUseCase(repository);

    await deleteArtigo.execute('artigo-1');

    assert.deepEqual(repository.deletedIds, ['artigo-1']);
    assert.equal(repository.items.get('artigo-1')?.status, 'DESATIVADO');
  });

  test('gerencia categoria e bloqueia remocao em uso', async ({ assert }) => {
    const repository = new InMemoryArtigoRepository();
    const createCategoria = new CreateCategoriaUseCase(repository);
    const deleteCategoria = new DeleteCategoriaUseCase(repository);

    const categoria = await createCategoria.execute(' Nova categoria ');
    const error = await captureError(() =>
      deleteCategoria.execute('categoria-1'),
    );

    assert.equal(categoria.nome, 'Nova categoria');
    assert.instanceOf(error, ArtigoApplicationError);
    assert.equal((error as ArtigoApplicationError).code, 'CONFLICT');
  });

  test('atualiza tag validando nome', async ({ assert }) => {
    const repository = new InMemoryArtigoRepository();
    const updateTag = new UpdateTagUseCase(repository);

    const tag = await updateTag.execute('tag-1', ' Cuidados ');

    assert.equal(tag.nome, 'Cuidados');
  });
});

class InMemoryArtigoRepository implements ArtigoRepository {
  readonly created: CreateArtigoRepositoryInput[] = [];
  readonly updated: UpdateArtigoRepositoryInput[] = [];
  readonly deletedIds: string[] = [];
  lastListInput: ListArtigosInput | null = null;
  readonly items = new Map<string, PublicArtigo>([
    ['artigo-1', createArtigo({ id: 'artigo-1', status: 'RASCUNHO' })],
    [
      'artigo-publicado',
      createArtigo({
        id: 'artigo-publicado',
        status: 'PUBLICADO',
        dataPublicacao: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ],
  ]);
  readonly categorias = new Map<string, PublicTaxonomia>([
    ['categoria-1', { id: 'categoria-1', nome: 'Categoria' }],
    ['categoria-2', { id: 'categoria-2', nome: 'Outra categoria' }],
  ]);
  readonly tags = new Map<string, PublicTaxonomia>([
    ['tag-1', { id: 'tag-1', nome: 'Tag' }],
  ]);

  async listArtigos(input: ListArtigosInput): Promise<PaginatedArtigos> {
    this.lastListInput = input;
    const data = [...this.items.values()].filter((artigo) =>
      input.onlyPublished === true ? artigo.status === 'PUBLICADO' : true,
    );

    return {
      data,
      page: input.page,
      pageSize: input.pageSize,
      total: data.length,
      totalPages: data.length === 0 ? 0 : 1,
    };
  }

  async findArtigoById(id: string): Promise<PublicArtigo | null> {
    return this.items.get(id) ?? null;
  }

  async findPublishedArtigoById(id: string): Promise<PublicArtigo | null> {
    const artigo = this.items.get(id);

    return artigo?.status === 'PUBLICADO' ? artigo : null;
  }

  async createArtigo(
    input: CreateArtigoRepositoryInput,
  ): Promise<PublicArtigo> {
    this.created.push(input);
    const artigo = createArtigo({
      id: 'artigo-criado',
      autorId: input.autorId,
      titulo: input.titulo,
      conteudo: input.conteudo,
      tempoLeituraMinutos: input.tempoLeituraMinutos,
      imagemUrl: input.imagemUrl,
      status: input.status,
      categorias: input.categoriaIds.map((id) => this.categorias.get(id)!),
      tags: input.tagIds.map((id) => this.tags.get(id)!),
      dataPublicacao: input.dataPublicacao,
    });
    this.items.set(artigo.id, artigo);

    return artigo;
  }

  async updateArtigo(
    input: UpdateArtigoRepositoryInput,
  ): Promise<PublicArtigo> {
    this.updated.push(input);
    const current = this.items.get(input.id);

    if (current === undefined) {
      throw new ArtigoApplicationError('NOT_FOUND', 'Artigo nao encontrado.');
    }

    const updated = {
      ...current,
      ...input,
      categorias:
        input.categoriaIds?.map((id) => this.categorias.get(id)!) ??
        current.categorias,
      tags: input.tagIds?.map((id) => this.tags.get(id)!) ?? current.tags,
      dataPublicacao:
        input.dataPublicacao !== undefined
          ? input.dataPublicacao
          : current.dataPublicacao,
    };
    this.items.set(input.id, updated);

    return updated;
  }

  async desativarArtigo(id: string): Promise<void> {
    this.deletedIds.push(id);
    const current = this.items.get(id);

    if (current !== undefined) {
      this.items.set(id, { ...current, status: 'DESATIVADO' });
    }
  }

  async listCategorias(): Promise<PublicTaxonomia[]> {
    return [...this.categorias.values()];
  }

  async createCategoria(
    input: UpsertTaxonomiaInput,
  ): Promise<PublicTaxonomia> {
    return { id: 'categoria-criada', nome: input.nome };
  }

  async updateCategoria(
    id: string,
    input: UpsertTaxonomiaInput,
  ): Promise<PublicTaxonomia> {
    return { id, nome: input.nome };
  }

  async deleteCategoria(id: string): Promise<void> {
    if (id === 'categoria-1') {
      throw new ArtigoApplicationError(
        'CONFLICT',
        'Categoria associada a artigo nao pode ser removida.',
      );
    }
  }

  async listTags(): Promise<PublicTaxonomia[]> {
    return [...this.tags.values()];
  }

  async createTag(input: UpsertTaxonomiaInput): Promise<PublicTaxonomia> {
    return { id: 'tag-criada', nome: input.nome };
  }

  async updateTag(
    id: string,
    input: UpsertTaxonomiaInput,
  ): Promise<PublicTaxonomia> {
    return { id, nome: input.nome };
  }

  async deleteTag(): Promise<void> {}
}

function createArtigo(overrides: Partial<PublicArtigo> = {}): PublicArtigo {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return {
    id: 'artigo-1',
    autorId: 'admin-1',
    titulo: 'Titulo',
    conteudo: 'Conteudo',
    tempoLeituraMinutos: 3,
    imagemUrl: null,
    status: 'RASCUNHO',
    categorias: [{ id: 'categoria-1', nome: 'Categoria' }],
    tags: [{ id: 'tag-1', nome: 'Tag' }],
    dataCriacao: now,
    dataAtualizacao: now,
    dataPublicacao: null,
    ...overrides,
  };
}

async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}
