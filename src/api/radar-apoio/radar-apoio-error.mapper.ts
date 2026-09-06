import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ApoioApplicationError } from '../../application/radar-apoio/errors/apoio-application.error.js';
import { DomainValidationError } from '../../domain/radar-apoio/errors/domain-validation.error.js';

export function mapApoioError(error: unknown): Error {
  if (error instanceof ApoioApplicationError) {
    if (error.code === 'NOT_FOUND') {
      return new NotFoundException(error.message);
    }

    if (error.code === 'CONFLICT') {
      return new ConflictException(error.message);
    }
  }

  if (error instanceof DomainValidationError) {
    return new BadRequestException(error.message);
  }

  return error instanceof Error ? error : new Error('Erro inesperado.');
}
