import { DomainValidationError } from '../errors/domain-validation.error.js';

export class DataNascimento {
  readonly value: Date;

  private constructor(value: Date) {
    this.value = value;
  }

  static create(input: Date): DataNascimento {
    const value = new Date(input);
    const now = new Date();

    if (
      Number.isNaN(value.getTime()) ||
      value > now ||
      value.getUTCFullYear() < 1900
    ) {
      throw new DomainValidationError('Data de nascimento inválida.');
    }

    return new DataNascimento(value);
  }

  formatarDDMMAAAA(): string {
    const day = String(this.value.getUTCDate()).padStart(2, '0');
    const month = String(this.value.getUTCMonth() + 1).padStart(2, '0');
    const year = String(this.value.getUTCFullYear());

    return `${day}${month}${year}`;
  }
}
