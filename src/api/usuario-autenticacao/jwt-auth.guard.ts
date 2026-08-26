import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
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

export function extractBearerToken(
  authorization: string | string[] | undefined,
): string | null {
  if (typeof authorization !== 'string') {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || token === undefined || token.length === 0) {
    return null;
  }

  return token;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly accessTokens: AccessTokenService;
  private readonly sessions: AuthSessionRepository;
  private readonly usuarios: UsuarioRepository;

  constructor(
    @Inject(ACCESS_TOKEN_SERVICE) accessTokens: AccessTokenService,
    @Inject(AUTH_SESSION_REPOSITORY) sessions: AuthSessionRepository,
    @Inject(USUARIO_REPOSITORY) usuarios: UsuarioRepository,
  ) {
    this.accessTokens = accessTokens;
    this.sessions = sessions;
    this.usuarios = usuarios;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (token === null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    const payload = await this.accessTokens.verify(token);

    if (payload === null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    const session = await this.sessions.findById(payload.sid);

    if (
      session === null ||
      !session.isActive() ||
      session.usuarioId !== payload.sub
    ) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    const usuario = await this.usuarios.findById(payload.sub);

    if (usuario === null || !usuario.isActive()) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    const publicUsuario = usuario.toPublic();

    request.auth = {
      usuarioId: payload.sub,
      sessaoId: payload.sid,
      tipo: publicUsuario.tipo,
      perfisAdministrativos: publicUsuario.perfisAdministrativos,
    };

    return true;
  }
}
