import { test } from '@japa/runner';
import { RegistroDiario } from '../../src/domain/diario-sintomas/entities/registro-diario.entity.js';
import { DomainValidationError } from '../../src/domain/diario-sintomas/errors/domain-validation.error.js';

test.group('diário de sintomas domain', () => {
  test('aceita sintomas válidos e exige descrição para OUTRO', ({ assert }) => {
    assert.equal(create().toPublic().sintomas[0]?.tipo, 'DOR');
    assert.equal(create({ sintomas: [{ id: 's', tipo: 'OUTRO', intensidade: 5, descricaoOutro: 'Coceira' }] }).toPublic().sintomas[0]?.descricaoOutro, 'Coceira');
    assert.instanceOf(capture(() => create({ sintomas: [{ id: 's', tipo: 'OUTRO', intensidade: 5, descricaoOutro: null }] })), DomainValidationError);
  });
  test('protege intensidade e duplicidade de sintomas', ({ assert }) => {
    assert.instanceOf(capture(() => create({ sintomas: [{ id: 's', tipo: 'DOR', intensidade: 11, descricaoOutro: null }] })), DomainValidationError);
    assert.instanceOf(capture(() => create({ sintomas: [{ id: 's1', tipo: 'DOR', intensidade: 1, descricaoOutro: null }, { id: 's2', tipo: 'DOR', intensidade: 2, descricaoOutro: null }] })), DomainValidationError);
  });
});
function create(overrides: Partial<Parameters<typeof RegistroDiario.create>[0]> = {}) {
  const now = new Date('2026-09-06T12:00:00.000Z');
  return RegistroDiario.create({ id: 'registro-1', pacienteId: 'paciente-1', dataRegistro: now, dataHora: now, humor: 'BEM', notaVozUrl: null, sintomas: [{ id: 's1', tipo: 'DOR', intensidade: 5, descricaoOutro: null }], ...overrides });
}
function capture(fn: () => unknown): unknown { try { fn(); return null; } catch (error) { return error; } }
