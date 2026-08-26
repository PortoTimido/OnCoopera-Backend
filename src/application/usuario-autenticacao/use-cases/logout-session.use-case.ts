import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { TokenHasher } from '../ports/token-hasher.js';

export interface LogoutSessionInput {
  refreshToken: string | undefined;
  csrfToken: string | undefined;
}

export class LogoutSessionUseCase {
  private readonly sessions: AuthSessionRepository;
  private readonly tokenHasher: TokenHasher;

  constructor(sessions: AuthSessionRepository, tokenHasher: TokenHasher) {
    this.sessions = sessions;
    this.tokenHasher = tokenHasher;
  }

  async execute(input: LogoutSessionInput): Promise<void> {
    if (input.refreshToken === undefined) {
      return;
    }

    const session = await this.sessions.findByRefreshTokenHash(
      this.tokenHasher.hash(input.refreshToken),
    );

    if (session === null) {
      return;
    }

    if (
      input.csrfToken === undefined ||
      !this.tokenHasher.matches(input.csrfToken, session.csrfTokenHash)
    ) {
      throw new AuthApplicationError('INVALID_CSRF_TOKEN', 'CSRF inválido.');
    }

    await this.sessions.revoke(session.id, new Date());
  }
}
