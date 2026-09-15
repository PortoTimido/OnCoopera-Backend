import { assertValidPlainPassword } from '../../../domain/usuario-autenticacao/services/password-policy.js';
import type { EmailService } from '../../email/email.service.js';
import { adminTemporaryPasswordTemplate } from '../../../infrastructure/email/templates.js';
import type { AuthConfig } from '../ports/auth-config.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { TemporaryPasswordGenerator } from '../ports/temporary-password-generator.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';

export class ResendTemporaryAccessUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly sessions: AuthSessionRepository,
    private readonly passwords: PasswordHasher,
    private readonly generator: TemporaryPasswordGenerator,
    private readonly email: EmailService,
    private readonly config: AuthConfig,
  ) {}
  async execute(
    usuarioId: string,
  ): Promise<{ senhaTemporaria: string; emailEnvio: 'ENVIADO' | 'FALHOU' }> {
    const usuario = await this.usuarios.findById(usuarioId);
    if (!usuario || usuario.tipo !== 'ADMINISTRADOR' || !usuario.isActive())
      throw new AuthApplicationError(
        'NOT_FOUND',
        'Administrador não encontrado.',
      );
    const senhaTemporaria = this.generator.generate();
    assertValidPlainPassword(senhaTemporaria);
    const expiration = new Date(
      Date.now() + this.config.temporaryPasswordTtlHours * 3_600_000,
    );
    await this.usuarios.updatePasswordHash(
      usuario.id,
      await this.passwords.hash(senhaTemporaria),
      { trocaSenhaObrigatoria: true, senhaTemporariaExpiraEm: expiration },
    );
    await this.sessions.revokeAllByUsuarioId(usuario.id, new Date());
    const template = adminTemporaryPasswordTemplate({
      nome: usuario.nome,
      email: usuario.email,
      senha: senhaTemporaria,
      ttlHours: this.config.temporaryPasswordTtlHours,
    });
    return {
      senhaTemporaria,
      emailEnvio: await this.email.send({
        tipo: 'REENVIO_ACESSO_TEMPORARIO_ADMINISTRADOR',
        to: usuario.email,
        ...template,
      }),
    };
  }
}
