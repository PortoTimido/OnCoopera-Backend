import {
  BadRequestException,
  ForbiddenException,
  type ExecutionContext,
} from '@nestjs/common';
import { test } from '@japa/runner';
import { BackofficeDocumentosLegaisController } from '../../src/api/documento-legal/backoffice-documentos-legais.controller.js';
import { MobileDocumentosLegaisController } from '../../src/api/documento-legal/mobile-documentos-legais.controller.js';
import {
  createDocumentoLegalSchema,
  updateDocumentoLegalSchema,
} from '../../src/api/documento-legal/documento-legal.schemas.js';
import { ZodValidationPipe } from '../../src/api/common/zod-validation.pipe.js';
import { PermissaoAdministrativaGuard } from '../../src/api/usuario-autenticacao/permissao-administrativa.guard.js';

test.group('documento legal API contracts', () => {
  test('valida os payloads de criação e atualização', ({ assert }) => {
    assert.equal(
      createDocumentoLegalSchema.safeParse({
        tipo: 'TERMOS_USO',
        conteudo: 'Conteúdo',
      }).success,
      true,
    );
    assert.equal(
      updateDocumentoLegalSchema.safeParse({ conteudo: '' }).success,
      false,
    );
  });

  test('transforma payload inválido em 400', ({ assert }) => {
    const pipe = new ZodValidationPipe(createDocumentoLegalSchema);
    const error = captureSyncError(() =>
      pipe.transform({ tipo: 'INVALIDO', conteudo: '' }),
    );

    assert.instanceOf(error, BadRequestException);
  });

  test('exige permissão TOTAL no backoffice', ({ assert }) => {
    const guard = new PermissaoAdministrativaGuard(createReflector(['TOTAL']));
    assert.equal(guard.canActivate(createExecutionContext(['TOTAL'])), true);

    const error = captureSyncError(() =>
      guard.canActivate(createExecutionContext(['GESTAO_CONTEUDOS'])),
    );
    assert.instanceOf(error, ForbiddenException);
  });

  test('controllers expõem os paths de backoffice e mobile', ({ assert }) => {
    assert.equal(
      Reflect.getMetadata('path', BackofficeDocumentosLegaisController),
      'backoffice/documentos-legais',
    );
    assert.equal(
      Reflect.getMetadata('path', MobileDocumentosLegaisController),
      'mobile/documentos-legais',
    );
  });
});

function createExecutionContext(
  permissoesAdministrativas: string[],
): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        auth: {
          usuarioId: 'admin-1',
          sessaoId: 'sessao-1',
          tipo: 'ADMINISTRADOR',
          permissoesAdministrativas,
        },
      }),
    }),
  } as ExecutionContext;
}

function createReflector(requiredPermissoes: string[]) {
  return { getAllAndOverride: () => requiredPermissoes } as never;
}

function captureSyncError(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}
