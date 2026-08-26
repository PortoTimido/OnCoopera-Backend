import { Usuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { AccessTokenService } from '../ports/access-token.service.js';
import type { AuthConfig } from '../ports/auth-config.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { SecretGenerator } from '../ports/secret-generator.js';
import type { TokenHasher } from '../ports/token-hasher.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';

export interface AuthenticateUserInput {
  identificador: string;
  senha: string;
}

export interface AuthenticatedUserOutput {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  refreshExpiresAt: Date;
  usuario: ReturnType<Usuario['toPublic']>;
}

export class AuthenticateUserUseCase {
  private readonly usuarios: UsuarioRepository;
  private readonly sessions: AuthSessionRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly accessTokens: AccessTokenService;
  private readonly tokenHasher: TokenHasher;
  private readonly secretGenerator: SecretGenerator;
  private readonly config: AuthConfig;

  constructor(
    usuarios: UsuarioRepository,
    sessions: AuthSessionRepository,
    passwordHasher: PasswordHasher,
    accessTokens: AccessTokenService,
    tokenHasher: TokenHasher,
    secretGenerator: SecretGenerator,
    config: AuthConfig,
  ) {
    this.usuarios = usuarios;
    this.sessions = sessions;
    this.passwordHasher = passwordHasher;
    this.accessTokens = accessTokens;
    this.tokenHasher = tokenHasher;
    this.secretGenerator = secretGenerator;
    this.config = config;
  }

  async execute(
    input: AuthenticateUserInput,
  ): Promise<AuthenticatedUserOutput> {
    const usuario = await this.usuarios.findByIdentifier(input.identificador);

    if (usuario === null || !usuario.isActive()) {
      throw new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'Credenciais inválidas.',
      );
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.senha,
      usuario.senhaHash.value,
    );

    if (!passwordMatches) {
      throw new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'Credenciais inválidas.',
      );
    }

    if (usuario.trocaSenhaObrigatoria) {
      throw new AuthApplicationError(
        'PASSWORD_CHANGE_REQUIRED',
        'Troca de senha obrigatória.',
      );
    }

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

    const usuarioComAcesso = usuario.registrarUltimoAcesso(now);
    const accessToken = await this.accessTokens.sign({
      sub: usuario.id,
      sid: session.id,
    });

    return {
      accessToken,
      refreshToken,
      csrfToken,
      refreshExpiresAt,
      usuario: usuarioComAcesso.toPublic(),
    };
  }
}

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);

  return date;
}
