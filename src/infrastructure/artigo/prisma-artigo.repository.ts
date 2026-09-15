import { Prisma } from '../../generated/prisma/client.js';
import { Artigo } from '../../domain/artigo/entities/artigo.entity.js';
import type {
  PublicArtigo,
  PublicTaxonomia,
  StatusArtigo,
} from '../../domain/artigo/entities/artigo.entity.js';
import { ConteudoArtigo } from '../../domain/artigo/value-objects/conteudo-artigo.value-object.js';
import { ImagemUrl } from '../../domain/artigo/value-objects/imagem-url.value-object.js';
import { TempoLeitura } from '../../domain/artigo/value-objects/tempo-leitura.value-object.js';
import { TituloArtigo } from '../../domain/artigo/value-objects/titulo-artigo.value-object.js';
import { ArtigoApplicationError } from '../../application/artigo/errors/artigo-application.error.js';
import type {
  ArtigoRepository,
  CreateArtigoRepositoryInput,
  ListArtigosInput,
  PaginatedArtigos,
  UpdateArtigoRepositoryInput,
  UpsertTaxonomiaInput,
} from '../../application/artigo/ports/artigo.repository.js';
import { PrismaService } from '../database/prisma.service.js';
import type { ImageStorage } from '../../application/armazenamento-imagem/image-storage.port.js';

interface ArtigoPersistenceRecord {
  id: string;
  autorId: string;
  titulo: string;
  conteudo: string;
  tempoLeituraMinutos: number;
  imagemObjectKey: string | null;
  status: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataPublicacao: Date | null;
  categorias: Array<{
    categoria: PublicTaxonomia;
  }>;
  tags: Array<{
    tag: PublicTaxonomia;
  }>;
}

