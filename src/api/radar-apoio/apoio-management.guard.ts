import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../usuario-autenticacao/auth.request.js';

const APOIO_MANAGEMENT_PROFILES = ['TOTAL', 'GERENTE_DE_APOIOS'] as const;

@Injectable()
export class ApoioManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.auth === undefined) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    if (request.auth.tipo !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Permissão administrativa requerida.');
    }

    const hasApoioProfile = APOIO_MANAGEMENT_PROFILES.some((profile) =>
      request.auth?.perfisAdministrativos.includes(profile),
    );

    if (!hasApoioProfile) {
      throw new ForbiddenException('Permissão administrativa insuficiente.');
    }

    return true;
  }
}
