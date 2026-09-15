import type { PasswordRecoveryRecord, PasswordRecoveryRepository } from '../../application/usuario-autenticacao/ports/password-recovery.repository.js';
import { PrismaService } from '../database/prisma.service.js';

export class PrismaPasswordRecoveryRepository implements PasswordRecoveryRepository {
  constructor(private readonly prisma: PrismaService) {}
  async invalidateActiveByUsuarioId(usuarioId: string, now: Date) { await this.prisma.recuperacaoSenha.updateMany({ where: { usuarioId, tokenUtilizadoEm: null }, data: { tokenUtilizadoEm: now } }); }
  async create(input: { usuarioId: string; codigoHash: string; expiraEm: Date }) { await this.prisma.recuperacaoSenha.create({ data: input }); }
  async findLatestByUsuarioId(usuarioId: string): Promise<PasswordRecoveryRecord | null> { return this.prisma.recuperacaoSenha.findFirst({ where: { usuarioId }, orderBy: { criadoEm: 'desc' } }); }
  async incrementAttempts(id: string, blockedAt?: Date) { await this.prisma.recuperacaoSenha.update({ where: { id }, data: { tentativas: { increment: 1 }, ...(blockedAt ? { bloqueadoEm: blockedAt } : {}) } }); }
  async setValidated(id: string, tokenHash: string, tokenExpiresAt: Date, now: Date) { await this.prisma.recuperacaoSenha.update({ where: { id }, data: { codigoValidadoEm: now, resetTokenHash: tokenHash, resetTokenExpiraEm: tokenExpiresAt } }); }
  async findByResetTokenHash(resetTokenHash: string): Promise<PasswordRecoveryRecord | null> { return this.prisma.recuperacaoSenha.findFirst({ where: { resetTokenHash }, orderBy: { criadoEm: 'desc' } }); }
  async consume(id: string, now: Date) { await this.prisma.recuperacaoSenha.update({ where: { id }, data: { tokenUtilizadoEm: now } }); }
  async countRequests(input: { emailHash: string; ipHash: string; since: Date }) { const [email, ip] = await Promise.all([this.prisma.limiteRecuperacaoSenha.count({ where: { emailHash: input.emailHash, criadoEm: { gte: input.since } } }), this.prisma.limiteRecuperacaoSenha.count({ where: { ipHash: input.ipHash, criadoEm: { gte: input.since } } })]); return { email, ip }; }
  async findLastRequest(emailHash: string) { const result = await this.prisma.limiteRecuperacaoSenha.findFirst({ where: { emailHash }, orderBy: { criadoEm: 'desc' } }); return result?.criadoEm ?? null; }
  async registerRequest(input: { emailHash: string; ipHash: string }) { await this.prisma.limiteRecuperacaoSenha.create({ data: input }); }
}
