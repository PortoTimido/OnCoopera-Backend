import { Artigo } from '../../../domain/artigo/entities/artigo.entity.js';
import { ConteudoArtigo } from '../../../domain/artigo/value-objects/conteudo-artigo.value-object.js';
import { ImagemUrl } from '../../../domain/artigo/value-objects/imagem-url.value-object.js';
import { TempoLeitura } from '../../../domain/artigo/value-objects/tempo-leitura.value-object.js';
import { TituloArtigo } from '../../../domain/artigo/value-objects/titulo-artigo.value-object.js';
import type { StatusArtigo } from '../../../domain/artigo/entities/artigo.entity.js';
import type { ArtigoRepository } from '../ports/artigo.repository.js';

export interface CreateArtigoInput {
  autorId: string;
  titulo: string;
  conteudo: string;
  tempoLeituraMinutos: number;
  imagemUrl?: string | null;
  status: StatusArtigo;
  categoriaIds: string[];
  tagIds?: string[];
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
      conteudo: ConteudoArtigo.create(input.conteudo),
      tempoLeitura: TempoLeitura.create(input.tempoLeituraMinutos),
      imagemUrl:
        input.imagemUrl === undefined || input.imagemUrl === null
          ? null
          : ImagemUrl.create(input.imagemUrl),
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
      conteudo: preview.toPublic().conteudo,
      tempoLeituraMinutos: preview.toPublic().tempoLeituraMinutos,
      imagemUrl: preview.toPublic().imagemUrl,
      status: input.status,
      categoriaIds: input.categoriaIds,
      tagIds: input.tagIds ?? [],
      dataPublicacao,
    });
  }
}
