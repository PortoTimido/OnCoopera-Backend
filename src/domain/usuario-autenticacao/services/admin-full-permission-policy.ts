import { DomainValidationError } from '../errors/domain-validation.error.js';

export const LAST_TOTAL_ADMIN_ERROR_MESSAGE =
  'Deve existir ao menos um administrador ativo com permissão TOTAL.';

export function assertRemainingTotalAdministrator(
  remainingActiveTotalAdministrators: number,
): void {
  if (remainingActiveTotalAdministrators < 1) {
    throw new DomainValidationError(LAST_TOTAL_ADMIN_ERROR_MESSAGE);
  }
}
