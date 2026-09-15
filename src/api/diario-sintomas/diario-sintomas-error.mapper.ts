import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DiarioSintomasApplicationError } from '../../application/diario-sintomas/errors/diario-sintomas-application.error.js';
import { DomainValidationError } from '../../domain/diario-sintomas/errors/domain-validation.error.js';

export function mapDiarioSintomasError(error: unknown): Error {
  if (error instanceof DiarioSintomasApplicationError) {
    if (error.code === 'NOT_FOUND') return new NotFoundException(error.message);
    if (error.code === 'FORBIDDEN')
      return new ForbiddenException(error.message);
    return new ConflictException(error.message);
  }
  if (error instanceof DomainValidationError)
    return new BadRequestException(error.message);
  return error instanceof Error ? error : new Error('Erro inesperado.');
}
