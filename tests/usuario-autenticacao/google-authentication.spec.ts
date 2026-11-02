import { LoginTicket, type TokenPayload } from 'google-auth-library';
import { test } from '@japa/runner';
import { AuthApplicationError } from '../../src/application/usuario-autenticacao/errors/auth-application.error.js';
import type {
  ExternalIdentityRepository,
  LinkExternalIdentityInput,
} from '../../src/application/usuario-autenticacao/ports/external-identity.repository.js';
import {
  GoogleIdentityVerificationError,
  type GoogleIdentityVerifier,
} from '../../src/application/usuario-autenticacao/ports/google-identity-verifier.js';
import type { UsuarioRepository } from '../../src/application/usuario-autenticacao/ports/usuario.repository.js';
import type { IssueAuthSessionService } from '../../src/application/usuario-autenticacao/services/issue-auth-session.service.js';
import { AuthenticateWithGoogleUseCase } from '../../src/application/usuario-autenticacao/use-cases/authenticate-with-google.use-case.js';
import { Usuario } from '../../src/domain/usuario-autenticacao/entities/usuario.entity.js';
import { DataNascimento } from '../../src/domain/usuario-autenticacao/value-objects/data-nascimento.value-object.js';
import { Email } from '../../src/domain/usuario-autenticacao/value-objects/email.value-object.js';
import { Login } from '../../src/domain/usuario-autenticacao/value-objects/login.value-object.js';
import { Nome } from '../../src/domain/usuario-autenticacao/value-objects/nome.value-object.js';
import { SenhaHash } from '../../src/domain/usuario-autenticacao/value-objects/senha-hash.value-object.js';
import { Telefone } from '../../src/domain/usuario-autenticacao/value-objects/telefone.value-object.js';
import { createGoogleAuthConfigFromEnv } from '../../src/infrastructure/usuario-autenticacao/google-auth-config.factory.js';
import {
  GoogleIdTokenVerifier,
  type GoogleTokenClient,
} from '../../src/infrastructure/usuario-autenticacao/google-id-token.verifier.js';

const webClientId = '123456.apps.googleusercontent.com';

test.group('autenticação Google application', () => {
  test('autentica paciente por vínculo existente e emite sessão própria', async ({
    assert,
  }) => {
    const fixture = createGoogleFixture({ linkedUsuarioId: 'patient-1' });

    const output = await fixture.useCase.execute('valid-id-token');

    assert.equal(output.accessToken, 'oncoopera-access-token');
    assert.equal(fixture.identities.links.length, 0);
    assert.equal(fixture.issuedFor, 'patient-1');
  });

  test('primeiro acesso vincula paciente pelo email verificado', async ({
    assert,
  }) => {
    const fixture = createGoogleFixture();

    await fixture.useCase.execute('valid-id-token');

    assert.deepEqual(fixture.identities.links, [
      {
        provider: 'GOOGLE',
        subject: 'google-subject-1',
        usuarioId: 'patient-1',
      },
    ]);
    assert.equal(fixture.issuedFor, 'patient-1');
  });

  test('rejeita conta Google sem paciente cadastrado', async ({ assert }) => {
    const fixture = createGoogleFixture({ usuarios: [] });
    const error = await captureError(() =>
      fixture.useCase.execute('valid-id-token'),
    );

    assert.equal(
      (error as AuthApplicationError).code,
      'GOOGLE_ACCOUNT_NOT_REGISTERED',
    );
    assert.equal(fixture.identities.links.length, 0);
  });

  test('preserva conflito quando o paciente já possui outro vínculo Google', async ({
    assert,
  }) => {
    const fixture = createGoogleFixture({ linkConflict: true });
    const error = await captureError(() =>
      fixture.useCase.execute('valid-id-token'),
    );

    assert.equal(
      (error as AuthApplicationError).code,
      'GOOGLE_IDENTITY_CONFLICT',
    );
  });

  test('rejeita paciente inativo, bloqueado e conta administrativa', async ({
    assert,
  }) => {
    for (const usuario of [
      createUsuario({ status: 'INATIVO' }),
      createUsuario({ status: 'BLOQUEADO' }),
      createUsuario({ tipo: 'ADMINISTRADOR' }),
    ]) {
      const fixture = createGoogleFixture({ usuarios: [usuario] });
      const error = await captureError(() =>
        fixture.useCase.execute('valid-id-token'),
      );
      assert.equal(
        (error as AuthApplicationError).code,
        'GOOGLE_ACCOUNT_FORBIDDEN',
      );
    }
  });

  test('traduz token inválido e indisponibilidade sem expor detalhes', async ({
    assert,
  }) => {
    for (const [failure, expected] of [
      ['INVALID', 'INVALID_GOOGLE_TOKEN'],
      ['UNAVAILABLE', 'GOOGLE_SERVICE_UNAVAILABLE'],
    ] as const) {
      const fixture = createGoogleFixture({ verificationFailure: failure });
      const error = await captureError(() =>
        fixture.useCase.execute('sensitive-id-token'),
      );
      assert.equal((error as AuthApplicationError).code, expected);
      assert.notInclude((error as Error).message, 'sensitive-id-token');
    }
  });
});

