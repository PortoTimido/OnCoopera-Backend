import type {
  ListUsuariosInput,
  PaginatedUsuarios,
  UsuarioManagementRepository,
} from '../ports/usuario-management.repository.js';

export class ListUsuariosUseCase {
  private readonly usuarios: UsuarioManagementRepository;

  constructor(usuarios: UsuarioManagementRepository) {
    this.usuarios = usuarios;
  }

  async execute(input: ListUsuariosInput): Promise<PaginatedUsuarios> {
    return this.usuarios.listUsuarios(input);
  }
}
