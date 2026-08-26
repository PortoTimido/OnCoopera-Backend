import {
  PERFIS_ADMINISTRATIVOS_CONHECIDOS,
  type PerfilAdministrativoNome,
} from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { DomainValidationError } from '../../../domain/usuario-autenticacao/errors/domain-validation.error.js';
import { DataNascimento } from '../../../domain/usuario-autenticacao/value-objects/data-nascimento.value-object.js';
import { Email } from '../../../domain/usuario-autenticacao/value-objects/email.value-object.js';
import { Login } from '../../../domain/usuario-autenticacao/value-objects/login.value-object.js';
import { Nome } from '../../../domain/usuario-autenticacao/value-objects/nome.value-object.js';
import { Telefone } from '../../../domain/usuario-autenticacao/value-objects/telefone.value-object.js';
import type {
  EnderecoData,
  UsuarioBaseData,
} from '../ports/usuario-management.repository.js';

type RawUsuarioBaseData = {
  nome: string;
  email: string;
  login: string;
  telefone: string;
  dataNascimento: Date;
};

export function normalizeUsuarioBaseData(
  input: RawUsuarioBaseData,
): UsuarioBaseData {
  return {
    nome: Nome.create(input.nome).value,
    email: Email.create(input.email).value,
    login: Login.create(input.login).value,
    telefone: Telefone.fromString(input.telefone).formatarParaString(),
    dataNascimento: DataNascimento.create(input.dataNascimento).value,
  };
}

export function normalizePartialUsuarioBaseData(
  input: Partial<RawUsuarioBaseData>,
): Partial<UsuarioBaseData> {
  return {
    ...(input.nome !== undefined
      ? { nome: Nome.create(input.nome).value }
      : {}),
    ...(input.email !== undefined
      ? { email: Email.create(input.email).value }
      : {}),
    ...(input.login !== undefined
      ? { login: Login.create(input.login).value }
      : {}),
    ...(input.telefone !== undefined
      ? { telefone: Telefone.fromString(input.telefone).formatarParaString() }
      : {}),
    ...(input.dataNascimento !== undefined
      ? {
          dataNascimento: DataNascimento.create(input.dataNascimento).value,
        }
      : {}),
  };
}

export function normalizeEnderecoData(
  input: Omit<EnderecoData, 'id'>,
): Omit<EnderecoData, 'id'> {
  const cep = onlyDigits(input.cep);
  const estado = input.estado.trim().toUpperCase();

  if (cep.length !== 8) {
    throw new DomainValidationError('CEP deve conter 8 dígitos.');
  }

  if (!/^[A-Z]{2}$/.test(estado)) {
    throw new DomainValidationError('Estado deve conter a UF com 2 letras.');
  }

  if (input.latitude < -90 || input.latitude > 90) {
    throw new DomainValidationError('Latitude inválida.');
  }

  if (input.longitude < -180 || input.longitude > 180) {
    throw new DomainValidationError('Longitude inválida.');
  }

  return {
    cep,
    logradouro: requiredTrim(input.logradouro, 'Logradouro'),
    numero: requiredTrim(input.numero, 'Número'),
    complemento:
      input.complemento === null || input.complemento.trim().length === 0
        ? null
        : input.complemento.trim(),
    bairro: requiredTrim(input.bairro, 'Bairro'),
    cidade: requiredTrim(input.cidade, 'Cidade'),
    estado,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

export function normalizePerfisAdministrativos(
  perfis: string[],
): PerfilAdministrativoNome[] {
  if (perfis.length === 0) {
    throw new DomainValidationError(
      'Administrador deve possuir ao menos um perfil.',
    );
  }

  const uniquePerfis: PerfilAdministrativoNome[] = [];

  for (const perfil of new Set(perfis)) {
    if (!isPerfilAdministrativoConhecido(perfil)) {
      throw new DomainValidationError(
        `Perfil administrativo desconhecido: ${perfil}.`,
      );
    }

    uniquePerfis.push(perfil);
  }

  return uniquePerfis;
}

function requiredTrim(value: string, label: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new DomainValidationError(`${label} é obrigatório.`);
  }

  return trimmed;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function isPerfilAdministrativoConhecido(
  perfil: string,
): perfil is PerfilAdministrativoNome {
  return PERFIS_ADMINISTRATIVOS_CONHECIDOS.some((known) => known === perfil);
}
