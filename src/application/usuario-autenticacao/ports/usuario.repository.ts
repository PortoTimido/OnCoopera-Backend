import type { PublicUsuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { Usuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';

export interface OwnProfileData {
  nome?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: Date;
}

export interface UsuarioRepository {
  findByIdentifier(identifier: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  updateLastAccess(id: string, ultimoAcesso: Date): Promise<void>;
  updatePasswordHash(
    id: string,
    senhaHash: string,
    options?: {
      trocaSenhaObrigatoria?: boolean;
      senhaTemporariaExpiraEm?: Date | null;
    },
  ): Promise<void>;
  updateProfile(id: string, data: OwnProfileData): Promise<PublicUsuario>;
  findImagemObjectKey(id: string): Promise<string | null>;
  setImagemObjectKey(id: string, objectKey: string | null): Promise<void>;
}

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');
