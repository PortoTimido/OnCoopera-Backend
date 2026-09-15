export interface AuthConfig {
  jwtAccessSecret: string;
  tokenHashSecret: string;
  bcryptSaltRounds: number;
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
  cookieSecure: boolean;
  temporaryPasswordTtlHours: number;
  passwordRecoveryCodeTtlMinutes: number;
  passwordRecoveryResetTokenTtlMinutes: number;
  passwordRecoveryMaxAttempts: number;
  passwordRecoveryResendIntervalSeconds: number;
  passwordRecoveryRateLimitWindowMinutes: number;
  passwordRecoveryRateLimitMaxRequests: number;
}

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');
