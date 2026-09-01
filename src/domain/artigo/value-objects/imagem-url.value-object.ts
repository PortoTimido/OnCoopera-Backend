import { DomainValidationError } from '../errors/domain-validation.error.js';

export class ImagemUrl {
  private readonly url: string;

  private constructor(url: string) {
    this.url = url;
  }

  static create(value: string): ImagemUrl {
    const normalized = value.trim();

    try {
      const url = new URL(normalized);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      throw new DomainValidationError('URL da imagem deve ser valida.');
    }

    return new ImagemUrl(normalized);
  }

  get value(): string {
    return this.url;
  }
}
