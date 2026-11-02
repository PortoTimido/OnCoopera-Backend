export type AuthApplicationErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN'
  | 'INVALID_CSRF_TOKEN'
  | 'UNAUTHORIZED'
  | 'INVALID_PASSWORD_POLICY'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'INVALID_GOOGLE_TOKEN'
  | 'GOOGLE_ACCOUNT_NOT_REGISTERED'
  | 'GOOGLE_ACCOUNT_FORBIDDEN'
  | 'GOOGLE_IDENTITY_CONFLICT'
  | 'GOOGLE_SERVICE_UNAVAILABLE'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT';

export class AuthApplicationError extends Error {
  readonly code: AuthApplicationErrorCode;

  constructor(code: AuthApplicationErrorCode, message: string) {
    super(message);
    this.name = 'AuthApplicationError';
    this.code = code;
  }
}
