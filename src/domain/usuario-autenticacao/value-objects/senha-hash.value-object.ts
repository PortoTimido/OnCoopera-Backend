import { DomainValidationError } from '../errors/domain-validation.error.js';

export class SenhaHash {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(input: string): SenhaHash {
    const value = input.trim();

    if (value.length < 10) {
      throw new DomainValidationError('Hash de senha inválido.');
    }

    return new SenhaHash(value);
  }
}
