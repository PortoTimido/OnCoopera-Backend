import { DomainValidationError } from '../errors/domain-validation.error.js';

const LOGIN_PATTERN = /^[a-zA-Z0-9._-]+$/;

export class Login {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(input: string): Login {
    const value = input.trim();

    if (value.length < 3 || value.length > 30 || !LOGIN_PATTERN.test(value)) {
      throw new DomainValidationError('Login inválido.');
    }

    return new Login(value);
  }
}
