import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';
import type { AccessTokenService } from '../ports/access-token.service.js';
import type { Usuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import type {
  IssuedAuthSession,
  IssueAuthSessionService,
} from '../services/issue-auth-session.service.js';
import { TermosUsoAceiteService } from '../services/termos-uso-aceite.service.js';

export interface AuthenticateUserInput {
  identificador: string;
  senha: string;
}

export type AuthenticatedUserOutput =
  | IssuedAuthSession
  | {
      tokenAceite: string;
      aceiteTermosUsoPendente: true;
      usuario: ReturnType<Usuario['toPublic']>;
    };

export class AuthenticateUserUseCase {
  private readonly usuarios: UsuarioRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly issueSession: IssueAuthSessionService;
  private readonly termosUso: TermosUsoAceiteService;
  private readonly accessTokens: AccessTokenService;

  constructor(
    usuarios: UsuarioRepository,
    passwordHasher: PasswordHasher,
    issueSession: IssueAuthSessionService,
    termosUso: TermosUsoAceiteService,
    accessTokens: AccessTokenService,
  ) {
    this.usuarios = usuarios;
    this.passwordHasher = passwordHasher;
    this.issueSession = issueSession;
    this.termosUso = termosUso;
    this.accessTokens = accessTokens;
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

    if (
      usuario.tipo === 'PACIENTE' &&
      !(await this.termosUso.isAceito(usuario.id))
    ) {
      return {
        tokenAceite: await this.accessTokens.sign({
          sub: usuario.id,
          scope: 'TERMOS_USO_ACEITE',
        }),
        aceiteTermosUsoPendente: true,
        usuario: usuario.toPublic(),
      };
    }

    return this.issueSession.issue(usuario);
  }
}
