import { AuthSession } from '../../../domain/usuario-autenticacao/entities/auth-session.entity.js';

export interface CreateAuthSessionInput {
  usuarioId: string;
  refreshTokenHash: string;
  csrfTokenHash: string;
  expiresAt: Date;
}

export interface RotateAuthSessionInput {
  id: string;
  refreshTokenHash: string;
  csrfTokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date;
}

export interface AuthSessionRepository {
  create(input: CreateAuthSessionInput): Promise<AuthSession>;
  findById(id: string): Promise<AuthSession | null>;
  findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null>;
  rotate(input: RotateAuthSessionInput): Promise<AuthSession>;
  revoke(id: string, revokedAt: Date): Promise<void>;
  revokeAllByUsuarioId(usuarioId: string, revokedAt: Date): Promise<void>;
}

export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');
