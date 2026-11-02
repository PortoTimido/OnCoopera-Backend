import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';
import type {
  IssuedAuthSession,
  IssueAuthSessionService,
} from '../services/issue-auth-session.service.js';

export interface AuthenticateUserInput {
  identificador: string;
  senha: string;
}

export type AuthenticatedUserOutput = IssuedAuthSession;

export class AuthenticateUserUseCase {
  private readonly usuarios: UsuarioRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly issueSession: IssueAuthSessionService;

  constructor(
    usuarios: UsuarioRepository,
    passwordHasher: PasswordHasher,
    issueSession: IssueAuthSessionService,
  ) {
    this.usuarios = usuarios;
    this.passwordHasher = passwordHasher;
    this.issueSession = issueSession;
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
      if (
        usuario.senhaTemporariaExpiraEm !== null &&
        usuario.senhaTemporariaExpiraEm <= new Date()
      ) {
        throw new AuthApplicationError(
          'INVALID_CREDENTIALS',
          'Credenciais inválidas.',
        );
      }
      throw new AuthApplicationError(
        'PASSWORD_CHANGE_REQUIRED',
        'Troca de senha obrigatória.',
      );
    }

    return this.issueSession.issue(usuario);
  }
}
