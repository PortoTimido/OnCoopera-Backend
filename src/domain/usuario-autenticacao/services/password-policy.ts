import { DomainValidationError } from '../errors/domain-validation.error.js';

const SYMBOL_PATTERN = /[^A-Za-z0-9]/;

export function assertValidPlainPassword(password: string): void {
  const byteLength = Buffer.byteLength(password, 'utf8');

  if (byteLength < 12 || byteLength > 72) {
    throw new DomainValidationError('Senha deve ter entre 12 e 72 bytes.');
  }

  if (!/[A-Z]/.test(password)) {
    throw new DomainValidationError('Senha deve conter letra maiúscula.');
  }

  if (!/[a-z]/.test(password)) {
    throw new DomainValidationError('Senha deve conter letra minúscula.');
  }

  if (!/[0-9]/.test(password)) {
    throw new DomainValidationError('Senha deve conter número.');
  }

  if (!SYMBOL_PATTERN.test(password)) {
    throw new DomainValidationError('Senha deve conter símbolo.');
  }
}
