import { test } from '@japa/runner';
import { AuthSession } from '../../src/domain/usuario-autenticacao/entities/auth-session.entity.js';
import { Usuario } from '../../src/domain/usuario-autenticacao/entities/usuario.entity.js';
import type {
  PermissaoAdministrativaNome,
  StatusUsuario,
} from '../../src/domain/usuario-autenticacao/entities/usuario.entity.js';
import { DataNascimento } from '../../src/domain/usuario-autenticacao/value-objects/data-nascimento.value-object.js';
import { Email } from '../../src/domain/usuario-autenticacao/value-objects/email.value-object.js';
import { Login } from '../../src/domain/usuario-autenticacao/value-objects/login.value-object.js';
import { Nome } from '../../src/domain/usuario-autenticacao/value-objects/nome.value-object.js';
import { SenhaHash } from '../../src/domain/usuario-autenticacao/value-objects/senha-hash.value-object.js';
import { Telefone } from '../../src/domain/usuario-autenticacao/value-objects/telefone.value-object.js';
import { AuthApplicationError } from '../../src/application/usuario-autenticacao/errors/auth-application.error.js';
import type { AccessTokenService } from '../../src/application/usuario-autenticacao/ports/access-token.service.js';
import type { AuthConfig } from '../../src/application/usuario-autenticacao/ports/auth-config.js';
import type {
  AuthSessionRepository,
  CreateAuthSessionInput,
  RotateAuthSessionInput,
} from '../../src/application/usuario-autenticacao/ports/auth-session.repository.js';
import type { PasswordHasher } from '../../src/application/usuario-autenticacao/ports/password-hasher.js';
import type { SecretGenerator } from '../../src/application/usuario-autenticacao/ports/secret-generator.js';
import type { TokenHasher } from '../../src/application/usuario-autenticacao/ports/token-hasher.js';
import type { UsuarioRepository } from '../../src/application/usuario-autenticacao/ports/usuario.repository.js';
import { AuthenticateUserUseCase } from '../../src/application/usuario-autenticacao/use-cases/authenticate-user.use-case.js';
import { ChangePasswordUseCase } from '../../src/application/usuario-autenticacao/use-cases/change-password.use-case.js';
import { ChangeTemporaryPasswordUseCase } from '../../src/application/usuario-autenticacao/use-cases/change-temporary-password.use-case.js';
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

