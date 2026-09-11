import {
  PERMISSAO_ADMINISTRATIVA_TOTAL,
  type PermissaoAdministrativaNome,
} from '../../domain/usuario-autenticacao/entities/usuario.entity.js';

export function possuiPermissaoAdministrativa(
  permissoesUsuario: PermissaoAdministrativaNome[],
  permissaoRequerida: PermissaoAdministrativaNome,
): boolean {
  return (
    permissoesUsuario.includes(PERMISSAO_ADMINISTRATIVA_TOTAL) ||
    permissoesUsuario.includes(permissaoRequerida)
  );
}
