import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthApplicationError } from '../../application/usuario-autenticacao/errors/auth-application.error.js';
import { DomainValidationError } from '../../domain/usuario-autenticacao/errors/domain-validation.error.js';

export function mapAuthError(error: unknown): Error {
  if (error instanceof AuthApplicationError) {
    if (
      error.code === 'INVALID_CREDENTIALS' ||
      error.code === 'INVALID_REFRESH_TOKEN' ||
      error.code === 'INVALID_GOOGLE_TOKEN' ||
      error.code === 'UNAUTHORIZED'
    ) {
      return new UnauthorizedException(error.message);
    }

    if (error.code === 'INVALID_CSRF_TOKEN') {
      return new ForbiddenException(error.message);
    }

    if (error.code === 'INVALID_PASSWORD_POLICY') {
      return new BadRequestException(error.message);
    }

    if (error.code === 'PASSWORD_CHANGE_REQUIRED') {
      return new ConflictException({
        code: 'TROCA_SENHA_OBRIGATORIA',
        message: error.message,
      });
    }

    if (error.code === 'FORBIDDEN') {
      return new ForbiddenException(error.message);
    }

    if (error.code === 'GOOGLE_ACCOUNT_FORBIDDEN') {
      return new ForbiddenException(error.message);
    }

    if (error.code === 'GOOGLE_ACCOUNT_NOT_REGISTERED') {
      return new ConflictException({
        error: 'GOOGLE_ACCOUNT_NOT_REGISTERED',
        message: error.message,
      });
    }

    if (error.code === 'GOOGLE_IDENTITY_CONFLICT') {
      return new ConflictException({
        error: 'GOOGLE_IDENTITY_CONFLICT',
        message: error.message,
      });
    }

    if (error.code === 'GOOGLE_SERVICE_UNAVAILABLE') {
      return new ServiceUnavailableException(error.message);
    }

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
