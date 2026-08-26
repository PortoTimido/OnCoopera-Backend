import type { CookieOptions, Response } from 'express';
import type { AuthConfig } from '../../application/usuario-autenticacao/ports/auth-config.js';

export const REFRESH_TOKEN_COOKIE = 'oncoopera_refresh_token';
export const CSRF_TOKEN_COOKIE = 'oncoopera_csrf_token';

interface CookieRequest {
  cookies?: Record<string, string | undefined>;
}

export interface AuthCookiePayload {
  refreshToken: string;
  csrfToken: string;
  refreshExpiresAt: Date;
}

export function getRefreshTokenFromRequest(
  request: CookieRequest,
): string | undefined {
  return request.cookies?.[REFRESH_TOKEN_COOKIE];
}

export function setAuthCookies(
  response: Response,
  payload: AuthCookiePayload,
  config: AuthConfig,
): void {
  response.cookie(
    REFRESH_TOKEN_COOKIE,
    payload.refreshToken,
    refreshCookieOptions(config),
  );
  response.cookie(
    CSRF_TOKEN_COOKIE,
    payload.csrfToken,
    csrfCookieOptions(config),
  );
}

export function clearAuthCookies(response: Response, config: AuthConfig): void {
  response.clearCookie(REFRESH_TOKEN_COOKIE, clearCookieOptions(config));
  response.clearCookie(CSRF_TOKEN_COOKIE, clearCookieOptions(config));
}

export function refreshCookieOptions(config: AuthConfig): CookieOptions {
  return {
    httpOnly: true,
    maxAge: refreshMaxAge(config),
    path: '/api/auth',
    sameSite: 'strict',
    secure: config.cookieSecure,
  };
}

export function csrfCookieOptions(config: AuthConfig): CookieOptions {
  return {
    httpOnly: false,
    maxAge: refreshMaxAge(config),
    path: '/api/auth',
    sameSite: 'strict',
    secure: config.cookieSecure,
  };
}

function clearCookieOptions(config: AuthConfig): CookieOptions {
  return {
    path: '/api/auth',
    sameSite: 'strict',
    secure: config.cookieSecure,
  };
}

function refreshMaxAge(config: AuthConfig): number {
  return config.refreshTokenTtlDays * 24 * 60 * 60 * 1000;
}
