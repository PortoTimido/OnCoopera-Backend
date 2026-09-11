import type { Request } from 'express';

import type {
  PermissaoAdministrativaNome,
  TipoUsuario,
} from '../../domain/usuario-autenticacao/entities/usuario.entity.js';

export interface AuthenticatedRequestContext {
  usuarioId: string;
  sessaoId: string;
  tipo: TipoUsuario;
  permissoesAdministrativas: PermissaoAdministrativaNome[];
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedRequestContext;
}
