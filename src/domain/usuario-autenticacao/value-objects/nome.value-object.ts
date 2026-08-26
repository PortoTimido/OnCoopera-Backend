import { DomainValidationError } from '../errors/domain-validation.error.js';

export class Nome {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(input: string): Nome {
    const value = input.trim().replace(/\s+/g, ' ');

    if (value.length < 2 || value.length > 120) {
      throw new DomainValidationError('Nome inválido.');
    }

    return new Nome(value);
  }
}
