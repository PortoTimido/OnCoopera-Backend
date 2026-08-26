import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { UsuarioManagementRepository } from '../ports/usuario-management.repository.js';

export class InactivatePacienteUseCase {
  private readonly usuarios: UsuarioManagementRepository;
  private readonly sessions: AuthSessionRepository;

  constructor(
    usuarios: UsuarioManagementRepository,
    sessions: AuthSessionRepository,
  ) {
    this.usuarios = usuarios;
    this.sessions = sessions;
  }

  async execute(id: string): Promise<void> {
    const current = await this.usuarios.findUsuarioDetailsById(id);

    if (current === null || current.usuario.tipo !== 'PACIENTE') {
      throw new AuthApplicationError('NOT_FOUND', 'Paciente não encontrado.');
    }

    const now = new Date();
    await this.usuarios.inactivateUsuario(id, now);
    await this.sessions.revokeAllByUsuarioId(id, now);
  }
}
