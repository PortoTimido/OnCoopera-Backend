import { test } from '@japa/runner';
import type { PublicRegistroDiario } from '../../src/domain/diario-sintomas/entities/registro-diario.entity.js';
import type {
  DiarioSintomasRepository,
  PaginatedRegistrosDiarios,
  SaveRegistroDiarioInput,
} from '../../src/application/diario-sintomas/ports/diario-sintomas.repository.js';
import type { VoiceNoteStorage } from '../../src/application/diario-sintomas/ports/voice-note.storage.js';
import {
  GetRegistroDiarioUseCase,
  GetRegistroHojeUseCase,
  SaveRegistroHojeUseCase,
  today,
  UpdateRegistroHojeUseCase,
} from '../../src/application/diario-sintomas/use-cases/diario-sintomas.use-cases.js';
import { DiarioSintomasApplicationError } from '../../src/application/diario-sintomas/errors/diario-sintomas-application.error.js';

test.group('diário de sintomas application', () => {
  test('usa o dia de Brasília ao salvar e buscar perto da meia-noite UTC', async ({
    assert,
  }) => {
    const repository = new MemoryRepository();
    const save = new SaveRegistroHojeUseCase(repository, new MemoryStorage());
    const now = new Date('2026-10-14T01:00:00.000Z');
    const result = await save.execute('paciente-1', input(), now);

    assert.equal(today(now).toISOString(), '2026-10-13T00:00:00.000Z');
    assert.equal(result.dataRegistro.toISOString(), '2026-10-13T00:00:00.000Z');
    assert.equal(
      (await new GetRegistroHojeUseCase(repository).execute('paciente-1', now))
        ?.id,
      result.id,
    );
    const update = new UpdateRegistroHojeUseCase(
      new GetRegistroDiarioUseCase(repository),
      save,
    );
    assert.equal(
      (await update.execute('paciente-1', result.id, input(), now)).id,
      result.id,
    );
    assert.equal(
      today(new Date('2026-10-14T03:00:00.000Z')).toISOString(),
      '2026-10-14T00:00:00.000Z',
    );
    assert.isNull(
      await new GetRegistroHojeUseCase(repository).execute(
        'paciente-1',
        new Date('2026-10-14T03:00:00.000Z'),
      ),
    );
  });
  test('salva uma única entrada de hoje e troca o áudio anterior', async ({
    assert,
  }) => {
    const repository = new MemoryRepository();
    const storage = new MemoryStorage();
    const save = new SaveRegistroHojeUseCase(repository, storage);
    const now = new Date(2026, 8, 6, 9);
    await save.execute(
      'paciente-1',
      input({ buffer: Buffer.from('novo'), mimetype: 'audio/mpeg' }),
      now,
    );
    const result = await save.execute(
      'paciente-1',
      input({ buffer: Buffer.from('substituto'), mimetype: 'audio/mpeg' }),
      now,
    );
    assert.equal(repository.items.size, 1);
    assert.equal(result.notaVozUrl, 'audio-2.mp3');
    assert.deepEqual(storage.removed, ['audio-1.mp3']);
  });
  test('não edita registro de dia anterior', async ({ assert }) => {
    const repository = new MemoryRepository();
    const storage = new MemoryStorage();
    const past = new Date('2026-09-05T00:00:00.000Z');
    repository.items.set(
      'passado',
      registro({ id: 'passado', dataRegistro: past }),
    );
    const update = new UpdateRegistroHojeUseCase(
      new GetRegistroDiarioUseCase(repository),
      new SaveRegistroHojeUseCase(repository, storage),
    );
    const error = await capture(() =>
      update.execute(
        'paciente-1',
        'passado',
        input(),
        new Date('2026-09-06T12:00:00.000Z'),
      ),
    );
    assert.instanceOf(error, DiarioSintomasApplicationError);
    assert.equal((error as DiarioSintomasApplicationError).code, 'CONFLICT');
  });
});
function input(notaVoz?: { buffer: Buffer; mimetype: string }) {
  return {
    humor: 'BEM' as const,
    sintomas: [{ tipo: 'DOR' as const, intensidade: 3 }],
    notaVoz,
  };
}
class MemoryStorage implements VoiceNoteStorage {
  removed: string[] = [];
  private count = 0;
  async save() {
    this.count += 1;
    return `audio-${this.count}.mp3`;
  }
  async remove(key: string) {
    this.removed.push(key);
  }
  async read() {
    return Buffer.alloc(0);
  }
}
class MemoryRepository implements DiarioSintomasRepository {
  items = new Map<string, PublicRegistroDiario>();
  async listByPaciente(
    _patient: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedRegistrosDiarios> {
    const data = [...this.items.values()];
    return { data, page, pageSize, total: data.length, totalPages: 1 };
  }
  async findByIdAndPaciente(id: string, patient: string) {
    const item = this.items.get(id);
    return item?.pacienteId === patient ? item : null;
  }
  async findByPacienteAndDate(patient: string, day: Date) {
    return (
      [...this.items.values()].find(
        (item) =>
          item.pacienteId === patient &&
          item.dataRegistro.getTime() === day.getTime(),
      ) ?? null
    );
  }
  async save(input: SaveRegistroDiarioInput) {
    const current = await this.findByPacienteAndDate(
      input.pacienteId,
      input.dataRegistro,
    );
    const item = registro({
      id: current?.id ?? 'novo',
      ...input,
      sintomas: input.sintomas.map((value, index) => ({
        id: String(index),
        ...value,
        descricaoOutro: value.descricaoOutro ?? null,
      })),
    });
    this.items.set(item.id, item);
    return item;
  }
}
function registro(
  overrides: Partial<PublicRegistroDiario> = {},
): PublicRegistroDiario {
  const now = new Date(2026, 8, 6);
  return {
    id: 'registro-1',
    pacienteId: 'paciente-1',
    dataRegistro: now,
    dataHora: now,
    humor: 'BEM',
    notaVozUrl: null,
    sintomas: [{ id: 's', tipo: 'DOR', intensidade: 2, descricaoOutro: null }],
    ...overrides,
  };
}
async function capture(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}
