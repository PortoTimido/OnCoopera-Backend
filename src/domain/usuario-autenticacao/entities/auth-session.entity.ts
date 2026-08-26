export interface AuthSessionProps {
  id: string;
  usuarioId: string;
  refreshTokenHash: string;
  csrfTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
}

export class AuthSession {
  readonly id: string;
  readonly usuarioId: string;
  readonly refreshTokenHash: string;
  readonly csrfTokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly lastUsedAt: Date | null;

  constructor(props: AuthSessionProps) {
    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.refreshTokenHash = props.refreshTokenHash;
    this.csrfTokenHash = props.csrfTokenHash;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
    this.lastUsedAt = props.lastUsedAt;
  }

  isActive(now = new Date()): boolean {
    return this.revokedAt === null && this.expiresAt > now;
  }
}
