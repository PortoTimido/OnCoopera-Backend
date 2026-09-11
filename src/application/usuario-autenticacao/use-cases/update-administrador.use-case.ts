import {
  PERMISSAO_ADMINISTRATIVA_TOTAL,
  type PermissaoAdministrativaNome,
  type StatusUsuario,
} from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { assertRemainingTotalAdministrator } from '../../../domain/usuario-autenticacao/services/admin-full-permission-policy.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type {
  UpdateAdministradorRepositoryInput,
  UsuarioBaseData,
  UsuarioDetails,
  UsuarioManagementRepository,
} from '../ports/usuario-management.repository.js';
import type { AuthSessionRepository } from '../ports/auth-session.repository.js';
import {
  normalizePartialUsuarioBaseData,
  normalizePermissoesAdministrativas,
} from './usuario-data.mapper.js';

export interface UpdateAdministradorInput extends Partial<UsuarioBaseData> {
  status?: StatusUsuario;
  permissoesAdministrativas?: string[];
}

export class UpdateAdministradorUseCase {
  private readonly usuarios: UsuarioManagementRepository;
  private readonly sessions: AuthSessionRepository;

  constructor(
    usuarios: UsuarioManagementRepository,
    sessions: AuthSessionRepository,
  ) {
    this.usuarios = usuarios;
    this.sessions = sessions;
  }

  async execute(
    id: string,
    input: UpdateAdministradorInput,
  ): Promise<UsuarioDetails> {
    const current = await this.usuarios.findUsuarioDetailsById(id);

    if (current === null || current.usuario.tipo !== 'ADMINISTRADOR') {
      throw new AuthApplicationError(
        'NOT_FOUND',
        'Administrador não encontrado.',
      );
    }

    const permissoesAdministrativas =
      input.permissoesAdministrativas === undefined
        ? undefined
        : normalizePermissoesAdministrativas(input.permissoesAdministrativas);

    await this.assertCanUpdateTotalAdmin(id, current, {
      status: input.status,
      permissoesAdministrativas,
    });

    const data: UpdateAdministradorRepositoryInput['data'] = {
      ...normalizePartialUsuarioBaseData(input),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(permissoesAdministrativas !== undefined
        ? { permissoesAdministrativas }
        : {}),
    };

    const updated = await this.usuarios.updateAdministrador({ id, data });

    if (input.status !== undefined && input.status !== 'ATIVO') {
      await this.sessions.revokeAllByUsuarioId(id, new Date());
    }

    return updated;
  }

  private async assertCanUpdateTotalAdmin(
    id: string,
    current: UsuarioDetails,
    next: {
      status?: StatusUsuario;
      permissoesAdministrativas?: PermissaoAdministrativaNome[];
    },
  ): Promise<void> {
    const isCurrentlyActiveTotal =
      current.usuario.status === 'ATIVO' &&
      current.usuario.permissoesAdministrativas.includes(
        PERMISSAO_ADMINISTRATIVA_TOTAL,
      );
    const nextStatus = next.status ?? current.usuario.status;
    const nextPermissoes =
      next.permissoesAdministrativas ??
      current.usuario.permissoesAdministrativas;
    const keepsActiveTotal =
      nextStatus === 'ATIVO' &&
      nextPermissoes.includes(PERMISSAO_ADMINISTRATIVA_TOTAL);

    if (isCurrentlyActiveTotal && !keepsActiveTotal) {
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
  }
}
