import { DomainValidationError } from '../errors/domain-validation.error.js';

export class TempoLeitura {
  private readonly minutos: number;

  private constructor(minutos: number) {
    this.minutos = minutos;
  }

  static create(value: number): TempoLeitura {
    if (!Number.isInteger(value) || value < 1) {
      throw new DomainValidationError(
        'Tempo de leitura deve ser um inteiro positivo.',
      );
    }

    return new TempoLeitura(value);
  }

  calcularMinutos(): number {
    return this.minutos;
  }
}
