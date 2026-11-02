import { Prisma } from '../../generated/prisma/client.js';
import type {
  TermosUsoAceiteRepository,
  TermosUsoVigente,
} from '../../application/usuario-autenticacao/ports/termos-uso-aceite.repository.js';
import { PrismaService } from '../database/prisma.service.js';

export class PrismaTermosUsoAceiteRepository implements TermosUsoAceiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTermosUsoVigente(): Promise<TermosUsoVigente | null> {
    return this.prisma.documentoLegal.findUnique({
      where: { tipo: 'TERMOS_USO' },
      select: { id: true },
    });
  }

  async hasAceite(usuarioId: string, documentoId: string): Promise<boolean> {
    const count = await this.prisma.aceiteDocumento.count({
      where: { usuarioId, documentoId },
    });
    return count > 0;
  }

  async registerAceite(
    usuarioId: string,
    documentoId: string,
    aceitoEm: Date,
  ): Promise<void> {
    try {
      await this.prisma.aceiteDocumento.create({
        data: { usuarioId, documentoId, aceitoEm },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }
}
