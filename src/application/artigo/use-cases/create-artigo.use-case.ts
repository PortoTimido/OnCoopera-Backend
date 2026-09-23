import { Artigo } from '../../../domain/artigo/entities/artigo.entity.js';
import { ConteudoArtigo } from '../../../domain/artigo/value-objects/conteudo-artigo.value-object.js';
import { ResumoArtigo } from '../../../domain/artigo/value-objects/resumo-artigo.value-object.js';
import { TempoLeitura } from '../../../domain/artigo/value-objects/tempo-leitura.value-object.js';
import { TituloArtigo } from '../../../domain/artigo/value-objects/titulo-artigo.value-object.js';
import type { StatusArtigo } from '../../../domain/artigo/entities/artigo.entity.js';
import type { ArtigoRepository } from '../ports/artigo.repository.js';

export interface CreateArtigoInput {
  autorId: string;
  titulo: string;
  resumo?: string | null;
  conteudo: string;
  tempoLeituraMinutos: number;
  status: StatusArtigo;
  categoriaIds: string[];
  tagIds?: string[];
}

function toResumo(resumo?: string | null): ResumoArtigo | null {
  if (resumo === undefined || resumo === null) return null;
  const normalized = resumo.trim();
  return normalized.length === 0 ? null : ResumoArtigo.create(normalized);
}

export class CreateArtigoUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(input: CreateArtigoInput) {
    const now = new Date();
    const dataPublicacao = input.status === 'PUBLICADO' ? now : null;
    const preview = Artigo.create({
      id: 'preview',
      autorId: input.autorId,
      titulo: TituloArtigo.create(input.titulo),
      resumo: toResumo(input.resumo),
      conteudo: ConteudoArtigo.create(input.conteudo),
      tempoLeitura: TempoLeitura.create(input.tempoLeituraMinutos),
      imagemUrl: null,
      status: input.status,
      categorias: input.categoriaIds.map((id) => ({ id, nome: id })),
      tags: (input.tagIds ?? []).map((id) => ({ id, nome: id })),
      dataCriacao: now,
      dataAtualizacao: now,
      dataPublicacao,
    });

    return this.artigos.createArtigo({
      autorId: input.autorId,
      titulo: preview.toPublic().titulo,
      resumo: preview.toPublic().resumo,
      conteudo: preview.toPublic().conteudo,
      tempoLeituraMinutos: preview.toPublic().tempoLeituraMinutos,
      imagemObjectKey: null,
      status: input.status,
      categoriaIds: input.categoriaIds,
      tagIds: input.tagIds ?? [],
      dataPublicacao,
    });
  }
}
