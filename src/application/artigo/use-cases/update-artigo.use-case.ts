import { ConteudoArtigo } from '../../../domain/artigo/value-objects/conteudo-artigo.value-object.js';
import { ImagemUrl } from '../../../domain/artigo/value-objects/imagem-url.value-object.js';
import { TempoLeitura } from '../../../domain/artigo/value-objects/tempo-leitura.value-object.js';
import { TituloArtigo } from '../../../domain/artigo/value-objects/titulo-artigo.value-object.js';
import type { PublicArtigo, StatusArtigo } from '../../../domain/artigo/entities/artigo.entity.js';
import { ArtigoApplicationError } from '../errors/artigo-application.error.js';
import type { ArtigoRepository } from '../ports/artigo.repository.js';

export interface UpdateArtigoInput {
  titulo?: string;
  conteudo?: string;
  tempoLeituraMinutos?: number;
  imagemUrl?: string | null;
  status?: StatusArtigo;
  categoriaIds?: string[];
  tagIds?: string[];
}

export class UpdateArtigoUseCase {
  constructor(private readonly artigos: ArtigoRepository) {}

  async execute(id: string, input: UpdateArtigoInput): Promise<PublicArtigo> {
    const current = await this.artigos.findArtigoById(id);

    if (current === null) {
      throw new ArtigoApplicationError('NOT_FOUND', 'Artigo nao encontrado.');
    }

    const dataPublicacao =
      input.status === 'PUBLICADO'
        ? (current.dataPublicacao ?? new Date())
        : input.status === 'RASCUNHO'
          ? null
          : undefined;

    return this.artigos.updateArtigo({
      id,
      ...(input.titulo !== undefined
        ? { titulo: TituloArtigo.create(input.titulo).value }
        : {}),
      ...(input.conteudo !== undefined
        ? { conteudo: ConteudoArtigo.create(input.conteudo).value }
        : {}),
      ...(input.tempoLeituraMinutos !== undefined
        ? {
            tempoLeituraMinutos: TempoLeitura.create(
              input.tempoLeituraMinutos,
            ).calcularMinutos(),
          }
        : {}),
      ...(input.imagemUrl !== undefined
        ? {
            imagemUrl:
              input.imagemUrl === null
                ? null
                : ImagemUrl.create(input.imagemUrl).value,
          }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.categoriaIds !== undefined
        ? { categoriaIds: input.categoriaIds }
        : {}),
      ...(input.tagIds !== undefined ? { tagIds: input.tagIds } : {}),
      ...(dataPublicacao !== undefined ? { dataPublicacao } : {}),
    });
  }
}
