import {
  OAuth2Client,
  type LoginTicket,
  type VerifyIdTokenOptions,
} from 'google-auth-library';
import {
  GoogleIdentityVerificationError,
  type GoogleIdentityVerifier,
  type VerifiedGoogleIdentity,
} from '../../application/usuario-autenticacao/ports/google-identity-verifier.js';
import type { GoogleAuthConfig } from '../../application/usuario-autenticacao/ports/google-auth-config.js';

const ALLOWED_ISSUERS = new Set([
  'accounts.google.com',
  'https://accounts.google.com',
]);

export interface GoogleTokenClient {
  verifyIdToken(options: VerifyIdTokenOptions): Promise<LoginTicket>;
}

export class GoogleIdTokenVerifier implements GoogleIdentityVerifier {
  constructor(
    private readonly config: GoogleAuthConfig,
    private readonly client: GoogleTokenClient = new OAuth2Client(),
  ) {}

  async verify(idToken: string): Promise<VerifiedGoogleIdentity> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.config.webClientId,
      });
      const payload = ticket.getPayload();
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (
        payload === undefined ||
        typeof payload.sub !== 'string' ||
        payload.sub.trim().length === 0 ||
        typeof payload.email !== 'string' ||
        payload.email.trim().length === 0 ||
        payload.email_verified !== true ||
        payload.aud !== this.config.webClientId ||
        !ALLOWED_ISSUERS.has(payload.iss) ||
        !Number.isInteger(payload.exp) ||
        payload.exp <= nowSeconds
      ) {
        throw new GoogleIdentityVerificationError('INVALID');
      }

      return {
        subject: payload.sub.trim(),
        email: payload.email.trim().toLowerCase(),
      };
    } catch (error) {
      if (error instanceof GoogleIdentityVerificationError) {
        throw error;
      }

      throw new GoogleIdentityVerificationError(
        isNetworkFailure(error) ? 'UNAVAILABLE' : 'INVALID',
      );
    }
  }
}

function isNetworkFailure(error: unknown): boolean {
  const visited = new Set<unknown>();
  let candidate: unknown = error;

  while (candidate !== null && typeof candidate === 'object') {
    if (visited.has(candidate)) {
      return false;
    }
    visited.add(candidate);

    const record = candidate as Record<string, unknown>;
    if (
      typeof record.code === 'string' &&
      ['EAI_AGAIN', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'].includes(
        record.code,
      )
    ) {
      return true;
    }

    const response = record.response;
    if (response !== null && typeof response === 'object') {
      const status = (response as Record<string, unknown>).status;
      if (typeof status === 'number' && status >= 500) {
        return true;
      }
    }

    candidate = record.cause;
  }

  return false;
}
