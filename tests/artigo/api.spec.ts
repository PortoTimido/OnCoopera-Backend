import {
  BadRequestException,
  ForbiddenException,
  type ExecutionContext,
} from '@nestjs/common';
import { test } from '@japa/runner';
import { PermissaoAdministrativaGuard } from '../../src/api/usuario-autenticacao/permissao-administrativa.guard.js';
import { BackofficeArtigosController } from '../../src/api/artigo/backoffice-artigos.controller.js';
import {
  BackofficeArtigoCategoriasController,
  BackofficeArtigoTagsController,
} from '../../src/api/artigo/backoffice-artigo-taxonomia.controller.js';
import {
  createArtigoSchema,
  listPublishedArtigosQuerySchema,
} from '../../src/api/artigo/artigo.schemas.js';
import { MobileArtigosController } from '../../src/api/artigo/mobile-artigos.controller.js';
import { ZodValidationPipe } from '../../src/api/common/zod-validation.pipe.js';
import type { AuthenticatedRequest } from '../../src/api/usuario-autenticacao/auth.request.js';
import { CreateArtigoUseCase } from '../../src/application/artigo/use-cases/create-artigo.use-case.js';
import { DeleteArtigoUseCase } from '../../src/application/artigo/use-cases/delete-artigo.use-case.js';
import { GetArtigoDetailsUseCase } from '../../src/application/artigo/use-cases/get-artigo-details.use-case.js';
import { ListArtigosUseCase } from '../../src/application/artigo/use-cases/list-artigos.use-case.js';
import { UpdateArtigoUseCase } from '../../src/application/artigo/use-cases/update-artigo.use-case.js';

test.group('artigo API contracts', () => {
  test('schemas aceitam payload valido e rejeitam payload invalido', ({
    assert,
  }) => {
    const validResult = createArtigoSchema.safeParse({
      titulo: 'Artigo',
      conteudo: 'Conteudo',
      tempoLeituraMinutos: 3,
      status: 'PUBLICADO',
      categoriaIds: ['018f5f18-1a2b-7c3d-9e4f-123456789abc'],
      tagIds: ['018f5f18-1a2b-7c3d-9e4f-abcdefabcdef'],
    });
    const invalidResult = createArtigoSchema.safeParse({
      titulo: '',
      conteudo: '',
      tempoLeituraMinutos: 0,
      categoriaIds: [],
    });
    const mobileQueryResult = listPublishedArtigosQuerySchema.safeParse({
      page: '1',
      pageSize: '20',
      status: 'RASCUNHO',
    });

    assert.equal(validResult.success, true);
    assert.equal(invalidResult.success, false);
    assert.equal(mobileQueryResult.success, false);
  });

  test('ZodValidationPipe transforma artigo invalido em 400', async ({
    assert,
  }) => {
    const pipe = new ZodValidationPipe(createArtigoSchema);
    const error = await captureError(() =>
      Promise.resolve(
        pipe.transform({
          titulo: '',
          conteudo: '',
          tempoLeituraMinutos: 0,
          categoriaIds: [],
        }),
      ),
    );

    assert.instanceOf(error, BadRequestException);
  });

  test('guard permite TOTAL ou GESTAO_CONTEUDOS e rejeita outras permissões', ({
    assert,
  }) => {
    const guard = new PermissaoAdministrativaGuard(
      createReflector(['GESTAO_CONTEUDOS']),
    );

    assert.equal(
      guard.canActivate(
        createExecutionContext({
          auth: {
            usuarioId: 'admin-1',
            sessaoId: 'session-1',
            tipo: 'ADMINISTRADOR',
            permissoesAdministrativas: ['TOTAL'],
          },
        }),
      ),
      true,
    );
    assert.equal(
      guard.canActivate(
        createExecutionContext({
          auth: {
            usuarioId: 'admin-2',
            sessaoId: 'session-2',
            tipo: 'ADMINISTRADOR',
            permissoesAdministrativas: ['GESTAO_CONTEUDOS'],
          },
        }),
      ),
      true,
    );

    const error = captureSyncError(() =>
      guard.canActivate(
        createExecutionContext({
          auth: {
            usuarioId: 'admin-3',
            sessaoId: 'session-3',
            tipo: 'ADMINISTRADOR',
            permissoesAdministrativas: ['GESTAO_RADAR_APOIO'],
          },
        }),
      ),
    );

    assert.instanceOf(error, ForbiddenException);
  });

  test('controller de criacao usa usuario autenticado como autor', async ({
    assert,
  }) => {
    const createCalls: unknown[] = [];
    const controller = new BackofficeArtigosController(
      { execute: () => Promise.resolve({ data: [] }) } as ListArtigosUseCase,
      { execute: () => Promise.resolve({}) } as GetArtigoDetailsUseCase,
      {
        execute: (input: unknown) => {
          createCalls.push(input);
          return Promise.resolve({ id: 'artigo-1' });
        },
      } as CreateArtigoUseCase,
      { execute: () => Promise.resolve({}) } as UpdateArtigoUseCase,
      { execute: () => Promise.resolve() } as DeleteArtigoUseCase,
    );

    await controller.create(
      {
        auth: {
          usuarioId: 'admin-1',
          sessaoId: 'session-1',
          tipo: 'ADMINISTRADOR',
          permissoesAdministrativas: ['TOTAL'],
        },
      } as AuthenticatedRequest,
      {
        titulo: 'Artigo',
        resumo: null,
        conteudo: 'Conteudo',
        tempoLeituraMinutos: 3,
        imagemUrl: null,
        status: 'RASCUNHO',
        categoriaIds: ['018f5f18-1a2b-7c3d-9e4f-123456789abc'],
        tagIds: [],
      },
    );

    assert.deepInclude(createCalls[0], { autorId: 'admin-1' });
  });

  test('controllers ficam disponiveis nos paths esperados para Swagger', ({
    assert,
  }) => {
    assert.equal(
      Reflect.getMetadata('path', BackofficeArtigosController),
      'backoffice/artigos',
    );
    assert.equal(
      Reflect.getMetadata('path', BackofficeArtigoCategoriasController),
      'backoffice/artigo-categorias',
    );
    assert.equal(
      Reflect.getMetadata('path', BackofficeArtigoTagsController),
      'backoffice/artigo-tags',
    );
    assert.equal(
      Reflect.getMetadata('path', MobileArtigosController),
      'mobile/artigos',
    );
  });
});

function createExecutionContext(
  request: Partial<AuthenticatedRequest>,
): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}

function captureSyncError(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

function createReflector(requiredPermissoes: string[]) {
  return {
    getAllAndOverride: () => requiredPermissoes,
  } as never;
}
