import bcrypt from 'bcrypt';
import type { AuthConfig } from '../../application/usuario-autenticacao/ports/auth-config.js';
import type { PasswordHasher } from '../../application/usuario-autenticacao/ports/password-hasher.js';

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;

  constructor(config: AuthConfig) {
    this.saltRounds = config.bcryptSaltRounds;
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
