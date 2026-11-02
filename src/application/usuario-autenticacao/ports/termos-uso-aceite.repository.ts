export interface TermosUsoVigente {
  id: string;
}

export interface TermosUsoAceiteRepository {
  findTermosUsoVigente(): Promise<TermosUsoVigente | null>;
  hasAceite(usuarioId: string, documentoId: string): Promise<boolean>;
  registerAceite(
    usuarioId: string,
    documentoId: string,
    aceitoEm: Date,
  ): Promise<void>;
}

export const TERMOS_USO_ACEITE_REPOSITORY = Symbol(
  'TERMOS_USO_ACEITE_REPOSITORY',
);
