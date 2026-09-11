import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PermissaoAdministrativaNome } from '../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { PERMISSOES_ADMINISTRATIVAS_METADATA_KEY } from './permissao-administrativa.decorator.js';
import { possuiPermissaoAdministrativa } from './permissao-administrativa.util.js';
import type { AuthenticatedRequest } from './auth.request.js';

/**
 * Guard centralizado de autorização administrativa: concede acesso quando o
 * usuário autenticado possui `TOTAL` ou qualquer uma das permissões
 * requeridas pelo handler/controller via `@RequirePermissaoAdministrativa`.
 */
@Injectable()
export class PermissaoAdministrativaGuard implements CanActivate {
  private readonly reflector: Reflector;

  constructor(reflector: Reflector) {
    this.reflector = reflector;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissoes =
      this.reflector.getAllAndOverride<PermissaoAdministrativaNome[]>(
        PERMISSOES_ADMINISTRATIVAS_METADATA_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (requiredPermissoes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.auth === undefined) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    if (request.auth.tipo !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Permissão administrativa requerida.');
    }

    const auth = request.auth;
    const hasRequiredPermissao = requiredPermissoes.some((permissao) =>
      possuiPermissaoAdministrativa(auth.permissoesAdministrativas, permissao),
    );

    if (!hasRequiredPermissao) {
      throw new ForbiddenException('Permissão administrativa insuficiente.');
    }

    return true;
  }
}
