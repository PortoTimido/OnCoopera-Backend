import { AuthApplicationError } from '../errors/auth-application.error.js';
import type {
  UsuarioDetails,
  UsuarioManagementRepository,
} from '../ports/usuario-management.repository.js';

export class GetUsuarioDetailsUseCase {
  private readonly usuarios: UsuarioManagementRepository;

  constructor(usuarios: UsuarioManagementRepository) {
    this.usuarios = usuarios;
  }

  async execute(id: string): Promise<UsuarioDetails> {
    const usuario = await this.usuarios.findUsuarioDetailsById(id);

    if (usuario === null) {
      throw new AuthApplicationError('NOT_FOUND', 'Usuário não encontrado.');
    }

    return usuario;
  }
}
