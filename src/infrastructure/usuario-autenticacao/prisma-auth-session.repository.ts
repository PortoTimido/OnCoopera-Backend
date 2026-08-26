import { AuthSession } from '../../domain/usuario-autenticacao/entities/auth-session.entity.js';
import type {
  AuthSessionRepository,
  CreateAuthSessionInput,
  RotateAuthSessionInput,
} from '../../application/usuario-autenticacao/ports/auth-session.repository.js';
import { PrismaService } from '../database/prisma.service.js';

interface AuthSessionPersistenceRecord {
  id: string;
  usuarioId: string;
  refreshTokenHash: string;
  csrfTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}

export class PrismaAuthSessionRepository implements AuthSessionRepository {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async create(input: CreateAuthSessionInput): Promise<AuthSession> {
    const record = await this.prisma.sessaoAutenticacao.create({
      data: input,
    });

    return toDomain(record);
  }

  async findById(id: string): Promise<AuthSession | null> {
    const record = await this.prisma.sessaoAutenticacao.findUnique({
      where: { id },
    });

    return record === null ? null : toDomain(record);
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSession | null> {
    const record = await this.prisma.sessaoAutenticacao.findUnique({
      where: { refreshTokenHash },
    });

    return record === null ? null : toDomain(record);
  }

  async rotate(input: RotateAuthSessionInput): Promise<AuthSession> {
    const record = await this.prisma.sessaoAutenticacao.update({
      where: { id: input.id },
      data: {
        refreshTokenHash: input.refreshTokenHash,
        csrfTokenHash: input.csrfTokenHash,
        expiresAt: input.expiresAt,
        lastUsedAt: input.lastUsedAt,
      },
    });

    return toDomain(record);
  }

  async revoke(id: string, revokedAt: Date): Promise<void> {
    await this.prisma.sessaoAutenticacao.update({
      where: { id },
      data: { revokedAt },
    });
  }

  async revokeAllByUsuarioId(
    usuarioId: string,
    revokedAt: Date,
  ): Promise<void> {
    await this.prisma.sessaoAutenticacao.updateMany({
      where: {
        usuarioId,
        revokedAt: null,
      },
      data: { revokedAt },
    });
  }
}

function toDomain(record: AuthSessionPersistenceRecord): AuthSession {
  return new AuthSession({
    id: record.id,
    usuarioId: record.usuarioId,
    refreshTokenHash: record.refreshTokenHash,
    csrfTokenHash: record.csrfTokenHash,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt,
    lastUsedAt: record.lastUsedAt,
  });
}
