import { PERFIL_ADMINISTRATIVO_TOTAL } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { assertRemainingTotalAdministrator } from '../../../domain/usuario-autenticacao/services/admin-full-permission-policy.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import type { UsuarioManagementRepository } from '../ports/usuario-management.repository.js';

export class InactivateAdministradorUseCase {
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

    if (current === null || current.usuario.tipo !== 'ADMINISTRADOR') {
      throw new AuthApplicationError(
        'NOT_FOUND',
        'Administrador não encontrado.',
      );
    }

    if (
      current.usuario.status === 'ATIVO' &&
      current.usuario.perfisAdministrativos.includes(
        PERFIL_ADMINISTRATIVO_TOTAL,
      )
    ) {
      const remaining =
        await this.usuarios.countActiveTotalAdministratorsExcluding(id);
      try {
        assertRemainingTotalAdministrator(remaining);
      } catch (error) {
        throw new AuthApplicationError(
          'CONFLICT',
          error instanceof Error
            ? error.message
            : 'Administrador TOTAL obrigatório.',
        );
      }
    }

    const now = new Date();
    await this.usuarios.inactivateUsuario(id, now);
    await this.sessions.revokeAllByUsuarioId(id, now);
  }
}
