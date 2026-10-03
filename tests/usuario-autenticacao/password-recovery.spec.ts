import { test } from '@japa/runner';
import type { EmailService } from '../../src/application/email/email.service.js';
import { AuthApplicationError } from '../../src/application/usuario-autenticacao/errors/auth-application.error.js';
import type { AuthConfig } from '../../src/application/usuario-autenticacao/ports/auth-config.js';
import type { AuthSessionRepository } from '../../src/application/usuario-autenticacao/ports/auth-session.repository.js';
import type { PasswordHasher } from '../../src/application/usuario-autenticacao/ports/password-hasher.js';
import type {
  PasswordRecoveryRecord,
  PasswordRecoveryRepository,
} from '../../src/application/usuario-autenticacao/ports/password-recovery.repository.js';
import type { SecretGenerator } from '../../src/application/usuario-autenticacao/ports/secret-generator.js';
import type { TokenHasher } from '../../src/application/usuario-autenticacao/ports/token-hasher.js';
import type { UsuarioRepository } from '../../src/application/usuario-autenticacao/ports/usuario.repository.js';
import {
  RequestPasswordRecoveryUseCase,
  ResetPasswordWithTokenUseCase,
  VerifyPasswordRecoveryCodeUseCase,
} from '../../src/application/usuario-autenticacao/use-cases/password-recovery.use-cases.js';
import { Usuario } from '../../src/domain/usuario-autenticacao/entities/usuario.entity.js';
import { DataNascimento } from '../../src/domain/usuario-autenticacao/value-objects/data-nascimento.value-object.js';
import { Email } from '../../src/domain/usuario-autenticacao/value-objects/email.value-object.js';
import { Login } from '../../src/domain/usuario-autenticacao/value-objects/login.value-object.js';
import { Nome } from '../../src/domain/usuario-autenticacao/value-objects/nome.value-object.js';
import { SenhaHash } from '../../src/domain/usuario-autenticacao/value-objects/senha-hash.value-object.js';
import { Telefone } from '../../src/domain/usuario-autenticacao/value-objects/telefone.value-object.js';

const config: AuthConfig = {
  jwtAccessSecret: 'access',
  tokenHashSecret: 'token',
  bcryptSaltRounds: 12,
  accessTokenTtlSeconds: 900,
  refreshTokenTtlDays: 7,
  cookieSecure: false,
  temporaryPasswordTtlHours: 24,
  passwordRecoveryCodeTtlMinutes: 10,
  passwordRecoveryResetTokenTtlMinutes: 10,
  passwordRecoveryMaxAttempts: 5,
  passwordRecoveryResendIntervalSeconds: 60,
  passwordRecoveryRateLimitWindowMinutes: 60,
  passwordRecoveryRateLimitMaxRequests: 5,
};

test.group('recuperação de senha exclusiva para administradores', () => {
  test('cria recuperação e envia e-mail para administrador ativo', async ({
    assert,
  }) => {
    const fixture = createFixture({ tipo: 'ADMINISTRADOR' });

    await fixture.request.execute({
      email: 'user@example.com',
      ip: '127.0.0.1',
    });

    assert.equal(fixture.recoveries.registeredRequests, 1);
    assert.equal(fixture.recoveries.createdRecoveries, 1);
    assert.equal(fixture.sentEmails, 1);
  });

  test('não cria recuperação nem envia e-mail para usuário não administrador', async ({
    assert,
  }) => {
    const fixture = createFixture();

    const error = await captureError(() =>
      fixture.request.execute({ email: 'user@example.com', ip: '127.0.0.1' }),
    );

    assertRestricted(error, assert);
    assert.equal(fixture.recoveries.registeredRequests, 0);
    assert.equal(fixture.recoveries.createdRecoveries, 0);
    assert.equal(fixture.sentEmails, 0);
  });

  test('não valida código de usuário não administrador', async ({ assert }) => {
    const fixture = createFixture();

    const error = await captureError(() =>
      fixture.verify.execute({ email: 'user@example.com', code: '123456' }),
    );

    assertRestricted(error, assert);
    assert.equal(fixture.recoveries.findLatestCalls, 0);
  });

  test('não redefine senha com token previamente emitido para não administrador', async ({
    assert,
  }) => {
    const fixture = createFixture({ recovery: validRecovery() });

    const error = await captureError(() =>
      fixture.reset.execute({
        resetToken: 'a'.repeat(32),
        newPassword: 'SenhaNova!123',
      }),
    );

    assertRestricted(error, assert);
    assert.equal(fixture.passwordUpdates, 0);
    assert.equal(fixture.recoveries.consumedRecoveries, 0);
    assert.equal(fixture.revokedSessions, 0);
  });
});

