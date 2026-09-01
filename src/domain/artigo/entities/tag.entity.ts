import { DomainValidationError } from '../errors/domain-validation.error.js';

export interface TagProps {
  id: string;
  nome: string;
}

export class Tag {
  private readonly props: TagProps;

  private constructor(props: TagProps) {
    this.props = props;
  }

  static create(props: TagProps): Tag {
    const nome = props.nome.trim();

    if (nome.length === 0) {
      throw new DomainValidationError('Nome da tag e obrigatorio.');
    }

    if (nome.length > 80) {
      throw new DomainValidationError(
        'Nome da tag deve ter no maximo 80 caracteres.',
      );
    }

    return new Tag({ ...props, nome });
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }
}
