import type {
  PublicArtigo,
  PublicTaxonomia,
  StatusArtigo,
} from '../../../domain/artigo/entities/artigo.entity.js';

export const ARTIGO_REPOSITORY = Symbol('ARTIGO_REPOSITORY');

export interface ListArtigosInput {
  page: number;
  pageSize: number;
  search?: string;
  status?: StatusArtigo;
  categoriaId?: string;
  tagId?: string;
  autorId?: string;
  onlyPublished?: boolean;
}

export interface PaginatedArtigos {
  data: PublicArtigo[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateArtigoRepositoryInput {
  autorId: string;
  titulo: string;
  conteudo: string;
  tempoLeituraMinutos: number;
  imagemObjectKey: string | null;
  status: StatusArtigo;
  categoriaIds: string[];
  tagIds: string[];
  dataPublicacao: Date | null;
}

export interface UpdateArtigoRepositoryInput {
  id: string;
  titulo?: string;
  conteudo?: string;
  tempoLeituraMinutos?: number;
  imagemObjectKey?: string | null;
  status?: StatusArtigo;
  categoriaIds?: string[];
  tagIds?: string[];
  dataPublicacao?: Date | null;
}

export interface UpsertTaxonomiaInput {
  nome: string;
}

export interface ArtigoRepository {
  listArtigos(input: ListArtigosInput): Promise<PaginatedArtigos>;
  findArtigoById(id: string): Promise<PublicArtigo | null>;
  findPublishedArtigoById(id: string): Promise<PublicArtigo | null>;
  createArtigo(input: CreateArtigoRepositoryInput): Promise<PublicArtigo>;
  updateArtigo(input: UpdateArtigoRepositoryInput): Promise<PublicArtigo>;
  findImagemObjectKey(id: string): Promise<string | null>;
  setImagemObjectKey(id: string, objectKey: string | null): Promise<void>;
  desativarArtigo(id: string, desativadoEm: Date): Promise<string | null>;
  listCategorias(search?: string): Promise<PublicTaxonomia[]>;
  createCategoria(input: UpsertTaxonomiaInput): Promise<PublicTaxonomia>;
  updateCategoria(
    id: string,
    input: UpsertTaxonomiaInput,
  ): Promise<PublicTaxonomia>;
  deleteCategoria(id: string): Promise<void>;
  listTags(search?: string): Promise<PublicTaxonomia[]>;
  createTag(input: UpsertTaxonomiaInput): Promise<PublicTaxonomia>;
  updateTag(id: string, input: UpsertTaxonomiaInput): Promise<PublicTaxonomia>;
  deleteTag(id: string): Promise<void>;
}
