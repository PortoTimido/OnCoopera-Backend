import type { Usuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import type { AccessTokenService } from '../ports/access-token.service.js';
import type { AuthConfig } from '../ports/auth-config.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { SecretGenerator } from '../ports/secret-generator.js';
import type { TokenHasher } from '../ports/token-hasher.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';

export interface IssuedAuthSession {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  refreshExpiresAt: Date;
  usuario: ReturnType<Usuario['toPublic']>;
}

export class IssueAuthSessionService {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly sessions: AuthSessionRepository,
    private readonly accessTokens: AccessTokenService,
    private readonly tokenHasher: TokenHasher,
    private readonly secretGenerator: SecretGenerator,
    private readonly config: AuthConfig,
  ) {}

  async issue(usuario: Usuario): Promise<IssuedAuthSession> {
    const now = new Date();
    const refreshToken = this.secretGenerator.generate();
    const csrfToken = this.secretGenerator.generate();
    const refreshExpiresAt = addDays(now, this.config.refreshTokenTtlDays);

    const session = await this.sessions.create({
      usuarioId: usuario.id,
      refreshTokenHash: this.tokenHasher.hash(refreshToken),
      csrfTokenHash: this.tokenHasher.hash(csrfToken),
      expiresAt: refreshExpiresAt,
    });

    await this.usuarios.updateLastAccess(usuario.id, now);

    const accessToken = await this.accessTokens.sign({
      sub: usuario.id,
      sid: session.id,
    });

    return {
      accessToken,
      refreshToken,
      csrfToken,
      refreshExpiresAt,
      usuario: usuario.registrarUltimoAcesso(now).toPublic(),
    };
  }
}

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}
