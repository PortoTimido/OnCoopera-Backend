import type { Humor, PublicRegistroDiario, SintomaRegistroInput } from '../../../domain/diario-sintomas/entities/registro-diario.entity.js';

export const DIARIO_SINTOMAS_REPOSITORY = Symbol('DIARIO_SINTOMAS_REPOSITORY');

export interface SaveRegistroDiarioInput {
  pacienteId: string;
  dataRegistro: Date;
  dataHora: Date;
  humor: Humor;
  notaVozUrl: string | null;
  sintomas: SintomaRegistroInput[];
}
export interface PaginatedRegistrosDiarios { data: PublicRegistroDiario[]; page: number; pageSize: number; total: number; totalPages: number; }
export interface DiarioSintomasRepository {
  listByPaciente(pacienteId: string, page: number, pageSize: number): Promise<PaginatedRegistrosDiarios>;
  findByIdAndPaciente(id: string, pacienteId: string): Promise<PublicRegistroDiario | null>;
  findByPacienteAndDate(pacienteId: string, dataRegistro: Date): Promise<PublicRegistroDiario | null>;
  save(input: SaveRegistroDiarioInput): Promise<PublicRegistroDiario>;
}