test.group('usuario-autenticacao application', () => {
  test('login válido cria sessão, atualiza último acesso e omite senhaHash', async ({
    assert,
  }) => {
    const fixture = createFixture();
    const authenticate = fixture.authenticateUseCase();

    const output = await authenticate.execute({
      identificador: 'user@example.com',
      senha: 'SenhaAtual!123',
    });

    assert.equal(output.accessToken, 'access:user-1:session-1');
    assert.equal(output.refreshToken, 'refresh-1');
    assert.equal(output.csrfToken, 'csrf-1');
    assert.equal(fixture.sessions.items.length, 1);
    assert.equal(fixture.usuarios.lastAccessUpdates.length, 1);
    assert.equal('senhaHash' in output.usuario, false);
  });

  test('login inválido e usuário não ativo retornam falha genérica', async ({
    assert,
  }) => {
    const wrongPasswordFixture = createFixture();
    const wrongPasswordError = await captureError(() =>
      wrongPasswordFixture.authenticateUseCase().execute({
        identificador: 'user@example.com',
        senha: 'errada',
      }),
    );

    assert.equal(wrongPasswordError instanceof AuthApplicationError, true);
    assert.equal(
      (wrongPasswordError as AuthApplicationError).code,
      'INVALID_CREDENTIALS',
    );

    const inactiveFixture = createFixture({ status: 'INATIVO' });
    const inactiveError = await captureError(() =>
      inactiveFixture.authenticateUseCase().execute({
        identificador: 'user@example.com',
        senha: 'SenhaAtual!123',
      }),
    );

    assert.equal(inactiveError instanceof AuthApplicationError, true);
    assert.equal(
      (inactiveError as AuthApplicationError).code,
      'INVALID_CREDENTIALS',
    );
  });

  test('refresh rotaciona tokens e invalida refresh anterior', async ({
    assert,
  }) => {
    const fixture = createFixture();
    const authenticateOutput = await fixture.authenticateUseCase().execute({
      identificador: 'user@example.com',
      senha: 'SenhaAtual!123',
    });

    const refreshOutput = await fixture.refreshUseCase().execute({
      refreshToken: authenticateOutput.refreshToken,
      csrfToken: authenticateOutput.csrfToken,
    });

    assert.equal(refreshOutput.accessToken, 'access:user-1:session-1');
    assert.equal(refreshOutput.refreshToken, 'refresh-2');
    assert.equal(refreshOutput.csrfToken, 'csrf-2');
    assert.equal(fixture.sessions.items[0].refreshTokenHash, 'hash:refresh-2');
    assert.equal(fixture.sessions.items[0].csrfTokenHash, 'hash:csrf-2');

    const reuseError = await captureError(() =>
      fixture.refreshUseCase().execute({
        refreshToken: authenticateOutput.refreshToken,
        csrfToken: authenticateOutput.csrfToken,
      }),
    );

    assert.equal(reuseError instanceof AuthApplicationError, true);
    assert.equal(
      (reuseError as AuthApplicationError).code,
      'INVALID_REFRESH_TOKEN',
    );
  });

  test('logout é idempotente e rejeita CSRF incorreto para sessão válida', async ({
    assert,
  }) => {
    const fixture = createFixture();
    const authenticateOutput = await fixture.authenticateUseCase().execute({
      identificador: 'user@example.com',
      senha: 'SenhaAtual!123',
    });
    const logout = fixture.logoutUseCase();

    await logout.execute({ refreshToken: undefined, csrfToken: undefined });

    const csrfError = await captureError(() =>
      logout.execute({
        refreshToken: authenticateOutput.refreshToken,
        csrfToken: 'csrf-invalido',
      }),
    );

    assert.equal(csrfError instanceof AuthApplicationError, true);
    assert.equal(
      (csrfError as AuthApplicationError).code,
      'INVALID_CSRF_TOKEN',
    );

    await logout.execute({
      refreshToken: authenticateOutput.refreshToken,
      csrfToken: authenticateOutput.csrfToken,
    });

    assert.equal(fixture.sessions.items[0].revokedAt instanceof Date, true);
  });

  test('alteração de senha valida senha atual, política nova e revoga sessões', async ({
    assert,
  }) => {
    const fixture = createFixture();
    await fixture.authenticateUseCase().execute({
      identificador: 'user@example.com',
      senha: 'SenhaAtual!123',
    });

    await fixture.changePasswordUseCase().execute({
      usuarioId: 'user-1',
      senhaAtual: 'SenhaAtual!123',
      novaSenha: 'SenhaNova!1234',
    });

    assert.equal(
      fixture.usuarios.passwordUpdates[0],
      'hash-password:SenhaNova!1234',
    );
    assert.equal(fixture.sessions.items[0].revokedAt instanceof Date, true);

    const invalidCurrentPasswordError = await captureError(() =>
      fixture.changePasswordUseCase().execute({
        usuarioId: 'user-1',
        senhaAtual: 'errada',
        novaSenha: 'SenhaOutra!123',
      }),
    );

    assert.equal(
      invalidCurrentPasswordError instanceof AuthApplicationError,
      true,
    );
    assert.equal(
      (invalidCurrentPasswordError as AuthApplicationError).code,
      'INVALID_CREDENTIALS',
    );

    const invalidPolicyFixture = createFixture();
    const invalidPolicyError = await captureError(() =>
      invalidPolicyFixture.changePasswordUseCase().execute({
        usuarioId: 'user-1',
        senhaAtual: 'SenhaAtual!123',
        novaSenha: 'fraca',
      }),
    );

    assert.equal(invalidPolicyError instanceof AuthApplicationError, true);
    assert.equal(
      (invalidPolicyError as AuthApplicationError).code,
      'INVALID_PASSWORD_POLICY',
    );
  });

  test('atualização de dados pessoais preserva permissões administrativas e rejeita usuário inativo', async ({
    assert,
  }) => {
    const fixture = createFixture({
      tipo: 'ADMINISTRADOR',
      permissoesAdministrativas: ['GESTAO_CONTEUDOS'],
    });

    const updated = await fixture.updateOwnProfileUseCase().execute('user-1', {
      nome: 'Novo Nome',
      email: 'novo.email@example.com',
      telefone: '11988887777',
    });

    assert.equal(updated.nome, 'Novo Nome');
    assert.equal(updated.email, 'novo.email@example.com');
    assert.equal(updated.telefone, '11988887777');
    assert.deepEqual(updated.permissoesAdministrativas, [
      'GESTAO_CONTEUDOS',
    ]);
    assert.equal(updated.login, 'usuario.teste');

    const inactiveFixture = createFixture({ status: 'INATIVO' });
    const inactiveError = await captureError(() =>
      inactiveFixture.updateOwnProfileUseCase().execute('user-1', {
        nome: 'Outro Nome',
      }),
    );

    assert.equal(inactiveError instanceof AuthApplicationError, true);
    assert.equal(
      (inactiveError as AuthApplicationError).code,
      'UNAUTHORIZED',
    );
  });

  test('login normal bloqueia troca obrigatória e troca senha temporária', async ({
    assert,
  }) => {
    const fixture = createFixture({ trocaSenhaObrigatoria: true });
    const loginError = await captureError(() =>
      fixture.authenticateUseCase().execute({
        identificador: 'user@example.com',
        senha: 'SenhaAtual!123',
      }),
    );

    assert.equal(loginError instanceof AuthApplicationError, true);
    assert.equal(
      (loginError as AuthApplicationError).code,
      'PASSWORD_CHANGE_REQUIRED',
    );
    assert.equal(fixture.sessions.items.length, 0);

    await fixture.changeTemporaryPasswordUseCase().execute({
      identificador: 'user@example.com',
      senhaTemporaria: 'SenhaAtual!123',
      novaSenha: 'SenhaNova!1234',
    });

    assert.equal(
      fixture.usuarios.passwordUpdates[0],
      'hash-password:SenhaNova!1234',
    );
    assert.equal(
      fixture.usuarios.findPublicById('user-1')?.trocaSenhaObrigatoria,
      false,
    );
  });
});

