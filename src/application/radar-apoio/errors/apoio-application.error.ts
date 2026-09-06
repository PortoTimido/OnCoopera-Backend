export type ApoioApplicationErrorCode = 'NOT_FOUND' | 'CONFLICT';
export class ApoioApplicationError extends Error {
  constructor(
    readonly code: ApoioApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApoioApplicationError';
  }
}
