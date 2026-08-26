import { DomainValidationError } from '../errors/domain-validation.error.js';

export class Telefone {
  readonly ddd: string;
  readonly numero: string;

  private constructor(ddd: string, numero: string) {
    this.ddd = ddd;
    this.numero = numero;
  }

  static create(ddd: string, numero: string): Telefone {
    const dddDigits = ddd.replace(/\D/g, '');
    const numeroDigits = numero.replace(/\D/g, '');

    if (dddDigits.length !== 2 || ![8, 9].includes(numeroDigits.length)) {
      throw new DomainValidationError('Telefone inválido.');
    }

    return new Telefone(dddDigits, numeroDigits);
  }

  static fromString(input: string): Telefone {
    const digits = input.replace(/\D/g, '');

    if (![10, 11].includes(digits.length)) {
      throw new DomainValidationError('Telefone inválido.');
    }

    return Telefone.create(digits.slice(0, 2), digits.slice(2));
  }

  formatarParaString(): string {
    return `${this.ddd}${this.numero}`;
  }
}
