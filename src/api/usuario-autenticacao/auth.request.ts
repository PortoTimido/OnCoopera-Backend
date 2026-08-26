import type { Request } from 'express';

import type {
  PerfilAdministrativoNome,
  TipoUsuario,
} from '../../domain/usuario-autenticacao/entities/usuario.entity.js';

export interface AuthenticatedRequestContext {
  usuarioId: string;
  sessaoId: string;
  tipo: TipoUsuario;
  perfisAdministrativos: PerfilAdministrativoNome[];
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedRequestContext;
}
