import type {
  PublicDocumentoLegal,
  TipoDocumentoLegal,
} from '../../../domain/documento-legal/documento-legal.js';

export const DOCUMENTO_LEGAL_REPOSITORY = Symbol('DOCUMENTO_LEGAL_REPOSITORY');

export interface DocumentoLegalRepository {
  findByTipo(tipo: TipoDocumentoLegal): Promise<PublicDocumentoLegal | null>;
  create(input: {
    tipo: TipoDocumentoLegal;
    versao: string;
    conteudo: string;
    atualizadoEm: Date;
  }): Promise<PublicDocumentoLegal>;
  updateIfVersion(input: {
    tipo: TipoDocumentoLegal;
    versaoAtual: string;
    proximaVersao: string;
    conteudo: string;
    atualizadoEm: Date;
  }): Promise<PublicDocumentoLegal | null>;
}
