import { ForbiddenException } from '@nestjs/common';
import { test } from '@japa/runner';
import { saveDiarioSchema } from '../../src/api/diario-sintomas/diario-sintomas.schemas.js';
import { PatientDiarioGuard } from '../../src/api/diario-sintomas/patient-diario.guard.js';
import { MobileDiarioSintomasController } from '../../src/api/diario-sintomas/mobile-diario-sintomas.controller.js';

test.group('diário de sintomas API', () => {
  test('valida contrato multipart e rota versionada', ({ assert }) => {
    assert.equal(saveDiarioSchema.safeParse({ humor: 'BEM', sintomas: JSON.stringify([{ tipo: 'OUTRO', intensidade: 2, descricaoOutro: 'Outro' }]) }).success, true);
    assert.equal(saveDiarioSchema.safeParse({ humor: 'BEM', sintomas: JSON.stringify([{ tipo: 'OUTRO', intensidade: 2 }]) }).success, false);
    assert.equal(Reflect.getMetadata('path', MobileDiarioSintomasController), 'v1/mobile/diario-sintomas');
  });
  test('guard bloqueia usuário não paciente', ({ assert }) => {
    const guard = new PatientDiarioGuard();
    const error = capture(() => guard.canActivate({ switchToHttp: () => ({ getRequest: () => ({ auth: { tipo: 'ADMINISTRADOR' } }) }) } as never));
    assert.instanceOf(error, ForbiddenException);
  });
});
function capture(fn: () => unknown): unknown { try { fn(); return null; } catch (error) { return error; } }
