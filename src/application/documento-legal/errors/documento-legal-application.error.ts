export type DocumentoLegalApplicationErrorCode = 'NOT_FOUND' | 'CONFLICT';

export class DocumentoLegalApplicationError extends Error {
  constructor(
    readonly code: DocumentoLegalApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DocumentoLegalApplicationError';
  }
}
