import { assertValidPlainPassword } from '../../../domain/usuario-autenticacao/services/password-policy.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';

export interface ChangePasswordInput {
  usuarioId: string;
  senhaAtual: string;
  novaSenha: string;
}

export class ChangePasswordUseCase {
  private readonly usuarios: UsuarioRepository;
  private readonly sessions: AuthSessionRepository;
  private readonly passwordHasher: PasswordHasher;

  constructor(
    usuarios: UsuarioRepository,
    sessions: AuthSessionRepository,
    passwordHasher: PasswordHasher,
  ) {
    this.usuarios = usuarios;
    this.sessions = sessions;
    this.passwordHasher = passwordHasher;
  }

  async execute(input: ChangePasswordInput): Promise<void> {
    const usuario = await this.usuarios.findById(input.usuarioId);

    if (usuario === null || !usuario.isActive()) {
      throw new AuthApplicationError(
        'UNAUTHORIZED',
        'Usuário não autenticado.',
      );
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.senhaAtual,
      usuario.senhaHash.value,
    );

    if (!passwordMatches) {
      throw new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'Credenciais inválidas.',
      );
    }

    try {
      assertValidPlainPassword(input.novaSenha);
    } catch (error) {
      throw new AuthApplicationError(
        'INVALID_PASSWORD_POLICY',
        error instanceof Error ? error.message : 'Senha inválida.',
      );
    }

    const newPasswordHash = await this.passwordHasher.hash(input.novaSenha);

    await this.usuarios.updatePasswordHash(input.usuarioId, newPasswordHash, {
      trocaSenhaObrigatoria: false,
      senhaTemporariaExpiraEm: null,
    });
    await this.sessions.revokeAllByUsuarioId(input.usuarioId, new Date());
  }
}
