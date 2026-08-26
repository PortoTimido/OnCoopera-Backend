import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AuthConfig } from '../../application/usuario-autenticacao/ports/auth-config.js';
import type { TokenHasher } from '../../application/usuario-autenticacao/ports/token-hasher.js';

export class HmacTokenHasher implements TokenHasher {
  private readonly secret: string;

  constructor(config: AuthConfig) {
    this.secret = config.tokenHashSecret;
  }

  hash(token: string): string {
    return createHmac('sha256', this.secret).update(token).digest('hex');
  }

  matches(token: string, tokenHash: string): boolean {
    const actual = Buffer.from(this.hash(token), 'hex');
    const expected = Buffer.from(tokenHash, 'hex');

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  }
}
