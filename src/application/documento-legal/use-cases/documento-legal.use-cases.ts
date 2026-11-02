import {
  proximaVersaoDocumentoLegal,
  type TipoDocumentoLegal,
} from '../../../domain/documento-legal/documento-legal.js';
import { DocumentoLegalApplicationError } from '../errors/documento-legal-application.error.js';
import type { DocumentoLegalRepository } from '../ports/documento-legal.repository.js';

export class GetDocumentoLegalUseCase {
  constructor(private readonly documentos: DocumentoLegalRepository) {}

  async execute(tipo: TipoDocumentoLegal) {
    const documento = await this.documentos.findByTipo(tipo);

    if (documento === null) {
      throw new DocumentoLegalApplicationError(
        'NOT_FOUND',
        'Documento legal não encontrado.',
      );
    }

    return documento;
  }
}

export class CreateDocumentoLegalUseCase {
  constructor(private readonly documentos: DocumentoLegalRepository) {}

  execute(input: { tipo: TipoDocumentoLegal; conteudo: string }) {
    return this.documentos.create({
      ...input,
      versao: '1.0',
      atualizadoEm: new Date(),
    });
  }
}

export class UpdateDocumentoLegalUseCase {
  constructor(private readonly documentos: DocumentoLegalRepository) {}

  async execute(input: { tipo: TipoDocumentoLegal; conteudo: string }) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const atual = await this.documentos.findByTipo(input.tipo);

      if (atual === null) {
        throw new DocumentoLegalApplicationError(
          'NOT_FOUND',
          'Documento legal não encontrado.',
        );
      }

      let proximaVersao: string;
      try {
        proximaVersao = proximaVersaoDocumentoLegal(atual.versao);
      } catch (error) {
        throw new DocumentoLegalApplicationError(
          'CONFLICT',
          error instanceof Error ? error.message : 'Versão inválida.',
        );
      }

      const atualizado = await this.documentos.updateIfVersion({
        tipo: input.tipo,
        versaoAtual: atual.versao,
        proximaVersao,
        conteudo: input.conteudo,
        atualizadoEm: new Date(),
      });

      if (atualizado !== null) return atualizado;
    }

    throw new DocumentoLegalApplicationError(
      'CONFLICT',
      'O documento foi atualizado simultaneamente. Tente novamente.',
    );
  }
}