const artigoInclude = {
  categorias: {
    include: {
      categoria: true,
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
} as const;

export class PrismaArtigoRepository implements ArtigoRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ImageStorage,
  ) {}

  async listArtigos(input: ListArtigosInput): Promise<PaginatedArtigos> {
    const where = this.toArtigoWhere(input);
    const [total, records] = await this.prisma.$transaction([
      this.prisma.artigo.count({ where }),
      this.prisma.artigo.findMany({
        where,
        include: artigoInclude,
        orderBy: [{ dataPublicacao: 'desc' }, { dataCriacao: 'desc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      data: await Promise.all(
        records.map((record) => this.toPublicArtigo(record)),
      ),
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    };
  }

  async findArtigoById(id: string): Promise<PublicArtigo | null> {
    const record = await this.prisma.artigo.findUnique({
      where: { id },
      include: artigoInclude,
    });

    return record === null ? null : this.toPublicArtigo(record);
  }

  async findPublishedArtigoById(id: string): Promise<PublicArtigo | null> {
    const record = await this.prisma.artigo.findFirst({
      where: {
        id,
        status: 'PUBLICADO',
      },
      include: artigoInclude,
    });

    return record === null ? null : this.toPublicArtigo(record);
  }

  async createArtigo(
    input: CreateArtigoRepositoryInput,
  ): Promise<PublicArtigo> {
    try {
      const record = await this.prisma.artigo.create({
        data: {
          autorId: input.autorId,
          titulo: input.titulo,
          conteudo: input.conteudo,
          tempoLeituraMinutos: input.tempoLeituraMinutos,
          imagemObjectKey: input.imagemObjectKey,
          status: input.status,
          dataPublicacao: input.dataPublicacao,
          categorias: {
            create: input.categoriaIds.map((categoriaId) => ({
              categoria: {
                connect: { id: categoriaId },
              },
            })),
          },
          tags: {
            create: input.tagIds.map((tagId) => ({
              tag: {
                connect: { id: tagId },
              },
            })),
          },
        },
        include: artigoInclude,
      });

      return this.toPublicArtigo(record);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async updateArtigo(
    input: UpdateArtigoRepositoryInput,
  ): Promise<PublicArtigo> {
    try {
      const record = await this.prisma.$transaction(async (tx) => {
        await tx.artigo.update({
          where: { id: input.id },
          data: toArtigoUpdateData(input),
        });

        if (input.categoriaIds !== undefined) {
          await tx.artigoCategoria.deleteMany({
            where: { artigoId: input.id },
          });
          await tx.artigoCategoria.createMany({
            data: input.categoriaIds.map((categoriaId) => ({
              artigoId: input.id,
              categoriaId,
            })),
          });
        }

        if (input.tagIds !== undefined) {
          await tx.artigoTag.deleteMany({
            where: { artigoId: input.id },
          });
          await tx.artigoTag.createMany({
            data: input.tagIds.map((tagId) => ({
              artigoId: input.id,
              tagId,
            })),
          });
        }

        return tx.artigo.findUniqueOrThrow({
          where: { id: input.id },
          include: artigoInclude,
        });
      });

      return this.toPublicArtigo(record);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async findImagemObjectKey(id: string): Promise<string | null> {
    const record = await this.prisma.artigo.findUnique({
      where: { id },
      select: { imagemObjectKey: true },
    });
    return record?.imagemObjectKey ?? null;
  }

  async setImagemObjectKey(
    id: string,
    objectKey: string | null,
  ): Promise<void> {
    try {
      await this.prisma.artigo.update({
        where: { id },
        data: { imagemObjectKey: objectKey },
      });
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async desativarArtigo(
    id: string,
    desativadoEm: Date,
  ): Promise<string | null> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.artigo.findUniqueOrThrow({
          where: { id },
          select: { imagemObjectKey: true },
        });
        await tx.artigo.update({
          where: { id },
          data: {
            status: 'DESATIVADO',
            dataAtualizacao: desativadoEm,
            imagemObjectKey: null,
          },
        });
        return current.imagemObjectKey;
      });
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async listCategorias(search?: string): Promise<PublicTaxonomia[]> {
    return this.prisma.categoria.findMany({
      where: toCategoriaWhere(search),
      orderBy: { nome: 'asc' },
    });
  }

  async createCategoria(input: UpsertTaxonomiaInput): Promise<PublicTaxonomia> {
    try {
      return await this.prisma.categoria.create({ data: input });
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async updateCategoria(
    id: string,
    input: UpsertTaxonomiaInput,
  ): Promise<PublicTaxonomia> {
    try {
      return await this.prisma.categoria.update({
        where: { id },
        data: input,
      });
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async deleteCategoria(id: string): Promise<void> {
    const articlesCount = await this.prisma.artigoCategoria.count({
      where: { categoriaId: id },
    });

    if (articlesCount > 0) {
      throw new ArtigoApplicationError(
        'CONFLICT',
        'Categoria associada a artigo nao pode ser removida.',
      );
    }

    try {
      await this.prisma.categoria.delete({ where: { id } });
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async listTags(search?: string): Promise<PublicTaxonomia[]> {
    return this.prisma.tag.findMany({
      where: toTagWhere(search),
      orderBy: { nome: 'asc' },
    });
  }

  async createTag(input: UpsertTaxonomiaInput): Promise<PublicTaxonomia> {
    try {
      return await this.prisma.tag.create({ data: input });
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async updateTag(
    id: string,
    input: UpsertTaxonomiaInput,
  ): Promise<PublicTaxonomia> {
    try {
      return await this.prisma.tag.update({
        where: { id },
        data: input,
      });
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async deleteTag(id: string): Promise<void> {
    const articlesCount = await this.prisma.artigoTag.count({
      where: { tagId: id },
    });

    if (articlesCount > 0) {
      throw new ArtigoApplicationError(
        'CONFLICT',
        'Tag associada a artigo nao pode ser removida.',
      );
    }

    try {
      await this.prisma.tag.delete({ where: { id } });
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  private toArtigoWhere(input: ListArtigosInput): Prisma.ArtigoWhereInput {
    return {
      ...(input.onlyPublished === true
        ? { status: 'PUBLICADO' }
        : input.status !== undefined
          ? { status: input.status }
          : {}),
      ...(input.autorId !== undefined ? { autorId: input.autorId } : {}),
      ...(input.categoriaId !== undefined
        ? {
            categorias: {
              some: {
                categoriaId: input.categoriaId,
              },
            },
          }
        : {}),
      ...(input.tagId !== undefined
        ? {
            tags: {
              some: {
                tagId: input.tagId,
              },
            },
          }
        : {}),
      ...(input.search !== undefined
        ? {
            OR: [
              { titulo: { contains: input.search, mode: 'insensitive' } },
              { conteudo: { contains: input.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private async toPublicArtigo(
    record: ArtigoPersistenceRecord,
  ): Promise<PublicArtigo> {
    const imagemUrl =
      record.imagemObjectKey === null
        ? null
        : await this.storage.getTemporaryUrl(record.imagemObjectKey);
    return Artigo.create({
      id: record.id,
      autorId: record.autorId,
      titulo: TituloArtigo.create(record.titulo),
      conteudo: ConteudoArtigo.create(record.conteudo),
      tempoLeitura: TempoLeitura.create(record.tempoLeituraMinutos),
      imagemUrl: imagemUrl === null ? null : ImagemUrl.create(imagemUrl),
      status: record.status as StatusArtigo,
      categorias: record.categorias.map((item) => item.categoria),
      tags: record.tags.map((item) => item.tag),
      dataCriacao: record.dataCriacao,
      dataAtualizacao: record.dataAtualizacao,
      dataPublicacao: record.dataPublicacao,
    }).toPublic();
  }

  private mapPersistenceError(error: unknown): Error {
    if (error instanceof ArtigoApplicationError) {
      return error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new ArtigoApplicationError(
          'CONFLICT',
          'Nome ja cadastrado para esta taxonomia.',
        );
      }

      if (error.code === 'P2003') {
        return new ArtigoApplicationError(
          'NOT_FOUND',
          'Autor, categoria ou tag nao encontrado.',
        );
      }

      if (error.code === 'P2025') {
        return new ArtigoApplicationError(
          'NOT_FOUND',
          'Registro nao encontrado.',
        );
      }
    }

    return error instanceof Error ? error : new Error('Erro de persistencia.');
  }
}

function toArtigoUpdateData(
  input: UpdateArtigoRepositoryInput,
): Prisma.ArtigoUpdateInput {
  return {
    ...(input.titulo !== undefined ? { titulo: input.titulo } : {}),
    ...(input.conteudo !== undefined ? { conteudo: input.conteudo } : {}),
    ...(input.tempoLeituraMinutos !== undefined
      ? { tempoLeituraMinutos: input.tempoLeituraMinutos }
      : {}),
    ...(input.imagemObjectKey !== undefined
      ? { imagemObjectKey: input.imagemObjectKey }
      : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.dataPublicacao !== undefined
      ? { dataPublicacao: input.dataPublicacao }
      : {}),
  };
}

function toCategoriaWhere(search?: string): Prisma.CategoriaWhereInput {
  return toNomeWhere(search);
}

function toTagWhere(search?: string): Prisma.TagWhereInput {
  return toNomeWhere(search);
}

function toNomeWhere(search?: string): { nome?: Prisma.StringFilter } {
  return search === undefined
    ? {}
    : {
        nome: {
          contains: search,
          mode: 'insensitive',
        },
      };
}
