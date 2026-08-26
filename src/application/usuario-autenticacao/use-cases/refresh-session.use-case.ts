import { Usuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { AccessTokenService } from '../ports/access-token.service.js';
import type { AuthConfig } from '../ports/auth-config.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { SecretGenerator } from '../ports/secret-generator.js';
import type { TokenHasher } from '../ports/token-hasher.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';

export interface RefreshSessionInput {
  refreshToken: string;
  csrfToken: string | undefined;
}

export interface RefreshSessionOutput {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  refreshExpiresAt: Date;
  usuario: ReturnType<Usuario['toPublic']>;
}

export class RefreshSessionUseCase {
  private readonly usuarios: UsuarioRepository;
  private readonly sessions: AuthSessionRepository;
  private readonly accessTokens: AccessTokenService;
  private readonly tokenHasher: TokenHasher;
  private readonly secretGenerator: SecretGenerator;
  private readonly config: AuthConfig;

  constructor(
    usuarios: UsuarioRepository,
    sessions: AuthSessionRepository,
    accessTokens: AccessTokenService,
    tokenHasher: TokenHasher,
    secretGenerator: SecretGenerator,
    config: AuthConfig,
  ) {
    this.usuarios = usuarios;
    this.sessions = sessions;
    this.accessTokens = accessTokens;
    this.tokenHasher = tokenHasher;
    this.secretGenerator = secretGenerator;
    this.config = config;
  }

  async execute(input: RefreshSessionInput): Promise<RefreshSessionOutput> {
    const session = await this.sessions.findByRefreshTokenHash(
      this.tokenHasher.hash(input.refreshToken),
    );

    if (session === null || !session.isActive()) {
      throw new AuthApplicationError(
        'INVALID_REFRESH_TOKEN',
        'Sessão inválida.',
      );
    }

    if (
      input.csrfToken === undefined ||
      !this.tokenHasher.matches(input.csrfToken, session.csrfTokenHash)
    ) {
      throw new AuthApplicationError('INVALID_CSRF_TOKEN', 'CSRF inválido.');
    }

    const usuario = await this.usuarios.findById(session.usuarioId);

    if (usuario === null || !usuario.isActive()) {
      throw new AuthApplicationError(
        'UNAUTHORIZED',
        'Usuário não autenticado.',
      );
    }

    const now = new Date();
    const refreshToken = this.secretGenerator.generate();
    const csrfToken = this.secretGenerator.generate();
    const refreshExpiresAt = addDays(now, this.config.refreshTokenTtlDays);

    const rotatedSession = await this.sessions.rotate({
      id: session.id,
      refreshTokenHash: this.tokenHasher.hash(refreshToken),
      csrfTokenHash: this.tokenHasher.hash(csrfToken),
      expiresAt: refreshExpiresAt,
      lastUsedAt: now,
    });

    const accessToken = await this.accessTokens.sign({
      sub: usuario.id,
      sid: rotatedSession.id,
    });

    return {
      accessToken,
      refreshToken,
      csrfToken,
      refreshExpiresAt,
      usuario: usuario.toPublic(),
    };
  }
}

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);

  return date;
}
