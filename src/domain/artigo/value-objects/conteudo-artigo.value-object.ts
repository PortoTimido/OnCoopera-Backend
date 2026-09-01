import { DomainValidationError } from '../errors/domain-validation.error.js';

export class ConteudoArtigo {
  private readonly conteudo: string;

  private constructor(conteudo: string) {
    this.conteudo = conteudo;
  }

  static create(value: string): ConteudoArtigo {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new DomainValidationError('Conteudo do artigo e obrigatorio.');
    }

    return new ConteudoArtigo(normalized);
  }

  get value(): string {
    return this.conteudo;
  }
}
