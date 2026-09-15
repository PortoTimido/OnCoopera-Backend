export type DiarioSintomasErrorCode = 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT';

export class DiarioSintomasApplicationError extends Error {
  constructor(
    public readonly code: DiarioSintomasErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DiarioSintomasApplicationError';
  }
}
