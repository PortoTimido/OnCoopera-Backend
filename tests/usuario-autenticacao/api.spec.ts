import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { test } from '@japa/runner';
import type { CookieOptions, Response } from 'express';
import { ZodValidationPipe } from '../../src/api/common/zod-validation.pipe.js';
import { PermissaoAdministrativaGuard } from '../../src/api/usuario-autenticacao/permissao-administrativa.guard.js';
import { AuthController } from '../../src/api/usuario-autenticacao/auth.controller.js';
import {
  CSRF_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  csrfCookieOptions,
  refreshCookieOptions,
} from '../../src/api/usuario-autenticacao/auth-cookie.service.js';
import type { AuthenticatedRequest } from '../../src/api/usuario-autenticacao/auth.request.js';
import { loginSchema } from '../../src/api/usuario-autenticacao/auth.schemas.js';
import {
  JwtAuthGuard,
  extractBearerToken,
} from '../../src/api/usuario-autenticacao/jwt-auth.guard.js';
import { AuthApplicationError } from '../../src/application/usuario-autenticacao/errors/auth-application.error.js';
import { mapAuthError } from '../../src/api/usuario-autenticacao/auth-error.mapper.js';
import type { AccessTokenService } from '../../src/application/usuario-autenticacao/ports/access-token.service.js';
import type { AuthConfig } from '../../src/application/usuario-autenticacao/ports/auth-config.js';
import type { AuthSessionRepository } from '../../src/application/usuario-autenticacao/ports/auth-session.repository.js';
import type { UsuarioRepository } from '../../src/application/usuario-autenticacao/ports/usuario.repository.js';
import { BackofficeUsuariosController } from '../../src/api/usuario-autenticacao/backoffice-usuarios.controller.js';
import { MobilePacientesController } from '../../src/api/usuario-autenticacao/mobile-pacientes.controller.js';
import { createPacienteSchema } from '../../src/api/usuario-autenticacao/user-crud.schemas.js';
import { AuthenticateUserUseCase } from '../../src/application/usuario-autenticacao/use-cases/authenticate-user.use-case.js';
import { ChangePasswordUseCase } from '../../src/application/usuario-autenticacao/use-cases/change-password.use-case.js';
import { ChangeTemporaryPasswordUseCase } from '../../src/application/usuario-autenticacao/use-cases/change-temporary-password.use-case.js';
import { GetAuthenticatedUserUseCase } from '../../src/application/usuario-autenticacao/use-cases/get-authenticated-user.use-case.js';
import { LogoutSessionUseCase } from '../../src/application/usuario-autenticacao/use-cases/logout-session.use-case.js';
import { RefreshSessionUseCase } from '../../src/application/usuario-autenticacao/use-cases/refresh-session.use-case.js';
import { UpdateOwnProfileUseCase } from '../../src/application/usuario-autenticacao/use-cases/update-own-profile.use-case.js';

const authConfig: AuthConfig = {
  jwtAccessSecret: 'test-access-secret',
  tokenHashSecret: 'test-token-secret',
  bcryptSaltRounds: 12,
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 7,
  cookieSecure: false,
};

