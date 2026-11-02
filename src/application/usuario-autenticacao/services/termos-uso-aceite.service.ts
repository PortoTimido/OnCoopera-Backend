import type { TermosUsoAceiteRepository } from '../ports/termos-uso-aceite.repository.js';

export class TermosUsoAceiteService {
  constructor(private readonly aceites: TermosUsoAceiteRepository) {}

  async isAceito(usuarioId: string): Promise<boolean> {
    const termos = await this.aceites.findTermosUsoVigente();
    if (termos === null) return true;

    return this.aceites.hasAceite(usuarioId, termos.id);
  }

  async registrar(usuarioId: string): Promise<boolean> {
    const termos = await this.aceites.findTermosUsoVigente();
    if (termos === null) return true;

    await this.aceites.registerAceite(usuarioId, termos.id, new Date());
    return true;
  }
}