function createFixture(options?: {
  recovery?: PasswordRecoveryRecord;
  tipo?: 'USUARIO' | 'ADMINISTRADOR';
}) {
  const usuario = createUsuario(options?.tipo ?? 'USUARIO');
  const recoveries = new InMemoryPasswordRecoveryRepository(options?.recovery);
  let sentEmails = 0;
  let passwordUpdates = 0;
  let revokedSessions = 0;
  const usuarios: UsuarioRepository = {
    findByIdentifier: async (identifier) =>
      identifier.trim().toLowerCase() === usuario.email ? usuario : null,
    findById: async (id) => (id === usuario.id ? usuario : null),
    updateLastAccess: async () => {},
    updatePasswordHash: async () => {
      passwordUpdates += 1;
    },
    updateProfile: async () => usuario.toPublic(),
    findImagemObjectKey: async () => null,
    setImagemObjectKey: async () => {},
  };
  const tokens: TokenHasher = {
    hash: (value) => `hash:${value}`,
    matches: (value, hash) => hash === `hash:${value}`,
  };
  const email = {
    send: async () => {
      sentEmails += 1;
      return 'ENVIADO' as const;
    },
  } as unknown as EmailService;
  const passwords: PasswordHasher = {
    hash: async (value) => `password:${value}`,
    compare: async () => false,
  };
  const sessions: AuthSessionRepository = {
    create: async () => {
      throw new Error('Não usado neste teste.');
    },
    findById: async () => null,
    findByRefreshTokenHash: async () => null,
    rotate: async () => {
      throw new Error('Não usado neste teste.');
    },
    revoke: async () => {},
    revokeAllByUsuarioId: async () => {
      revokedSessions += 1;
    },
  };

  return {
    request: new RequestPasswordRecoveryUseCase(
      usuarios,
      recoveries,
      tokens,
      email,
      config,
    ),
    verify: new VerifyPasswordRecoveryCodeUseCase(
      usuarios,
      recoveries,
      tokens,
      { generate: () => 'reset-token' } as SecretGenerator,
      config,
    ),
    reset: new ResetPasswordWithTokenUseCase(
      recoveries,
      tokens,
      passwords,
      usuarios,
      sessions,
    ),
    recoveries,
    get sentEmails() {
      return sentEmails;
    },
    get passwordUpdates() {
      return passwordUpdates;
    },
    get revokedSessions() {
      return revokedSessions;
    },
  };
}

function createUsuario(tipo: 'USUARIO' | 'ADMINISTRADOR') {
  return Usuario.create({
    id: 'user-1',
    nome: Nome.create('Usuário Teste'),
    email: Email.create('user@example.com'),
    login: Login.create('usuario.teste'),
    senhaHash: SenhaHash.create('senha-hash'),
    telefone: Telefone.fromString('11999998888'),
    dataNascimento: DataNascimento.create(new Date('1990-05-20')),
    status: 'ATIVO',
    tipo,
    permissoesAdministrativas: [],
    trocaSenhaObrigatoria: false,
    dataCriacao: new Date('2026-01-01'),
    dataAtualizacao: new Date('2026-01-01'),
    ultimoAcesso: null,
  });
}

function validRecovery(): PasswordRecoveryRecord {
  return {
    id: 'recovery-1',
    usuarioId: 'user-1',
    codigoHash: 'hash:123456',
    expiraEm: new Date('2099-01-01'),
    tentativas: 0,
    bloqueadoEm: null,
    codigoValidadoEm: new Date('2026-01-01'),
    resetTokenHash: `hash:${'a'.repeat(32)}`,
    resetTokenExpiraEm: new Date('2099-01-01'),
    tokenUtilizadoEm: null,
  };
}

function assertRestricted(error: unknown, assert: { equal: (actual: unknown, expected: unknown) => void }) {
  assert.equal(error instanceof AuthApplicationError, true);
  assert.equal((error as AuthApplicationError).code, 'FORBIDDEN');
  assert.equal(
    (error as AuthApplicationError).message,
    'A recuperação de senha está disponível apenas para administradores.',
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

class InMemoryPasswordRecoveryRepository
  implements PasswordRecoveryRepository
{
  registeredRequests = 0;
  createdRecoveries = 0;
  findLatestCalls = 0;
  consumedRecoveries = 0;

  constructor(private readonly recovery?: PasswordRecoveryRecord) {}

  async invalidateActiveByUsuarioId(): Promise<void> {}
  async create(): Promise<void> {
    this.createdRecoveries += 1;
  }
  async findLatestByUsuarioId(): Promise<PasswordRecoveryRecord | null> {
    this.findLatestCalls += 1;
    return this.recovery ?? null;
  }
  async incrementAttempts(): Promise<void> {}
  async setValidated(): Promise<void> {}
  async findByResetTokenHash(): Promise<PasswordRecoveryRecord | null> {
    return this.recovery ?? null;
  }
  async consume(): Promise<void> {
    this.consumedRecoveries += 1;
  }
  async countRequests(): Promise<{ email: number; ip: number }> {
    return { email: 0, ip: 0 };
  }
  async findLastRequest(): Promise<Date | null> {
    return null;
  }
  async registerRequest(): Promise<void> {
    this.registeredRequests += 1;
  }
}
