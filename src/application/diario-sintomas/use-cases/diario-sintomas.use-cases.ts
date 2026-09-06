import { RegistroDiario, type Humor, type PublicRegistroDiario, type SintomaRegistroInput } from '../../../domain/diario-sintomas/entities/registro-diario.entity.js';
import { DiarioSintomasApplicationError } from '../errors/diario-sintomas-application.error.js';
import type { DiarioSintomasRepository, PaginatedRegistrosDiarios } from '../ports/diario-sintomas.repository.js';
import type { VoiceNoteStorage, VoiceNoteUpload } from '../ports/voice-note.storage.js';

export interface SaveDiarioInput { humor: Humor; sintomas: SintomaRegistroInput[]; notaVoz?: VoiceNoteUpload; removerNotaVoz?: boolean; }

export class ListRegistrosDiariosUseCase {
  constructor(private readonly repository: DiarioSintomasRepository) {}
  execute(pacienteId: string, page: number, pageSize: number): Promise<PaginatedRegistrosDiarios> { return this.repository.listByPaciente(pacienteId, page, pageSize); }
}
export class GetRegistroDiarioUseCase {
  constructor(private readonly repository: DiarioSintomasRepository) {}
  async execute(pacienteId: string, id: string): Promise<PublicRegistroDiario> {
    const registro = await this.repository.findByIdAndPaciente(id, pacienteId);
    if (registro === null) throw new DiarioSintomasApplicationError('NOT_FOUND', 'Registro diário não encontrado.');
    return registro;
  }
}
export class GetRegistroHojeUseCase {
  constructor(private readonly repository: DiarioSintomasRepository) {}
  execute(pacienteId: string, now = new Date()): Promise<PublicRegistroDiario | null> { return this.repository.findByPacienteAndDate(pacienteId, today(now)); }
}
export class SaveRegistroHojeUseCase {
  constructor(private readonly repository: DiarioSintomasRepository, private readonly storage: VoiceNoteStorage) {}
  async execute(pacienteId: string, input: SaveDiarioInput, now = new Date()): Promise<PublicRegistroDiario> {
    const current = await this.repository.findByPacienteAndDate(pacienteId, today(now));
    return this.persist(pacienteId, input, current, now);
  }
  async persist(pacienteId: string, input: SaveDiarioInput, current: PublicRegistroDiario | null, now: Date): Promise<PublicRegistroDiario> {
    if (input.removerNotaVoz === true && input.notaVoz !== undefined) throw new DiarioSintomasApplicationError('CONFLICT', 'Não envie um áudio ao remover a nota de voz.');
    let newKey: string | undefined;
    try {
      newKey = input.notaVoz === undefined ? undefined : await this.storage.save(input.notaVoz);
      const notaVozUrl = input.removerNotaVoz === true ? null : (newKey ?? current?.notaVozUrl ?? null);
      const dataRegistro = today(now);
      const result = RegistroDiario.create({ id: current?.id ?? 'novo', pacienteId, dataRegistro, dataHora: now, humor: input.humor, notaVozUrl, sintomas: input.sintomas.map((item, index) => ({ id: String(index), tipo: item.tipo, intensidade: item.intensidade, descricaoOutro: item.descricaoOutro?.trim() ?? null })) }).toPublic();
      const saved = await this.repository.save({ ...result, sintomas: input.sintomas });
      if (current?.notaVozUrl !== null && current?.notaVozUrl !== undefined && current.notaVozUrl !== notaVozUrl) await this.storage.remove(current.notaVozUrl);
      return saved;
    } catch (error) {
      if (newKey !== undefined) await this.storage.remove(newKey).catch(() => undefined);
      throw error;
    }
  }
}
export class UpdateRegistroHojeUseCase {
  constructor(private readonly get: GetRegistroDiarioUseCase, private readonly save: SaveRegistroHojeUseCase) {}
  async execute(pacienteId: string, id: string, input: SaveDiarioInput, now = new Date()): Promise<PublicRegistroDiario> {
    const current = await this.get.execute(pacienteId, id);
    if (!sameDay(current.dataRegistro, now)) throw new DiarioSintomasApplicationError('CONFLICT', 'Apenas o registro do dia atual pode ser editado.');
    return this.save.persist(pacienteId, input, current, now);
  }
}
export function today(now: Date): Date { return new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
function sameDay(value: Date, other: Date): boolean { const day = today(other); return value.getFullYear() === day.getFullYear() && value.getMonth() === day.getMonth() && value.getDate() === day.getDate(); }
