import { DomainValidationError } from '../errors/domain-validation.error.js';

export interface CategoriaProps {
  id: string;
  nome: string;
}

export class Categoria {
  private readonly props: CategoriaProps;

  private constructor(props: CategoriaProps) {
    this.props = props;
  }

  static create(props: CategoriaProps): Categoria {
    const nome = props.nome.trim();

    if (nome.length === 0) {
      throw new DomainValidationError('Nome da categoria e obrigatorio.');
    }

    if (nome.length > 80) {
      throw new DomainValidationError(
        'Nome da categoria deve ter no maximo 80 caracteres.',
      );
    }

    return new Categoria({ ...props, nome });
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }
}
