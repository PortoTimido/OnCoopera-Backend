import type { AuthConfig } from '../../application/usuario-autenticacao/ports/auth-config.js';

export function createAuthConfigFromEnv(env: NodeJS.ProcessEnv): AuthConfig {
  const isProduction = env.NODE_ENV === 'production';
  const jwtAccessSecret =
    env.JWT_ACCESS_SECRET ?? fallbackSecret(isProduction, 'JWT_ACCESS_SECRET');
  const tokenHashSecret =
    env.AUTH_TOKEN_HASH_SECRET ??
    fallbackSecret(isProduction, 'AUTH_TOKEN_HASH_SECRET');

  return {
    jwtAccessSecret,
    tokenHashSecret,
    bcryptSaltRounds: parsePositiveInteger(env.BCRYPT_SALT_ROUNDS, 12),
    accessTokenTtlSeconds: parsePositiveInteger(
      env.ACCESS_TOKEN_TTL_SECONDS,
      900,
    ),
    refreshTokenTtlDays: parsePositiveInteger(env.REFRESH_TOKEN_TTL_DAYS, 7),
    cookieSecure: env.AUTH_COOKIE_SECURE === 'true',
  };
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function fallbackSecret(isProduction: boolean, name: string): string {
  if (isProduction) {
    throw new Error(`${name} precisa estar definido em produção.`);
  }

  return `development-only-${name.toLowerCase()}`;
}