test.group('usuario-autenticacao API contracts', () => {
  test('login schema aceita payload válido e rejeita payload inválido', ({
    assert,
  }) => {
    const validResult = loginSchema.safeParse({
      identificador: ' user@example.com ',
      senha: 'SenhaAtual!123',
    });
    const invalidResult = loginSchema.safeParse({
      identificador: 'u',
      senha: '',
    });

    assert.equal(validResult.success, true);
    assert.equal(invalidResult.success, false);
  });

  test('ZodValidationPipe transforma payload inválido em 400', async ({
    assert,
  }) => {
    const pipe = new ZodValidationPipe(loginSchema);
    const error = await captureError(() =>
      Promise.resolve(pipe.transform({ identificador: 'u', senha: '' })),
    );

    assert.equal(error instanceof BadRequestException, true);
    assert.equal((error as BadRequestException).getStatus(), 400);
  });

  test('cookies usam refresh HttpOnly e CSRF legível com path de auth', ({
    assert,
  }) => {
    const refreshOptions = refreshCookieOptions(authConfig);
    const csrfOptions = csrfCookieOptions(authConfig);

    assert.equal(refreshOptions.httpOnly, true);
    assert.equal(csrfOptions.httpOnly, false);
    assert.equal(refreshOptions.path, '/api/auth');
    assert.equal(csrfOptions.path, '/api/auth');
    assert.equal(refreshOptions.sameSite, 'strict');
    assert.equal(csrfOptions.sameSite, 'strict');
    assert.equal(refreshOptions.maxAge, 604800000);
    assert.equal(csrfOptions.maxAge, 604800000);
  });

  test('extração de Bearer token rejeita header ausente ou inválido', ({
    assert,
  }) => {
    assert.equal(extractBearerToken(undefined), null);
    assert.equal(extractBearerToken('Basic token'), null);
    assert.equal(extractBearerToken('Bearer '), null);
    assert.equal(extractBearerToken('Bearer access-token'), 'access-token');
  });

  test('login retorna usuário sanitizado e seta cookies corretos', async ({
    assert,
  }) => {
    const response = new FakeResponse();
    const controller = createController();

    const output = await controller.login(
      { identificador: 'user@example.com', senha: 'SenhaAtual!123' },
      response.asResponse(),
    );

    assert.equal(output.accessToken, 'access-token');
    assert.equal(output.usuario.id, 'user-1');
    assert.equal(JSON.stringify(output).includes('senhaHash'), false);
    assert.equal(JSON.stringify(output).includes('refresh-token'), false);
    assert.equal(JSON.stringify(output).includes('csrf-token'), false);
    assert.equal(response.hasCookie(REFRESH_TOKEN_COOKIE), true);
    assert.equal(response.hasCookie(CSRF_TOKEN_COOKIE), true);
    assert.equal(response.cookieHasHttpOnly(REFRESH_TOKEN_COOKIE), true);
    assert.equal(response.cookieHasHttpOnly(CSRF_TOKEN_COOKIE), false);
  });

  test('rotas protegidas retornam 401 sem Bearer token', async ({ assert }) => {
    const guard = new JwtAuthGuard(
      createUnauthorizedAccessTokenService(),
      createEmptySessionRepository(),
      createEmptyUsuarioRepository(),
    );
    const error = await captureError(() =>
      guard.canActivate(createExecutionContext({ headers: {} })),
    );

    assert.equal(error instanceof UnauthorizedException, true);
    assert.equal((error as UnauthorizedException).getStatus(), 401);
  });

  test('refresh e logout retornam 403 quando CSRF não confere', async ({
    assert,
  }) => {
    const controller = createController({
      refreshError: new AuthApplicationError(
        'INVALID_CSRF_TOKEN',
        'CSRF inválido.',
      ),
      logoutError: new AuthApplicationError(
        'INVALID_CSRF_TOKEN',
        'CSRF inválido.',
      ),
    });
    const request = {
      cookies: {
        [REFRESH_TOKEN_COOKIE]: 'refresh-token',
      },
    } as AuthenticatedRequest;

    const refreshError = await captureError(() =>
      controller.refresh(
        request,
        'csrf-invalido',
        new FakeResponse().asResponse(),
      ),
    );
    const logoutError = await captureError(() =>
      controller.logout(
        request,
        'csrf-invalido',
        new FakeResponse().asResponse(),
      ),
    );

    assert.equal(refreshError instanceof ForbiddenException, true);
    assert.equal((refreshError as ForbiddenException).getStatus(), 403);
    assert.equal(logoutError instanceof ForbiddenException, true);
    assert.equal((logoutError as ForbiddenException).getStatus(), 403);
  });

  test('conflitos de email/login e troca obrigatória mapeiam para 409', ({
    assert,
  }) => {
    const duplicateError = mapAuthError(
      new AuthApplicationError('CONFLICT', 'Email ou login já cadastrado.'),
    );
    const temporaryPasswordError = mapAuthError(
      new AuthApplicationError(
        'PASSWORD_CHANGE_REQUIRED',
        'Troca de senha obrigatória.',
      ),
    );

    assert.equal(duplicateError instanceof ConflictException, true);
    assert.equal((duplicateError as ConflictException).getStatus(), 409);
    assert.equal(temporaryPasswordError instanceof ConflictException, true);
    assert.deepEqual(
      (temporaryPasswordError as ConflictException).getResponse(),
      {
        code: 'TROCA_SENHA_OBRIGATORIA',
        message: 'Troca de senha obrigatória.',
      },
    );
  });

  test('guard administrativo autoriza por permissão específica', ({
    assert,
  }) => {
    const guard = new PermissaoAdministrativaGuard(
      createReflector(['GERENCIAR_USUARIOS']),
    );

    assert.equal(
      guard.canActivate(
        createExecutionContext({
          auth: {
            usuarioId: 'admin-1',
            sessaoId: 'session-1',
            tipo: 'ADMINISTRADOR',
            permissoesAdministrativas: ['GERENCIAR_USUARIOS'],
          },
        }),
      ),
      true,
    );
  });

  test('guard administrativo autoriza qualquer recurso para TOTAL', ({
    assert,
  }) => {
    const guard = new PermissaoAdministrativaGuard(
      createReflector(['GESTAO_RADAR_APOIO']),
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
  });

  test('guard administrativo nega acesso sem a permissão necessária', ({
    assert,
  }) => {
    const guard = new PermissaoAdministrativaGuard(
      createReflector(['GERENCIAR_USUARIOS']),
    );

    const error = captureSyncError(() =>
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
    );

    assert.equal(error instanceof ForbiddenException, true);
    assert.equal((error as ForbiddenException).getStatus(), 403);
  });

  test('schemas e controllers do CRUD ficam disponíveis para Swagger', ({
    assert,
  }) => {
    const pacientePayload = createPacienteSchema.safeParse({
      nome: 'Paciente Teste',
      email: 'paciente@example.com',
      login: 'paciente.teste',
      telefone: '11999998888',
      dataNascimento: '1990-05-20',
      senha: 'SenhaPaciente!123',
      endereco: {
        cep: '01310-930',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        latitude: -23.561684,
        longitude: -46.655981,
      },
    });

    assert.equal(pacientePayload.success, true);
    assert.equal(
      Reflect.getMetadata('path', BackofficeUsuariosController),
      'backoffice',
    );
    assert.equal(
      Reflect.getMetadata('path', MobilePacientesController),
      'mobile/pacientes',
    );
  });
});

function createController(options?: {
  refreshError?: Error;
  logoutError?: Error;
}): AuthController {
  return new AuthController(
    {
      execute: () =>
        Promise.resolve({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          csrfToken: 'csrf-token',
          refreshExpiresAt: new Date('2026-01-08T00:00:00.000Z'),
          usuario: {
            id: 'user-1',
            nome: 'Usuário Teste',
            email: 'user@example.com',
            login: 'usuario.teste',
            telefone: '11999998888',
            dataNascimento: new Date('1990-05-20T00:00:00.000Z'),
            status: 'ATIVO',
            tipo: 'USUARIO',
            permissoesAdministrativas: [],
            trocaSenhaObrigatoria: false,
            ultimoAcesso: new Date('2026-01-01T00:00:00.000Z'),
          },
        }),
    } as AuthenticateUserUseCase,
    {
      execute: () =>
        options?.refreshError !== undefined
          ? Promise.reject(options.refreshError)
          : Promise.resolve({
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
              csrfToken: 'csrf-token',
              refreshExpiresAt: new Date('2026-01-08T00:00:00.000Z'),
              usuario: {},
            }),
    } as RefreshSessionUseCase,
    {
      execute: () =>
        options?.logoutError !== undefined
          ? Promise.reject(options.logoutError)
          : Promise.resolve(),
    } as LogoutSessionUseCase,
    {
      execute: () => Promise.resolve({}),
    } as GetAuthenticatedUserUseCase,
    {
      execute: () => Promise.resolve(),
    } as ChangePasswordUseCase,
    {
      execute: () => Promise.resolve(),
    } as ChangeTemporaryPasswordUseCase,
    {
      execute: () => Promise.resolve({}),
    } as UpdateOwnProfileUseCase,
    authConfig,
  );
}

async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}

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

