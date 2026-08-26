import { assertValidPlainPassword } from '../../../domain/usuario-autenticacao/services/password-policy.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';

export interface ChangeTemporaryPasswordInput {
  identificador: string;
  senhaTemporaria: string;
  novaSenha: string;
}

export class ChangeTemporaryPasswordUseCase {
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

  async execute(input: ChangeTemporaryPasswordInput): Promise<void> {
    const usuario = await this.usuarios.findByIdentifier(input.identificador);

    if (
      usuario === null ||
      !usuario.isActive() ||
      !usuario.trocaSenhaObrigatoria
    ) {
      throw new AuthApplicationError(
        'INVALID_CREDENTIALS',
        'Credenciais inválidas.',
      );
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.senhaTemporaria,
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

    const senhaHash = await this.passwordHasher.hash(input.novaSenha);

    await this.usuarios.updatePasswordHash(usuario.id, senhaHash, {
      trocaSenhaObrigatoria: false,
    });
    await this.sessions.revokeAllByUsuarioId(usuario.id, new Date());
  }
}
