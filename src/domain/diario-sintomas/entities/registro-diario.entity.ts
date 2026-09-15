import { DomainValidationError } from '../errors/domain-validation.error.js';

export const HUMORES = [
  'MUITO_BEM',
  'BEM',
  'NEUTRO',
  'MAL',
  'MUITO_MAL',
] as const;
export type Humor = (typeof HUMORES)[number];

export const TIPOS_SINTOMA = [
  'NAUSEA',
  'FATIGA',
  'DOR',
  'TONTURA',
  'FEBRE',
  'SONO',
  'APETITE',
  'OUTRO',
] as const;
export type TipoSintoma = (typeof TIPOS_SINTOMA)[number];

export interface SintomaRegistroInput {
  tipo: TipoSintoma;
  intensidade: number;
  descricaoOutro?: string | null;
}

export interface PublicRegistroSintoma {
  id: string;
  tipo: TipoSintoma;
  intensidade: number;
  descricaoOutro: string | null;
}

export interface PublicRegistroDiario {
  id: string;
  pacienteId: string;
  dataRegistro: Date;
  dataHora: Date;
  humor: Humor;
  notaVozUrl: string | null;
  sintomas: PublicRegistroSintoma[];
}

export interface RegistroDiarioProps extends Omit<
  PublicRegistroDiario,
  'sintomas'
> {
  sintomas: PublicRegistroSintoma[];
}

export class RegistroDiario {
  private constructor(private readonly props: RegistroDiarioProps) {}

  static create(props: RegistroDiarioProps): RegistroDiario {
    if (!HUMORES.includes(props.humor)) {
      throw new DomainValidationError('Humor inválido.');
    }
    if (props.sintomas.length === 0) {
      throw new DomainValidationError('Informe ao menos um sintoma.');
    }
    const tipos = new Set<string>();
    for (const sintoma of props.sintomas) {
      validateSintoma(sintoma);
      if (tipos.has(sintoma.tipo)) {
        throw new DomainValidationError(
          'Um sintoma não pode ser informado mais de uma vez.',
        );
      }
      tipos.add(sintoma.tipo);
    }
    return new RegistroDiario(props);
  }

  toPublic(): PublicRegistroDiario {
    return {
      ...this.props,
      sintomas: this.props.sintomas.map((item) => ({ ...item })),
    };
  }
}

export function validateSintoma(
  sintoma: SintomaRegistroInput | PublicRegistroSintoma,
): void {
  if (!TIPOS_SINTOMA.includes(sintoma.tipo))
    throw new DomainValidationError('Tipo de sintoma inválido.');
  if (
    !Number.isInteger(sintoma.intensidade) ||
    sintoma.intensidade < 0 ||
    sintoma.intensidade > 10
  ) {
    throw new DomainValidationError(
      'A intensidade deve ser um inteiro entre 0 e 10.',
    );
  }
  const descricao = sintoma.descricaoOutro?.trim() ?? null;
  if (
    sintoma.tipo === 'OUTRO' &&
    (descricao === null || descricao.length === 0 || descricao.length > 120)
  ) {
    throw new DomainValidationError(
      'Descrição de outro sintoma é obrigatória e deve ter até 120 caracteres.',
    );
  }
  if (sintoma.tipo !== 'OUTRO' && descricao !== null) {
    throw new DomainValidationError(
      'Descrição é permitida somente para o sintoma OUTRO.',
    );
  }
}
