export type ArtigoApplicationErrorCode = 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN';

export class ArtigoApplicationError extends Error {
  readonly code: ArtigoApplicationErrorCode;

  constructor(code: ArtigoApplicationErrorCode, message: string) {
    super(message);
    this.name = 'ArtigoApplicationError';
    this.code = code;
  }
}
