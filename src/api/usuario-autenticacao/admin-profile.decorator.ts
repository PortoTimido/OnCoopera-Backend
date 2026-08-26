import { SetMetadata } from '@nestjs/common';
import type { PerfilAdministrativoNome } from '../../domain/usuario-autenticacao/entities/usuario.entity.js';

export const ADMIN_PROFILES_METADATA_KEY = 'usuario-auth:admin-profiles';

export function RequireAdminProfiles(...profiles: PerfilAdministrativoNome[]) {
  return SetMetadata(ADMIN_PROFILES_METADATA_KEY, profiles);
}
