import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { ExternalIdentityRepository } from '../ports/external-identity.repository.js';
import {
  GoogleIdentityVerificationError,
  type GoogleIdentityVerifier,
} from '../ports/google-identity-verifier.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';
import type {
  IssuedAuthSession,
  IssueAuthSessionService,
} from '../services/issue-auth-session.service.js';

export class AuthenticateWithGoogleUseCase {
  constructor(
    private readonly verifier: GoogleIdentityVerifier,
    private readonly identities: ExternalIdentityRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly issueSession: IssueAuthSessionService,
  ) {}

  async execute(idToken: string): Promise<IssuedAuthSession> {
    const identity = await this.verifyIdentity(idToken);
    const key = { provider: 'GOOGLE' as const, subject: identity.subject };
    const linkedUsuarioId = await this.identities.findUsuarioId(key);

    if (linkedUsuarioId !== null) {
      const linkedUsuario = await this.usuarios.findById(linkedUsuarioId);
      this.assertEligiblePatient(linkedUsuario);
      return this.issueSession.issue(linkedUsuario);
    }

    const usuario = await this.usuarios.findByIdentifier(identity.email);
    if (usuario === null || usuario.email !== identity.email) {
      throw new AuthApplicationError(
        'GOOGLE_ACCOUNT_NOT_REGISTERED',
        'Nenhum cadastro foi encontrado para esta conta Google.',
      );
    }

    this.assertEligiblePatient(usuario);
    await this.identities.link({ ...key, usuarioId: usuario.id });

    return this.issueSession.issue(usuario);
  }

  private async verifyIdentity(idToken: string) {
    try {
      return await this.verifier.verify(idToken);
    } catch (error) {
      if (
        error instanceof GoogleIdentityVerificationError &&
        error.failure === 'UNAVAILABLE'
      ) {
        throw new AuthApplicationError(
          'GOOGLE_SERVICE_UNAVAILABLE',
          'Autenticação com Google temporariamente indisponível.',
        );
      }

      throw new AuthApplicationError(
        'INVALID_GOOGLE_TOKEN',
        'Não foi possível validar a conta Google.',
      );
    }
  }

  private assertEligiblePatient(
    usuario: Awaited<ReturnType<UsuarioRepository['findById']>>,
  ): asserts usuario is NonNullable<typeof usuario> {
    if (
      usuario === null ||
      !usuario.isActive() ||
      usuario.tipo !== 'PACIENTE'
    ) {
      throw new AuthApplicationError(
        'GOOGLE_ACCOUNT_FORBIDDEN',
        'Esta conta não pode utilizar a autenticação com Google.',
      );
    }
  }
}
