import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PerfilAdministrativoNome } from '../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { ADMIN_PROFILES_METADATA_KEY } from './admin-profile.decorator.js';
import type { AuthenticatedRequest } from './auth.request.js';

@Injectable()
export class AdminProfileGuard implements CanActivate {
  private readonly reflector: Reflector;

  constructor(reflector: Reflector) {
    this.reflector = reflector;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredProfiles =
      this.reflector.getAllAndOverride<PerfilAdministrativoNome[]>(
        ADMIN_PROFILES_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredProfiles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.auth === undefined) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    if (request.auth.tipo !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Permissão administrativa requerida.');
    }

    const hasRequiredProfile = requiredProfiles.every((profile) =>
      request.auth?.perfisAdministrativos.includes(profile),
    );

    if (!hasRequiredProfile) {
      throw new ForbiddenException('Permissão administrativa insuficiente.');
    }

    return true;
  }
}
