import type { EmailAuditRepository } from '../../application/email/email.service.js';
import { PrismaService } from '../database/prisma.service.js';

export class PrismaEmailAuditRepository implements EmailAuditRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(input: {
    tipo: string;
    destinatarioMascarado: string;
  }): Promise<string> {
    const email = await this.prisma.emailEnvio.create({ data: input });
    return email.id;
  }
  async update(
    id: string,
    input: {
      status: 'ENVIADO' | 'FALHOU';
      tentativas: number;
      erroCodigo?: string;
    },
  ): Promise<void> {
    await this.prisma.emailEnvio.update({
      where: { id },
      data: {
        ...input,
        enviadoEm: input.status === 'ENVIADO' ? new Date() : undefined,
      },
    });
  }
}
