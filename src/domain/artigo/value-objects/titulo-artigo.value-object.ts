import { DomainValidationError } from '../errors/domain-validation.error.js';

export class TituloArtigo {
  private readonly titulo: string;

  private constructor(titulo: string) {
    this.titulo = titulo;
  }

  static create(value: string): TituloArtigo {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new DomainValidationError('Titulo do artigo e obrigatorio.');
    }

    if (normalized.length > 160) {
      throw new DomainValidationError(
        'Titulo do artigo deve ter no maximo 160 caracteres.',
      );
    }

    return new TituloArtigo(normalized);
  }

  get value(): string {
    return this.titulo;
  }
}
