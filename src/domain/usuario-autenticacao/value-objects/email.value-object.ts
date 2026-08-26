import { DomainValidationError } from '../errors/domain-validation.error.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(input: string): Email {
    const value = input.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(value) || value.length > 254) {
      throw new DomainValidationError('Email inválido.');
    }

    return new Email(value);
  }
}
