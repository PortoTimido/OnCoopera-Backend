import { assertValidPlainPassword } from '../../../domain/usuario-autenticacao/services/password-policy.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type {
  EnderecoData,
  UsuarioBaseData,
  UsuarioDetails,
  UsuarioManagementRepository,
} from '../ports/usuario-management.repository.js';
import {
  normalizeEnderecoData,
  normalizeUsuarioBaseData,
} from './usuario-data.mapper.js';

export interface CreatePacienteInput extends UsuarioBaseData {
  senha: string;
  endereco: Omit<EnderecoData, 'id'>;
}

export class CreatePacienteUseCase {
  private readonly usuarios: UsuarioManagementRepository;
  private readonly passwordHasher: PasswordHasher;

  constructor(
    usuarios: UsuarioManagementRepository,
    passwordHasher: PasswordHasher,
  ) {
    this.usuarios = usuarios;
    this.passwordHasher = passwordHasher;
  }

  async execute(input: CreatePacienteInput): Promise<UsuarioDetails> {
    try {
      assertValidPlainPassword(input.senha);
    } catch (error) {
      throw new AuthApplicationError(
        'INVALID_PASSWORD_POLICY',
        error instanceof Error ? error.message : 'Senha inválida.',
      );
    }

    const senhaHash = await this.passwordHasher.hash(input.senha);

    return this.usuarios.createPaciente({
      ...normalizeUsuarioBaseData(input),
      senhaHash,
      endereco: normalizeEnderecoData(input.endereco),
    });
  }
}
