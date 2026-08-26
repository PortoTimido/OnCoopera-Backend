import type {
  EnderecoData,
  UsuarioBaseData,
  UsuarioDetails,
  UsuarioManagementRepository,
} from '../ports/usuario-management.repository.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import {
  normalizeEnderecoData,
  normalizePartialUsuarioBaseData,
} from './usuario-data.mapper.js';

export interface UpdatePacienteInput extends Partial<UsuarioBaseData> {
  endereco?: Omit<EnderecoData, 'id'>;
}

export class UpdatePacienteUseCase {
  private readonly usuarios: UsuarioManagementRepository;

  constructor(usuarios: UsuarioManagementRepository) {
    this.usuarios = usuarios;
  }

  async execute(
    id: string,
    input: UpdatePacienteInput,
  ): Promise<UsuarioDetails> {
    const current = await this.usuarios.findUsuarioDetailsById(id);

    if (current === null || current.usuario.tipo !== 'PACIENTE') {
      throw new AuthApplicationError('NOT_FOUND', 'Paciente não encontrado.');
    }

    return this.usuarios.updatePaciente({
      id,
      data: {
        ...normalizePartialUsuarioBaseData(input),
        ...(input.endereco !== undefined
          ? { endereco: normalizeEnderecoData(input.endereco) }
          : {}),
      },
    });
  }
}
