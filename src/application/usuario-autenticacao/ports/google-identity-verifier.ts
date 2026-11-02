export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
}

export type GoogleIdentityVerificationFailure = 'INVALID' | 'UNAVAILABLE';

export class GoogleIdentityVerificationError extends Error {
  readonly failure: GoogleIdentityVerificationFailure;

  constructor(failure: GoogleIdentityVerificationFailure) {
    super('Não foi possível validar a identidade Google.');
    this.name = 'GoogleIdentityVerificationError';
    this.failure = failure;
  }
}

export interface GoogleIdentityVerifier {
  verify(idToken: string): Promise<VerifiedGoogleIdentity>;
}

export const GOOGLE_IDENTITY_VERIFIER = Symbol('GOOGLE_IDENTITY_VERIFIER');
