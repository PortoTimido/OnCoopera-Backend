import type { PublicUsuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';
import { normalizePartialUsuarioBaseData } from './usuario-data.mapper.js';

export interface UpdateOwnProfileInput {
  nome?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: Date;
}

export class UpdateOwnProfileUseCase {
  private readonly usuarios: UsuarioRepository;

  constructor(usuarios: UsuarioRepository) {
    this.usuarios = usuarios;
  }

  async execute(
    usuarioId: string,
    input: UpdateOwnProfileInput,
  ): Promise<PublicUsuario> {
    const usuario = await this.usuarios.findById(usuarioId);

    if (usuario === null || !usuario.isActive()) {
      throw new AuthApplicationError(
        'UNAUTHORIZED',
        'Usuário não autenticado.',
      );
    }

    const data = normalizePartialUsuarioBaseData(input);

    return this.usuarios.updateProfile(usuarioId, data);
  }
}