function createFixture(options?: {
  status?: StatusUsuario;
  trocaSenhaObrigatoria?: boolean;
  tipo?: 'USUARIO' | 'PACIENTE' | 'ADMINISTRADOR';
  permissoesAdministrativas?: string[];
}) {
  const usuarios = new InMemoryUsuarioRepository([
    createUsuario(options?.status ?? 'ATIVO', {
      trocaSenhaObrigatoria: options?.trocaSenhaObrigatoria ?? false,
      tipo: options?.tipo,
      permissoesAdministrativas: options?.permissoesAdministrativas,
    }),
  ]);
  const sessions = new InMemoryAuthSessionRepository();
  const passwordHasher = new FakePasswordHasher();
  const accessTokens = new FakeAccessTokenService();
  const tokenHasher = new FakeTokenHasher();
  const secretGenerator = new QueueSecretGenerator([
    'refresh-1',
    'csrf-1',
    'refresh-2',
    'csrf-2',
  ]);

  return {
    usuarios,
    sessions,
    authenticateUseCase: () =>
      new AuthenticateUserUseCase(
        usuarios,
        sessions,
        passwordHasher,
        accessTokens,
        tokenHasher,
        secretGenerator,
        authConfig,
      ),
    refreshUseCase: () =>
      new RefreshSessionUseCase(
        usuarios,
        sessions,
        accessTokens,
        tokenHasher,
        secretGenerator,
        authConfig,
      ),
    logoutUseCase: () => new LogoutSessionUseCase(sessions, tokenHasher),
    changePasswordUseCase: () =>
      new ChangePasswordUseCase(usuarios, sessions, passwordHasher),
    changeTemporaryPasswordUseCase: () =>
      new ChangeTemporaryPasswordUseCase(usuarios, sessions, passwordHasher),
    updateOwnProfileUseCase: () => new UpdateOwnProfileUseCase(usuarios),
  };
}

