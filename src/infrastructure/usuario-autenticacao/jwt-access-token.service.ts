import { JwtService } from '@nestjs/jwt';
import type {
  AccessTokenPayload,
  AccessTokenService,
} from '../../application/usuario-autenticacao/ports/access-token.service.js';
import type { AuthConfig } from '../../application/usuario-autenticacao/ports/auth-config.js';

export class JwtAccessTokenService implements AccessTokenService {
  private readonly jwt: JwtService;
  private readonly config: AuthConfig;

  constructor(jwt: JwtService, config: AuthConfig) {
    this.jwt = jwt;
    this.config = config;
  }

  async sign(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      algorithm: 'HS256',
      expiresIn: this.config.accessTokenTtlSeconds,
      secret: this.config.jwtAccessSecret,
    });
  }

  async verify(token: string): Promise<AccessTokenPayload | null> {
    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(
        token,
        {
          algorithms: ['HS256'],
          secret: this.config.jwtAccessSecret,
        },
      );

      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
        return null;
      }

      return {
        sub: payload.sub,
        sid: payload.sid,
      };
    } catch {
      return null;
    }
  }
}