test.group('Google ID Token verifier', () => {
  test('aceita claims íntegros e normaliza o email', async ({ assert }) => {
    const verifier = createVerifier(
      validPayload({ email: 'USER@Example.com' }),
    );

    assert.deepEqual(await verifier.verify('valid-token'), {
      subject: 'google-subject-1',
      email: 'user@example.com',
    });
  });

  test('rejeita expiração, audiência, emissor e email não verificado', async ({
    assert,
  }) => {
    const invalidPayloads = [
      validPayload({ exp: Math.floor(Date.now() / 1000) - 1 }),
      validPayload({ aud: 'unauthorized.apps.googleusercontent.com' }),
      validPayload({ iss: 'https://issuer.example.com' }),
      validPayload({ email_verified: false }),
      validPayload({ sub: '' }),
    ];

    for (const payload of invalidPayloads) {
      const error = await captureError(() =>
        createVerifier(payload).verify('invalid-token'),
      );
      assert.equal(
        (error as GoogleIdentityVerificationError).failure,
        'INVALID',
      );
    }
  });

  test('classifica assinatura inválida como token inválido', async ({
    assert,
  }) => {
    const verifier = new GoogleIdTokenVerifier(
      { webClientId },
      {
        verifyIdToken: () => Promise.reject(new Error('invalid signature')),
      },
    );
    const error = await captureError(() => verifier.verify('invalid-token'));

    assert.equal((error as GoogleIdentityVerificationError).failure, 'INVALID');
  });

  test('classifica falha de rede como indisponibilidade', async ({
    assert,
  }) => {
    const verifier = new GoogleIdTokenVerifier(
      { webClientId },
      {
        verifyIdToken: () =>
          Promise.reject(
            Object.assign(new Error('network'), { code: 'ETIMEDOUT' }),
          ),
      },
    );
    const error = await captureError(() => verifier.verify('valid-token'));

    assert.equal(
      (error as GoogleIdentityVerificationError).failure,
      'UNAVAILABLE',
    );
  });
});

test.group('configuração Google', () => {
  test('exige Web Client ID válido', async ({ assert }) => {
    assert.equal(
      createGoogleAuthConfigFromEnv({ GOOGLE_WEB_CLIENT_ID: webClientId })
        .webClientId,
      webClientId,
    );

    for (const value of [undefined, '', 'client-id-invalido']) {
      const error = await captureError(() =>
        Promise.resolve(
          createGoogleAuthConfigFromEnv({ GOOGLE_WEB_CLIENT_ID: value }),
        ),
      );
      assert.equal(error instanceof Error, true);
    }
  });
});

