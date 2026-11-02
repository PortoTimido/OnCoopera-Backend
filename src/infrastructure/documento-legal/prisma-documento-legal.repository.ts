import { Prisma } from '../../generated/prisma/client.js';
import { DocumentoLegalApplicationError } from '../../application/documento-legal/errors/documento-legal-application.error.js';
import type { DocumentoLegalRepository } from '../../application/documento-legal/ports/documento-legal.repository.js';
import type {
  PublicDocumentoLegal,
  TipoDocumentoLegal,
} from '../../domain/documento-legal/documento-legal.js';
import { PrismaService } from '../database/prisma.service.js';

export class PrismaDocumentoLegalRepository implements DocumentoLegalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTipo(
    tipo: TipoDocumentoLegal,
  ): Promise<PublicDocumentoLegal | null> {
    const document = await this.prisma.documentoLegal.findUnique({
      where: { tipo },
    });

    return document === null ? null : toPublicDocumentoLegal(document);
  }

  async create(input: {
    tipo: TipoDocumentoLegal;
    versao: string;
    conteudo: string;
    atualizadoEm: Date;
  }): Promise<PublicDocumentoLegal> {
    try {
      const document = await this.prisma.documentoLegal.create({
        data: input,
      });
      return toPublicDocumentoLegal(document);
    } catch (error) {
      throw mapPersistenceError(error);
    }
  }

  async updateIfVersion(input: {
    tipo: TipoDocumentoLegal;
    versaoAtual: string;
    proximaVersao: string;
    conteudo: string;
    atualizadoEm: Date;
  }): Promise<PublicDocumentoLegal | null> {
    const result = await this.prisma.documentoLegal.updateMany({
      where: { tipo: input.tipo, versao: input.versaoAtual },
      data: {
        versao: input.proximaVersao,
        conteudo: input.conteudo,
        atualizadoEm: input.atualizadoEm,
      },
    });

    if (result.count === 0) return null;

    const document = await this.prisma.documentoLegal.findUniqueOrThrow({
      where: { tipo: input.tipo },
    });
    return toPublicDocumentoLegal(document);
  }
}

function toPublicDocumentoLegal(record: {
  id: string;
  tipo: string;
  versao: string;
  conteudo: string;
  atualizadoEm: Date;
}): PublicDocumentoLegal {
  return {
    ...record,
    tipo: record.tipo as TipoDocumentoLegal,
  };
}

function mapPersistenceError(error: unknown): Error {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new DocumentoLegalApplicationError(
        'CONFLICT',
        'Já existe um documento para este tipo.',
      );
    }
  }

  return error instanceof Error ? error : new Error('Erro de persistência.');
}
