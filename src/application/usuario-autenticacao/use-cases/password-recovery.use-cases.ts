import { randomInt } from 'node:crypto';
import { assertValidPlainPassword } from '../../../domain/usuario-autenticacao/services/password-policy.js';
import type { EmailService } from '../../email/email.service.js';
import type { AuthConfig } from '../ports/auth-config.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { PasswordRecoveryRepository } from '../ports/password-recovery.repository.js';
import type { SecretGenerator } from '../ports/secret-generator.js';
import type { TokenHasher } from '../ports/token-hasher.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import { passwordRecoveryTemplate } from '../../../infrastructure/email/templates.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';

export class RequestPasswordRecoveryUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly recoveries: PasswordRecoveryRepository,
    private readonly tokens: TokenHasher,
    private readonly email: EmailService,
    private readonly config: AuthConfig,
  ) {}
  async execute(input: { email: string; ip: string }): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const now = new Date();
    const emailHash = this.tokens.hash(email);
    const ipHash = this.tokens.hash(input.ip);
    const since = new Date(
      now.getTime() -
        this.config.passwordRecoveryRateLimitWindowMinutes * 60_000,
    );
    const [counts, last] = await Promise.all([
      this.recoveries.countRequests({ emailHash, ipHash, since }),
      this.recoveries.findLastRequest(emailHash),
    ]);
    if (
      counts.email >= this.config.passwordRecoveryRateLimitMaxRequests ||
      counts.ip >= this.config.passwordRecoveryRateLimitMaxRequests ||
      (last &&
        now.getTime() - last.getTime() <
          this.config.passwordRecoveryResendIntervalSeconds * 1000)
    )
      return;
    await this.recoveries.registerRequest({ emailHash, ipHash });
    const usuario = await this.usuarios.findByIdentifier(email);
    if (usuario === null || !usuario.isActive() || usuario.email !== email)
      return;
    await this.recoveries.invalidateActiveByUsuarioId(usuario.id, now);
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.recoveries.create({
      usuarioId: usuario.id,
      codigoHash: this.tokens.hash(codigo),
      expiraEm: new Date(
        now.getTime() + this.config.passwordRecoveryCodeTtlMinutes * 60_000,
      ),
    });
    const template = passwordRecoveryTemplate({
      nome: usuario.nome,
      codigo,
      ttlMinutes: this.config.passwordRecoveryCodeTtlMinutes,
    });
    await this.email.send({
      tipo: 'RECUPERACAO_SENHA',
      to: email,
      ...template,
    });
  }
}

export class VerifyPasswordRecoveryCodeUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly recoveries: PasswordRecoveryRepository,
    private readonly tokens: TokenHasher,
    private readonly secrets: SecretGenerator,
    private readonly config: AuthConfig,
  ) {}
  async execute(input: {
    email: string;
    code: string;
  }): Promise<{ resetToken: string }> {
    const usuario = await this.usuarios.findByIdentifier(
      input.email.trim().toLowerCase(),
    );
    if (!usuario || usuario.email !== input.email.trim().toLowerCase())
      throw invalidCode();
    const recovery = await this.recoveries.findLatestByUsuarioId(usuario.id);
    const now = new Date();
    if (
      !recovery ||
      recovery.codigoValidadoEm ||
      recovery.bloqueadoEm ||
      recovery.expiraEm <= now ||
      recovery.tokenUtilizadoEm ||
      !this.tokens.matches(input.code, recovery.codigoHash)
    ) {
      if (
        recovery &&
        !recovery.bloqueadoEm &&
        recovery.expiraEm > now &&
        !recovery.codigoValidadoEm
      )
        await this.recoveries.incrementAttempts(
          recovery.id,
          recovery.tentativas + 1 >= this.config.passwordRecoveryMaxAttempts
            ? now
            : undefined,
        );
      throw invalidCode();
    }
    const resetToken = this.secrets.generate();
    await this.recoveries.setValidated(
      recovery.id,
      this.tokens.hash(resetToken),
      new Date(
        now.getTime() +
          this.config.passwordRecoveryResetTokenTtlMinutes * 60_000,
      ),
      now,
    );
    return { resetToken };
  }
}

export class ResetPasswordWithTokenUseCase {
  constructor(
    private readonly recoveries: PasswordRecoveryRepository,
    private readonly tokens: TokenHasher,
    private readonly passwords: PasswordHasher,
    private readonly usuarios: UsuarioRepository,
    private readonly sessions: AuthSessionRepository,
  ) {}
  async execute(input: {
    resetToken: string;
    newPassword: string;
  }): Promise<void> {
    const recovery = await this.recoveries.findByResetTokenHash(
      this.tokens.hash(input.resetToken),
    );
    const now = new Date();
    if (
      !recovery ||
      recovery.tokenUtilizadoEm ||
      !recovery.resetTokenExpiraEm ||
      recovery.resetTokenExpiraEm <= now
    )
      throw invalidCode();
    try {
      assertValidPlainPassword(input.newPassword);
    } catch (error) {
      throw new AuthApplicationError(
        'INVALID_PASSWORD_POLICY',
        error instanceof Error ? error.message : 'Senha inválida.',
      );
    }
    await this.usuarios.updatePasswordHash(
      recovery.usuarioId,
      await this.passwords.hash(input.newPassword),
      { trocaSenhaObrigatoria: false, senhaTemporariaExpiraEm: null },
    );
    await this.recoveries.consume(recovery.id, now);
    await this.sessions.revokeAllByUsuarioId(recovery.usuarioId, now);
  }
}
function invalidCode() {
  return new AuthApplicationError(
    'INVALID_CREDENTIALS',
    'Código ou token de recuperação inválido ou expirado.',
  );
}
