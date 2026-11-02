import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import {
  ACCESS_TOKEN_SERVICE,
  type AccessTokenService,
} from '../../application/usuario-autenticacao/ports/access-token.service.js';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepository,
} from '../../application/usuario-autenticacao/ports/auth-session.repository.js';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '../../application/usuario-autenticacao/ports/usuario.repository.js';
import type { AuthenticatedRequest } from './auth.request.js';
import { extractBearerToken } from './jwt-auth.guard.js';

@Injectable()
export class TermosUsoAceiteGuard implements CanActivate {
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenService,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepository,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (token === null)
      throw new UnauthorizedException('Usuário não autenticado.');

    const payload = await this.accessTokens.verify(token);
    if (payload === null)
      throw new UnauthorizedException('Usuário não autenticado.');

    if ('sid' in payload) {
      const session = await this.sessions.findById(payload.sid);
      if (
        session === null ||
        !session.isActive() ||
        session.usuarioId !== payload.sub
      ) {
        throw new UnauthorizedException('Usuário não autenticado.');
      }
    } else if (payload.scope !== 'TERMOS_USO_ACEITE') {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    const usuario = await this.usuarios.findById(payload.sub);
    if (usuario === null || !usuario.isActive()) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }
    if (usuario.tipo !== 'PACIENTE') {
      throw new ForbiddenException('Acesso permitido apenas para pacientes.');
    }

    request.auth = {
      usuarioId: usuario.id,
      ...('sid' in payload ? { sessaoId: payload.sid } : {}),
      tipo: 'PACIENTE',
      permissoesAdministrativas: [],
    };
    return true;
  }
}
