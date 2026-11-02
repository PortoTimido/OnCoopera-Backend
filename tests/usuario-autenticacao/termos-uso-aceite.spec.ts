import { test } from '@japa/runner';
import type { TermosUsoAceiteRepository } from '../../src/application/usuario-autenticacao/ports/termos-uso-aceite.repository.js';
import { TermosUsoAceiteService } from '../../src/application/usuario-autenticacao/services/termos-uso-aceite.service.js';
import { MobileAceitesDocumentosController } from '../../src/api/usuario-autenticacao/mobile-aceites-documentos.controller.js';
import { TermosUsoAceiteGuard } from '../../src/api/usuario-autenticacao/termos-uso-aceite.guard.js';
import type { ExecutionContext } from '@nestjs/common';

test.group('aceite de termos de uso', () => {
  test('considera aceito quando não há Termo de Uso vigente', async ({
    assert,
  }) => {
    const service = new TermosUsoAceiteService(
      new InMemoryTermosUsoAceiteRepository(null),
    );

    assert.equal(await service.isAceito('paciente-1'), true);
    assert.equal(await service.registrar('paciente-1'), true);
  });

  test('registra aceite de modo idempotente e exige novo aceite por versão', async ({
    assert,
  }) => {
    const repository = new InMemoryTermosUsoAceiteRepository('termos-v1');
    const service = new TermosUsoAceiteService(repository);

    assert.equal(await service.isAceito('paciente-1'), false);
    await service.registrar('paciente-1');
    await service.registrar('paciente-1');
    assert.equal(repository.registros.size, 1);
    assert.equal(await service.isAceito('paciente-1'), true);

    repository.termosUsoId = 'termos-v2';
    assert.equal(await service.isAceito('paciente-1'), false);
  });

  test('controller expõe a rota mobile e delega ao paciente autenticado', async ({
    assert,
  }) => {
    const calls: string[] = [];
    const controller = new MobileAceitesDocumentosController({
      isAceito: async (usuarioId: string) => {
        calls.push(`get:${usuarioId}`);
        return false;
      },
      registrar: async (usuarioId: string) => {
        calls.push(`post:${usuarioId}`);
        return true;
      },
    } as TermosUsoAceiteService,
    {
      findById: async () => ({ id: 'paciente-1' }),
    } as never,
    {
      issue: async () => ({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        csrfToken: 'csrf-token',
        refreshExpiresAt: new Date(),
      }),
    } as never,
    {} as never);
    const request = { auth: { usuarioId: 'paciente-1' } } as never;
    const response = { cookie: () => undefined } as never;

    assert.deepEqual(await controller.getTermosUso(request), { aceito: false });
    assert.deepEqual(await controller.acceptTermosUso(request, response), {
      accessToken: 'access-token',
    });
    assert.deepEqual(calls, ['get:paciente-1', 'post:paciente-1']);
    assert.equal(
      Reflect.getMetadata('path', MobileAceitesDocumentosController),
      'mobile/aceites-documentos',
    );
  });

  test('guarda aceita token restrito somente para paciente ativo', async ({
    assert,
  }) => {
    const guard = new TermosUsoAceiteGuard(
      {
        verify: async () => ({
          sub: 'paciente-1',
          scope: 'TERMOS_USO_ACEITE' as const,
        }),
      } as never,
      {} as never,
      {
        findById: async () => ({
          id: 'paciente-1',
          tipo: 'PACIENTE',
          isActive: () => true,
        }),
      } as never,
    );
    const request = { headers: { authorization: 'Bearer token-aceite' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    assert.equal(await guard.canActivate(context), true);
    assert.equal(
      (request as { auth?: { usuarioId: string } }).auth?.usuarioId,
      'paciente-1',
    );
  });
});

class InMemoryTermosUsoAceiteRepository implements TermosUsoAceiteRepository {
  readonly registros = new Set<string>();

  constructor(public termosUsoId: string | null) {}

  async findTermosUsoVigente() {
    return this.termosUsoId === null ? null : { id: this.termosUsoId };
  }

  async hasAceite(usuarioId: string, documentoId: string) {
    return this.registros.has(`${usuarioId}:${documentoId}`);
  }

  async registerAceite(usuarioId: string, documentoId: string) {
    this.registros.add(`${usuarioId}:${documentoId}`);
  }
}
