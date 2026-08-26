import type { PublicUsuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';

export class GetAuthenticatedUserUseCase {
  private readonly usuarios: UsuarioRepository;

  constructor(usuarios: UsuarioRepository) {
    this.usuarios = usuarios;
  }

  async execute(usuarioId: string): Promise<PublicUsuario> {
    const usuario = await this.usuarios.findById(usuarioId);

    if (usuario === null || !usuario.isActive()) {
      throw new AuthApplicationError(
        'UNAUTHORIZED',
        'Usuário não autenticado.',
      );
    }

    return usuario.toPublic();
  }
}