function createUsuario(
  status: StatusUsuario,
  options?: {
    trocaSenhaObrigatoria?: boolean;
    tipo?: 'USUARIO' | 'PACIENTE' | 'ADMINISTRADOR';
    permissoesAdministrativas?: string[];
  },
): Usuario {
  return Usuario.create({
    id: 'user-1',
    nome: Nome.create('Usuário Teste'),
    email: Email.create('user@example.com'),
    login: Login.create('usuario.teste'),
    senhaHash: SenhaHash.create('hash-password:SenhaAtual!123'),
    telefone: Telefone.fromString('11999998888'),
    dataNascimento: DataNascimento.create(new Date('1990-05-20T00:00:00.000Z')),
    status,
    tipo: options?.tipo ?? 'USUARIO',
    permissoesAdministrativas:
      (options?.permissoesAdministrativas as PermissaoAdministrativaNome[]) ??
      [],
    trocaSenhaObrigatoria: options?.trocaSenhaObrigatoria ?? false,
    dataCriacao: new Date('2026-01-01T00:00:00.000Z'),
    dataAtualizacao: new Date('2026-01-01T00:00:00.000Z'),
    ultimoAcesso: null,
  });
}

async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}

class InMemoryUsuarioRepository implements UsuarioRepository {
  readonly lastAccessUpdates: Date[] = [];
  readonly passwordUpdates: string[] = [];
  private readonly usuarios: Map<string, Usuario>;

  constructor(usuarios: Usuario[]) {
    this.usuarios = new Map(usuarios.map((usuario) => [usuario.id, usuario]));
  }

  async findByIdentifier(identifier: string): Promise<Usuario | null> {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    for (const usuario of this.usuarios.values()) {
      const publicUsuario = usuario.toPublic();
      const matchesEmail = publicUsuario.email === normalizedIdentifier;
      const matchesLogin = publicUsuario.login === identifier.trim();

      if (matchesEmail || matchesLogin) {
        return usuario;
      }
    }

    return null;
  }

  async findById(id: string): Promise<Usuario | null> {
    return this.usuarios.get(id) ?? null;
  }

  async updateLastAccess(id: string, ultimoAcesso: Date): Promise<void> {
    const usuario = this.usuarios.get(id);

    if (usuario !== undefined) {
      this.usuarios.set(id, usuario.registrarUltimoAcesso(ultimoAcesso));
      this.lastAccessUpdates.push(ultimoAcesso);
    }
  }

  findPublicById(id: string) {
    return this.usuarios.get(id)?.toPublic() ?? null;
  }

  async updatePasswordHash(
    id: string,
    senhaHash: string,
    options?: { trocaSenhaObrigatoria?: boolean },
  ): Promise<void> {
    const usuario = this.usuarios.get(id);

    if (usuario !== undefined) {
      this.usuarios.set(
        id,
        usuario.alterarSenha(
          SenhaHash.create(senhaHash),
          new Date(),
          options?.trocaSenhaObrigatoria ?? usuario.trocaSenhaObrigatoria,
        ),
      );
      this.passwordUpdates.push(senhaHash);
    }
  }

