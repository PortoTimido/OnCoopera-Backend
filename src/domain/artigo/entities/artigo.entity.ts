import { ConteudoArtigo } from '../value-objects/conteudo-artigo.value-object.js';
import { ImagemUrl } from '../value-objects/imagem-url.value-object.js';
import { TempoLeitura } from '../value-objects/tempo-leitura.value-object.js';
import { TituloArtigo } from '../value-objects/titulo-artigo.value-object.js';
import { DomainValidationError } from '../errors/domain-validation.error.js';

export const STATUS_ARTIGO = ['RASCUNHO', 'PUBLICADO', 'DESATIVADO'] as const;
export type StatusArtigo = (typeof STATUS_ARTIGO)[number];

export interface PublicTaxonomia {
  id: string;
  nome: string;
}

export interface PublicArtigo {
  id: string;
  autorId: string;
  titulo: string;
  conteudo: string;
  tempoLeituraMinutos: number;
  imagemUrl: string | null;
  status: StatusArtigo;
  categorias: PublicTaxonomia[];
  tags: PublicTaxonomia[];
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataPublicacao: Date | null;
}

export interface ArtigoProps {
  id: string;
  autorId: string;
  titulo: TituloArtigo;
  conteudo: ConteudoArtigo;
  tempoLeitura: TempoLeitura;
  imagemUrl: ImagemUrl | null;
  status: StatusArtigo;
  categorias: PublicTaxonomia[];
  tags: PublicTaxonomia[];
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataPublicacao: Date | null;
}

export class Artigo {
  private readonly props: ArtigoProps;

  private constructor(props: ArtigoProps) {
    this.props = props;
  }

  static create(props: ArtigoProps): Artigo {
    if (props.categorias.length === 0) {
      throw new DomainValidationError(
        'Artigo deve possuir ao menos uma categoria.',
      );
    }

    if (props.status === 'RASCUNHO' && props.dataPublicacao !== null) {
      throw new DomainValidationError(
        'Artigo em rascunho nao deve possuir data de publicacao.',
      );
    }

    if (props.status === 'PUBLICADO' && props.dataPublicacao === null) {
      throw new DomainValidationError(
        'Artigo publicado deve possuir data de publicacao.',
      );
    }

    return new Artigo(props);
  }

  get id(): string {
    return this.props.id;
  }

  get status(): StatusArtigo {
    return this.props.status;
  }

  publicar(publicadoEm = new Date()): Artigo {
    return new Artigo({
      ...this.props,
      status: 'PUBLICADO',
      dataAtualizacao: publicadoEm,
      dataPublicacao: this.props.dataPublicacao ?? publicadoEm,
    });
  }

  rascunhar(atualizadoEm = new Date()): Artigo {
    return new Artigo({
      ...this.props,
      status: 'RASCUNHO',
      dataAtualizacao: atualizadoEm,
      dataPublicacao: null,
    });
  }

  desativar(desativadoEm = new Date()): Artigo {
    return new Artigo({
      ...this.props,
      status: 'DESATIVADO',
      dataAtualizacao: desativadoEm,
    });
  }

  toPublic(): PublicArtigo {
    return {
      id: this.props.id,
      autorId: this.props.autorId,
      titulo: this.props.titulo.value,
      conteudo: this.props.conteudo.value,
      tempoLeituraMinutos: this.props.tempoLeitura.calcularMinutos(),
      imagemUrl: this.props.imagemUrl?.value ?? null,
      status: this.props.status,
      categorias: this.props.categorias.map((categoria) => ({ ...categoria })),
      tags: this.props.tags.map((tag) => ({ ...tag })),
      dataCriacao: this.props.dataCriacao,
      dataAtualizacao: this.props.dataAtualizacao,
      dataPublicacao: this.props.dataPublicacao,
    };
  }
}