function createUnauthorizedAccessTokenService(): AccessTokenService {
  return {
    sign: () => Promise.resolve('access-token'),
    verify: () => Promise.resolve(null),
  };
}

function createEmptySessionRepository(): AuthSessionRepository {
  return {
    create: () => Promise.reject(new Error('Não usado neste teste.')),
    findById: () => Promise.resolve(null),
    findByRefreshTokenHash: () => Promise.resolve(null),
    rotate: () => Promise.reject(new Error('Não usado neste teste.')),
    revoke: () => Promise.resolve(),
    revokeAllByUsuarioId: () => Promise.resolve(),
  };
}

function createEmptyUsuarioRepository(): UsuarioRepository {
  return {
    findByIdentifier: () => Promise.resolve(null),
    findById: () => Promise.resolve(null),
    updateLastAccess: () => Promise.resolve(),
    updatePasswordHash: () => Promise.resolve(),
    updateProfile: () => Promise.reject(new Error('Não usado neste teste.')),
  };
}

function createReflector(requiredProfiles: string[]) {
  return {
    getAllAndOverride: () => requiredProfiles,
  } as never;
}

function captureSyncError(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

class FakeResponse {
  private readonly cookies: Array<{
    name: string;
    options: CookieOptions;
    value: string;
  }> = [];

  cookie(name: string, value: string, options: CookieOptions): this {
    this.cookies.push({ name, value, options });

    return this;
  }

  clearCookie(name: string, options: CookieOptions): this {
    this.cookies.push({ name, value: '', options });

    return this;
  }

  hasCookie(name: string): boolean {
    return this.cookies.some((cookie) => cookie.name === name);
  }

  cookieHasHttpOnly(name: string): boolean {
    const cookie = this.cookies.find((item) => item.name === name);

    return cookie?.options.httpOnly === true;
  }

  asResponse(): Response {
    return this as unknown as Response;
  }
}
