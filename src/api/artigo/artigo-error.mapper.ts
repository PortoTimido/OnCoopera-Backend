import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ArtigoApplicationError } from '../../application/artigo/errors/artigo-application.error.js';
import { DomainValidationError } from '../../domain/artigo/errors/domain-validation.error.js';

export function mapArtigoError(error: unknown): Error {
  if (error instanceof ArtigoApplicationError) {
    if (error.code === 'NOT_FOUND') {
      return new NotFoundException(error.message);
    }

    if (error.code === 'CONFLICT') {
      return new ConflictException(error.message);
    }

    if (error.code === 'FORBIDDEN') {
      return new ForbiddenException(error.message);
    }
  }

  if (error instanceof DomainValidationError) {
    return new BadRequestException(error.message);
  }

  return error instanceof Error ? error : new Error('Erro inesperado.');
}
