import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../usuario-autenticacao/auth.request.js';

const CONTENT_MODERATION_PROFILES = [
  'TOTAL',
  'MODERADOR_DE_CONTEUDO',
] as const;

@Injectable()
export class ArticleContentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.auth === undefined) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    if (request.auth.tipo !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Permissão administrativa requerida.');
    }

    const hasContentProfile = CONTENT_MODERATION_PROFILES.some((profile) =>
      request.auth?.perfisAdministrativos.includes(profile),
    );

    if (!hasContentProfile) {
      throw new ForbiddenException('Permissão administrativa insuficiente.');
    }

    return true;
  }
}