function createGoogleFixture(options?: {
  linkedUsuarioId?: string;
  linkConflict?: boolean;
  usuarios?: Usuario[];
  verificationFailure?: 'INVALID' | 'UNAVAILABLE';
}) {
  const usuarios = new InMemoryUsuarioRepository(
    options?.usuarios ?? [createUsuario()],
  );
  const identities = new InMemoryExternalIdentityRepository(
    options?.linkedUsuarioId,
    options?.linkConflict,
  );
  let issuedFor: string | null = null;
  const verifier: GoogleIdentityVerifier = {
    verify: () => {
      if (options?.verificationFailure !== undefined) {
        return Promise.reject(
          new GoogleIdentityVerificationError(options.verificationFailure),
        );
      }
      return Promise.resolve({
        subject: 'google-subject-1',
        email: 'user@example.com',
      });
    },
  };
  const issueSession = {
    issue: (usuario: Usuario) => {
      issuedFor = usuario.id;
      return Promise.resolve({
        accessToken: 'oncoopera-access-token',
        refreshToken: 'refresh-token',
        csrfToken: 'csrf-token',
        refreshExpiresAt: new Date('2026-11-09T00:00:00.000Z'),
        usuario: usuario.toPublic(),
      });
    },
  } as IssueAuthSessionService;

  return {
    identities,
    get issuedFor() {
      return issuedFor;
    },
    useCase: new AuthenticateWithGoogleUseCase(
      verifier,
      identities,
      usuarios,
      issueSession,
    ),
  };
}

function createUsuario(options?: {
  status?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  tipo?: 'PACIENTE' | 'ADMINISTRADOR';
}) {
  return Usuario.create({
    id: 'patient-1',
    nome: Nome.create('Paciente Teste'),
    email: Email.create('user@example.com'),
    login: Login.create('paciente.teste'),
    senhaHash: SenhaHash.create('hash-password'),
    telefone: Telefone.fromString('11999998888'),
    dataNascimento: DataNascimento.create(new Date('1990-05-20T00:00:00.000Z')),
    status: options?.status ?? 'ATIVO',
    tipo: options?.tipo ?? 'PACIENTE',
    permissoesAdministrativas:
      options?.tipo === 'ADMINISTRADOR' ? ['TOTAL'] : [],
    trocaSenhaObrigatoria: false,
    dataCriacao: new Date('2026-01-01T00:00:00.000Z'),
    dataAtualizacao: new Date('2026-01-01T00:00:00.000Z'),
    ultimoAcesso: null,
  });
}

function createVerifier(payload: TokenPayload): GoogleIdTokenVerifier {
  const client: GoogleTokenClient = {
    verifyIdToken: () => Promise.resolve(new LoginTicket('envelope', payload)),
  };
  return new GoogleIdTokenVerifier({ webClientId }, client);
}

function validPayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    iss: 'https://accounts.google.com',
    sub: 'google-subject-1',
    aud: webClientId,
    iat: Math.floor(Date.now() / 1000) - 10,
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: 'user@example.com',
    email_verified: true,
    ...overrides,
  };
}

class InMemoryExternalIdentityRepository implements ExternalIdentityRepository {
  readonly links: LinkExternalIdentityInput[] = [];
  private readonly linkedUsuarioId?: string;

  constructor(
    linkedUsuarioId?: string,
    private readonly linkConflict = false,
  ) {
    this.linkedUsuarioId = linkedUsuarioId;
  }

  findUsuarioId(): Promise<string | null> {
    return Promise.resolve(this.linkedUsuarioId ?? null);
  }

  link(input: LinkExternalIdentityInput): Promise<void> {
    if (this.linkConflict) {
      return Promise.reject(
        new AuthApplicationError(
          'GOOGLE_IDENTITY_CONFLICT',
          'Esta conta já possui outro vínculo Google.',
        ),
      );
    }
    this.links.push(input);
    return Promise.resolve();
  }
}

class InMemoryUsuarioRepository implements UsuarioRepository {
  constructor(private readonly usuarios: Usuario[]) {}

  findByIdentifier(identifier: string): Promise<Usuario | null> {
    const normalized = identifier.trim().toLowerCase();
    return Promise.resolve(
      this.usuarios.find((usuario) => usuario.email === normalized) ?? null,
    );
  }

  findById(id: string): Promise<Usuario | null> {
    return Promise.resolve(
      this.usuarios.find((usuario) => usuario.id === id) ?? null,
    );
  }

  updateLastAccess(): Promise<void> {
    return Promise.resolve();
  }

  updatePasswordHash(): Promise<void> {
    return Promise.resolve();
  }

  updateProfile(): Promise<never> {
    return Promise.reject(new Error('Não usado neste teste.'));
  }

  findImagemObjectKey(): Promise<string | null> {
    return Promise.resolve(null);
  }

  setImagemObjectKey(): Promise<void> {
    return Promise.resolve();
  }
}

async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}
