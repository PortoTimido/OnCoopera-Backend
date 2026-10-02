import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { test } from '@japa/runner';
import { BackofficeDashboardController } from '../../src/api/dashboard/backoffice-dashboard.controller.js';
import { monthlyGrowthQuerySchema } from '../../src/api/dashboard/dashboard.schemas.js';
import { JwtAuthGuard } from '../../src/api/usuario-autenticacao/jwt-auth.guard.js';
import { PermissaoAdministrativaGuard } from '../../src/api/usuario-autenticacao/permissao-administrativa.guard.js';
import type { AuthenticatedRequest } from '../../src/api/usuario-autenticacao/auth.request.js';
import type { GetMonthlyGrowthUseCase } from '../../src/application/dashboard/use-cases/get-monthly-growth.use-case.js';
import type { AuthSessionRepository } from '../../src/application/usuario-autenticacao/ports/auth-session.repository.js';
import type { UsuarioRepository } from '../../src/application/usuario-autenticacao/ports/usuario.repository.js';
import type { PermissaoAdministrativaNome } from '../../src/domain/usuario-autenticacao/entities/usuario.entity.js';

test.group('dashboard API contracts', () => {
  test('valida periodMonths obrigatório e aceita somente 6 ou 12', ({
    assert,
  }) => {
    assert.equal(
      monthlyGrowthQuerySchema.safeParse({ periodMonths: '6' }).success,
      true,
    );
    assert.equal(
      monthlyGrowthQuerySchema.safeParse({ periodMonths: '12' }).success,
      true,
    );
    assert.equal(monthlyGrowthQuerySchema.safeParse({}).success, false);
    assert.equal(
      monthlyGrowthQuerySchema.safeParse({ periodMonths: '6.0' }).success,
      false,
    );
    assert.equal(
      monthlyGrowthQuerySchema.safeParse({ periodMonths: '7' }).success,
      false,
    );
    assert.equal(
      monthlyGrowthQuerySchema.safeParse({ periodMonths: '6', extra: 'x' })
        .success,
      false,
    );
  });

  test('expõe rota versionada e contrato 200 com todos os meses', async ({
    assert,
  }) => {
    const useCase = {
      execute: () =>
        Promise.resolve({
          points: Array.from({ length: 6 }, (_, index) => ({
            month: `2026-0${index + 1}`,
            articlesPublished: index,
            supportLocations: index,
            activeUsers: index,
          })),
        }),
    } as unknown as GetMonthlyGrowthUseCase;
    const controller = new BackofficeDashboardController(useCase);
    const output = await controller.getMonthlyGrowthData(
      { periodMonths: 6 },
      requestWithPermissions(['TOTAL']),
    );

    assert.equal(
      Reflect.getMetadata('path', BackofficeDashboardController),
      'v1/backoffice/dashboard',
    );
    assert.equal(output.points.length, 6);
    assert.deepEqual(Object.keys(output.points[0] ?? {}), [
      'month',
      'articlesPublished',
      'supportLocations',
      'activeUsers',
    ]);
  });

  test('encaminha somente as séries permitidas ao caso de uso', async ({
    assert,
  }) => {
    let input: unknown;
    const controller = new BackofficeDashboardController({
      execute: (value) => {
        input = value;
        return Promise.resolve({ points: [] });
      },
    } as unknown as GetMonthlyGrowthUseCase);

    await controller.getMonthlyGrowthData(
      { periodMonths: 6 },
      requestWithPermissions(['GERENCIAR_USUARIOS']),
    );

    assert.deepEqual(input, {
      periodMonths: 6,
      includeArticlesPublished: false,
      includeSupportLocations: false,
      includeActiveUsers: true,
    });
  });

  test('guards retornam 401 sem autenticação e 403 sem permissão administrativa', async ({
    assert,
  }) => {
    const jwtGuard = new JwtAuthGuard(
      {
        sign: () => Promise.resolve('token'),
        verify: () => Promise.resolve(null),
      },
      {
        findById: () => Promise.resolve(null),
      } as unknown as AuthSessionRepository,
      { findById: () => Promise.resolve(null) } as unknown as UsuarioRepository,
    );
    const jwtError = await capture(() =>
      jwtGuard.canActivate(context({ headers: {} })),
    );
    assert.instanceOf(jwtError, UnauthorizedException);

    const permissionGuard = new PermissaoAdministrativaGuard({
      getAllAndOverride: () => ['GERENCIAR_USUARIOS'],
    } as never);
    const permissionError = await capture(() =>
      permissionGuard.canActivate(
        context({
          auth: { tipo: 'ADMINISTRADOR', permissoesAdministrativas: [] },
        }),
      ),
    );
    assert.instanceOf(permissionError, ForbiddenException);
  });
});

function requestWithPermissions(
  permissions: PermissaoAdministrativaNome[],
): AuthenticatedRequest {
  return {
    auth: {
      usuarioId: 'admin-1',
      sessaoId: 'session-1',
      tipo: 'ADMINISTRADOR',
      permissoesAdministrativas: permissions,
    },
  } as AuthenticatedRequest;
}

function context(request: object) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

async function capture(fn: () => boolean | Promise<boolean>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}
