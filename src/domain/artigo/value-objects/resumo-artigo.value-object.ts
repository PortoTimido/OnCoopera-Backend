import { DomainValidationError } from '../errors/domain-validation.error.js';

export class ResumoArtigo {
  private readonly resumo: string;

  private constructor(resumo: string) {
    this.resumo = resumo;
  }

  static create(value: string): ResumoArtigo {
    const normalized = value.trim();

    if (normalized.length > 250) {
      throw new DomainValidationError(
        'Resumo do artigo deve ter no maximo 250 caracteres.',
      );
    }

    return new ResumoArtigo(normalized);
  }

  get value(): string {
    return this.resumo;
  }
}
