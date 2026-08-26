import { randomBytes } from 'node:crypto';
import type { SecretGenerator } from '../../application/usuario-autenticacao/ports/secret-generator.js';

export class NodeSecretGenerator implements SecretGenerator {
  generate(): string {
    return randomBytes(48).toString('base64url');
  }
}
