import { ConflictException, NotFoundException } from '@nestjs/common';
import { DocumentoLegalApplicationError } from '../../application/documento-legal/errors/documento-legal-application.error.js';

export function mapDocumentoLegalError(error: unknown): Error {
  if (error instanceof DocumentoLegalApplicationError) {
    if (error.code === 'NOT_FOUND') return new NotFoundException(error.message);
    if (error.code === 'CONFLICT') return new ConflictException(error.message);
  }

  return error instanceof Error ? error : new Error('Erro inesperado.');
}
