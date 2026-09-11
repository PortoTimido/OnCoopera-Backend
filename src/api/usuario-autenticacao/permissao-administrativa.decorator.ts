import { SetMetadata } from '@nestjs/common';
import type { PermissaoAdministrativaNome } from '../../domain/usuario-autenticacao/entities/usuario.entity.js';

export const PERMISSOES_ADMINISTRATIVAS_METADATA_KEY =
  'usuario-auth:permissoes-administrativas';

/**
 * Marca um handler/controller como exigindo alguma das permissões
 * administrativas informadas (ou `TOTAL`, que concede qualquer permissão).
 */
export function RequirePermissaoAdministrativa(
  ...permissoes: PermissaoAdministrativaNome[]
) {
  return SetMetadata(PERMISSOES_ADMINISTRATIVAS_METADATA_KEY, permissoes);
}
