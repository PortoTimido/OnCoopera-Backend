import { Usuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';

export interface UsuarioRepository {
  findByIdentifier(identifier: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  updateLastAccess(id: string, ultimoAcesso: Date): Promise<void>;
  updatePasswordHash(
    id: string,
    senhaHash: string,
    options?: { trocaSenhaObrigatoria?: boolean },
  ): Promise<void>;
}

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');
