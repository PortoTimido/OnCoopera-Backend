export interface AuthConfig {
  jwtAccessSecret: string;
  tokenHashSecret: string;
  bcryptSaltRounds: number;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  cookieSecure: boolean;
}

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');
