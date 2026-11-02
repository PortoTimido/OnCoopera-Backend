import type { GoogleAuthConfig } from '../../application/usuario-autenticacao/ports/google-auth-config.js';

const GOOGLE_CLIENT_ID_PATTERN =
  /^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/;

export function createGoogleAuthConfigFromEnv(
  env: NodeJS.ProcessEnv,
): GoogleAuthConfig {
  const webClientId = env.GOOGLE_WEB_CLIENT_ID?.trim();

  if (
    webClientId === undefined ||
    !GOOGLE_CLIENT_ID_PATTERN.test(webClientId)
  ) {
    throw new Error(
      'GOOGLE_WEB_CLIENT_ID precisa ser um Client ID OAuth válido do Google.',
    );
  }

  return { webClientId };
}