  async updateProfile(
    id: string,
    data: {
      nome?: string;
      email?: string;
      telefone?: string;
      dataNascimento?: Date;
    },
  ) {
    const usuario = this.usuarios.get(id);

    if (usuario === undefined) {
      throw new Error('Usuário não encontrado.');
    }

    const updated = usuario.atualizarDadosPessoais({
      nome: data.nome !== undefined ? Nome.create(data.nome) : undefined,
      email: data.email !== undefined ? Email.create(data.email) : undefined,
      telefone:
        data.telefone !== undefined
          ? Telefone.fromString(data.telefone)
          : undefined,
      dataNascimento:
        data.dataNascimento !== undefined
          ? DataNascimento.create(data.dataNascimento)
          : undefined,
    });

    this.usuarios.set(id, updated);

    return updated.toPublic();
  }
}

class InMemoryAuthSessionRepository implements AuthSessionRepository {
  readonly items: AuthSession[] = [];
  private nextId = 1;

  async create(input: CreateAuthSessionInput): Promise<AuthSession> {
    const session = new AuthSession({
      id: `session-${this.nextId}`,
      usuarioId: input.usuarioId,
      refreshTokenHash: input.refreshTokenHash,
      csrfTokenHash: input.csrfTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      lastUsedAt: null,
    });

    this.nextId += 1;
    this.items.push(session);

    return session;
  }

  async findById(id: string): Promise<AuthSession | null> {
    return this.items.find((session) => session.id === id) ?? null;
  }

  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<AuthSession | null> {
    return (
      this.items.find(
        (session) => session.refreshTokenHash === refreshTokenHash,
      ) ?? null
    );
  }

  async rotate(input: RotateAuthSessionInput): Promise<AuthSession> {
    const index = this.items.findIndex((session) => session.id === input.id);
    const current = this.items[index];
    const rotated = new AuthSession({
      id: input.id,
      usuarioId: current.usuarioId,
      refreshTokenHash: input.refreshTokenHash,
      csrfTokenHash: input.csrfTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: current.revokedAt,
      lastUsedAt: input.lastUsedAt,
    });

    this.items[index] = rotated;

    return rotated;
  }

  async revoke(id: string, revokedAt: Date): Promise<void> {
    this.items.splice(
      0,
      this.items.length,
      ...this.items.map((session) =>
        session.id === id
          ? new AuthSession({
              id: session.id,
              usuarioId: session.usuarioId,
              refreshTokenHash: session.refreshTokenHash,
              csrfTokenHash: session.csrfTokenHash,
              expiresAt: session.expiresAt,
              revokedAt,
              lastUsedAt: session.lastUsedAt,
            })
          : session,
      ),
    );
  }

  async revokeAllByUsuarioId(
    usuarioId: string,
    revokedAt: Date,
  ): Promise<void> {
    this.items.splice(
      0,
      this.items.length,
      ...this.items.map((session) =>
        session.usuarioId === usuarioId
          ? new AuthSession({
              id: session.id,
              usuarioId: session.usuarioId,
              refreshTokenHash: session.refreshTokenHash,
              csrfTokenHash: session.csrfTokenHash,
              expiresAt: session.expiresAt,
              revokedAt,
              lastUsedAt: session.lastUsedAt,
            })
          : session,
      ),
    );
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hash-password:${password}`;
  }

  async compare(password: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hash-password:${password}`;
  }
}

class FakeAccessTokenService implements AccessTokenService {
  async sign(payload: { sub: string; sid: string }): Promise<string> {
    return `access:${payload.sub}:${payload.sid}`;
  }

  async verify(token: string): Promise<{ sub: string; sid: string } | null> {
    const [, sub, sid] = token.split(':');

    if (
      !token.startsWith('access:') ||
      sub === undefined ||
      sid === undefined
    ) {
      return null;
    }

    return { sub, sid };
  }
}

class FakeTokenHasher implements TokenHasher {
  hash(token: string): string {
    return `hash:${token}`;
  }

  matches(token: string, tokenHash: string): boolean {
    return this.hash(token) === tokenHash;
  }
}

class QueueSecretGenerator implements SecretGenerator {
  private readonly values: string[];

  constructor(values: string[]) {
    this.values = [...values];
  }

  generate(): string {
    const value = this.values.shift();

    if (value === undefined) {
      throw new Error('Sem segredo fake disponível.');
    }

    return value;
  }
}
