export interface PasswordRecoveryRecord {
  id: string;
  usuarioId: string;
  codigoHash: string;
  expiraEm: Date;
  tentativas: number;
  bloqueadoEm: Date | null;
  codigoValidadoEm: Date | null;
  resetTokenHash: string | null;
  resetTokenExpiraEm: Date | null;
  tokenUtilizadoEm: Date | null;
}
export interface PasswordRecoveryRepository {
  invalidateActiveByUsuarioId(usuarioId: string, now: Date): Promise<void>;
  create(input: {
    usuarioId: string;
    codigoHash: string;
    expiraEm: Date;
  }): Promise<void>;
  findLatestByUsuarioId(
    usuarioId: string,
  ): Promise<PasswordRecoveryRecord | null>;
  incrementAttempts(id: string, blockedAt?: Date): Promise<void>;
  setValidated(
    id: string,
    tokenHash: string,
    tokenExpiresAt: Date,
    now: Date,
  ): Promise<void>;
  findByResetTokenHash(
    tokenHash: string,
  ): Promise<PasswordRecoveryRecord | null>;
  consume(id: string, now: Date): Promise<void>;
  countRequests(input: {
    emailHash: string;
    ipHash: string;
    since: Date;
  }): Promise<{ email: number; ip: number }>;
  findLastRequest(emailHash: string): Promise<Date | null>;
  registerRequest(input: { emailHash: string; ipHash: string }): Promise<void>;
}
export const PASSWORD_RECOVERY_REPOSITORY = Symbol(
  'PASSWORD_RECOVERY_REPOSITORY',
);
