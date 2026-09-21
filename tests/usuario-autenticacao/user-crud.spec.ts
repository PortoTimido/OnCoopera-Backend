import { test } from '@japa/runner';
import { AuthApplicationError } from '../../src/application/usuario-autenticacao/errors/auth-application.error.js';
import type {
  AuthSessionRepository,
  CreateAuthSessionInput,
  RotateAuthSessionInput,
} from '../../src/application/usuario-autenticacao/ports/auth-session.repository.js';
import type { PasswordHasher } from '../../src/application/usuario-autenticacao/ports/password-hasher.js';
import type { TemporaryPasswordGenerator } from '../../src/application/usuario-autenticacao/ports/temporary-password-generator.js';
import type {
  CreateAdministradorRepositoryInput,
  CreatePacienteRepositoryInput,
  ListUsuariosInput,
  PaginatedUsuarios,
  UpdateAdministradorRepositoryInput,
  UpdatePacienteRepositoryInput,
  UsuarioDetails,
  UsuarioManagementRepository,
} from '../../src/application/usuario-autenticacao/ports/usuario-management.repository.js';
import { CreateAdministradorUseCase } from '../../src/application/usuario-autenticacao/use-cases/create-administrador.use-case.js';
import { CreatePacienteUseCase } from '../../src/application/usuario-autenticacao/use-cases/create-paciente.use-case.js';
import { InactivateAdministradorUseCase } from '../../src/application/usuario-autenticacao/use-cases/inactivate-administrador.use-case.js';
import { InactivatePacienteUseCase } from '../../src/application/usuario-autenticacao/use-cases/inactivate-paciente.use-case.js';
import { UpdateAdministradorUseCase } from '../../src/application/usuario-autenticacao/use-cases/update-administrador.use-case.js';
import { normalizePermissoesAdministrativas } from '../../src/application/usuario-autenticacao/use-cases/usuario-data.mapper.js';
import { DomainValidationError } from '../../src/domain/usuario-autenticacao/errors/domain-validation.error.js';
import type {
  PermissaoAdministrativaNome,
  PublicUsuario,
} from '../../src/domain/usuario-autenticacao/entities/usuario.entity.js';
import { AuthSession } from '../../src/domain/usuario-autenticacao/entities/auth-session.entity.js';

test.group('usuario-autenticacao user CRUD application', () => {
  test('cria administrador com senha temporária, bcrypt hash e permissão TOTAL', async ({
    assert,
  }) => {
    const usuarios = new InMemoryUsuarioManagementRepository();
    const createAdministrador = new CreateAdministradorUseCase(
      usuarios,
      new FakePasswordHasher(),
      new FixedTemporaryPasswordGenerator('SenhaTemp!123'),
    );

    const output = await createAdministrador.execute({
      nome: 'Admin Total',
      email: 'Admin.Total@example.com',
      login: 'admin.total',
      telefone: '(11) 99999-8888',
      dataNascimento: new Date('1985-01-10T00:00:00.000Z'),
      permissoesAdministrativas: ['TOTAL'],
    });

    assert.equal(output.senhaTemporaria, 'SenhaTemp!123');
    assert.equal(
      usuarios.createdAdmins[0]?.senhaHash,
      'hash-password:SenhaTemp!123',
    );
    assert.equal(usuarios.createdAdmins[0]?.trocaSenhaObrigatoria, true);
    assert.deepEqual(output.usuario.permissoesAdministrativas, ['TOTAL']);
    assert.equal(JSON.stringify(output).includes('senhaHash'), false);
  });

  test('cria administrador com permissões parciais', async ({ assert }) => {
    const usuarios = new InMemoryUsuarioManagementRepository();
    const createAdministrador = new CreateAdministradorUseCase(
      usuarios,
      new FakePasswordHasher(),
      new FixedTemporaryPasswordGenerator('SenhaTemp!123'),
    );

    const output = await createAdministrador.execute({
      nome: 'Admin Parcial',
      email: 'admin.parcial@example.com',
      login: 'admin.parcial',
      telefone: '(11) 99999-8888',
      dataNascimento: new Date('1985-01-10T00:00:00.000Z'),
      permissoesAdministrativas: ['GERENCIAR_USUARIOS', 'GESTAO_CONTEUDOS'],
    });

    assert.sameMembers(output.usuario.permissoesAdministrativas, [
      'GERENCIAR_USUARIOS',
      'GESTAO_CONTEUDOS',
    ]);
  });

  test('rejeita TOTAL combinado com outra permissão', ({ assert }) => {
    assert.throws(
      () => normalizePermissoesAdministrativas(['TOTAL', 'GERENCIAR_USUARIOS']),
      DomainValidationError,
      'A permissão TOTAL é exclusiva: não pode ser combinada com outras permissões.',
    );
  });

  test('rejeita permissão administrativa inválida', ({ assert }) => {
    assert.throws(
      () => normalizePermissoesAdministrativas(['PERMISSAO_INEXISTENTE']),
      DomainValidationError,
      'Permissão administrativa desconhecida: PERMISSAO_INEXISTENTE.',
    );
  });

  test('cria paciente mobile com endereço e sem permissões', async ({
    assert,
  }) => {
    const usuarios = new InMemoryUsuarioManagementRepository();
    const createPaciente = new CreatePacienteUseCase(
      usuarios,
      new FakePasswordHasher(),
    );

    const output = await createPaciente.execute({
      nome: 'Paciente Teste',
      email: 'paciente@example.com',
      login: 'paciente.teste',
      telefone: '11999998888',
      dataNascimento: new Date('1990-05-20T00:00:00.000Z'),
      senha: 'SenhaPaciente!123',
      endereco: createEnderecoInput(),
    });

    assert.equal(
      usuarios.createdPatients[0]?.senhaHash,
      'hash-password:SenhaPaciente!123',
    );
    assert.equal(output.usuario.tipo, 'PACIENTE');
    assert.deepEqual(output.usuario.permissoesAdministrativas, []);
    assert.equal(output.endereco?.cep, '01310930');
  });

  test('inativa usuário e revoga sessões', async ({ assert }) => {
    const usuarios = new InMemoryUsuarioManagementRepository([
      createUsuarioDetails({
        id: 'patient-1',
        tipo: 'PACIENTE',
        permissoesAdministrativas: [],
      }),
    ]);
    const sessions = new InMemoryAuthSessionRepository();
    sessions.items.push(createSession('session-1', 'patient-1'));
    const inactivatePaciente = new InactivatePacienteUseCase(
      usuarios,
      sessions,
    );

    await inactivatePaciente.execute('patient-1');

    assert.deepEqual(usuarios.inactivatedIds, ['patient-1']);
    assert.equal(sessions.items[0]?.revokedAt instanceof Date, true);
  });

  test('bloqueia inativar o último administrador TOTAL ativo', async ({
    assert,
  }) => {
    const usuarios = new InMemoryUsuarioManagementRepository([
      createUsuarioDetails({
        id: 'admin-1',
        tipo: 'ADMINISTRADOR',
        permissoesAdministrativas: ['TOTAL'],
      }),
    ]);
    const inactivateAdministrador = new InactivateAdministradorUseCase(
      usuarios,
      new InMemoryAuthSessionRepository(),
    );

    const error = await captureError(() =>
      inactivateAdministrador.execute('admin-1'),
    );

    assert.equal(error instanceof AuthApplicationError, true);
    assert.equal((error as AuthApplicationError).code, 'CONFLICT');
    assert.equal(
      (error as AuthApplicationError).message,
      'Deve existir ao menos um administrador ativo com permissão TOTAL.',
    );
  });

  test('impede remover TOTAL do último administrador full', async ({
    assert,
  }) => {
    const usuarios = new InMemoryUsuarioManagementRepository([
      createUsuarioDetails({
        id: 'admin-1',
        tipo: 'ADMINISTRADOR',
        permissoesAdministrativas: ['TOTAL'],
      }),
    ]);
    const updateAdministrador = new UpdateAdministradorUseCase(
      usuarios,
      new InMemoryAuthSessionRepository(),
    );

    const error = await captureError(() =>
      updateAdministrador.execute('admin-1', {
        permissoesAdministrativas: ['GESTAO_CONTEUDOS'],
      }),
    );

    assert.equal(error instanceof AuthApplicationError, true);
    assert.equal((error as AuthApplicationError).code, 'CONFLICT');
    assert.equal(
      (error as AuthApplicationError).message,
      'Deve existir ao menos um administrador ativo com permissão TOTAL.',
    );
  });
});

function createEnderecoInput() {
  return {
    cep: '01310-930',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    complemento: null,
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    latitude: -23.561684,
    longitude: -46.655981,
  };
}

function createUsuarioDetails(input: {
  id: string;
  tipo: PublicUsuario['tipo'];
  permissoesAdministrativas: PermissaoAdministrativaNome[];
}): UsuarioDetails {
  return {
    usuario: {
      id: input.id,
      nome: 'Usuário Teste',
      email: `${input.id}@example.com`,
      login: input.id,
      telefone: '11999998888',
      dataNascimento: new Date('1990-05-20T00:00:00.000Z'),
      status: 'ATIVO',
      tipo: input.tipo,
      permissoesAdministrativas: input.permissoesAdministrativas,
      perfisAdministrativos: input.permissoesAdministrativas,
      trocaSenhaObrigatoria: false,
      ultimoAcesso: null,
      imagemUrl: null,
    },
    endereco:
      input.tipo === 'PACIENTE'
        ? {
            id: 'endereco-1',
            ...createEnderecoInput(),
            cep: '01310930',
          }
        : null,
  };
}

function createSession(id: string, usuarioId: string): AuthSession {
  return new AuthSession({
    id,
    usuarioId,
    refreshTokenHash: `hash:${id}`,
    csrfTokenHash: `csrf:${id}`,
    expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    revokedAt: null,
    lastUsedAt: null,
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

class InMemoryUsuarioManagementRepository implements UsuarioManagementRepository {
  readonly createdAdmins: CreateAdministradorRepositoryInput[] = [];
  readonly createdPatients: CreatePacienteRepositoryInput[] = [];
  readonly inactivatedIds: string[] = [];
  remainingTotalAdmins = 0;
  private readonly details: Map<string, UsuarioDetails>;

  constructor(initialDetails: UsuarioDetails[] = []) {
    this.details = new Map(
      initialDetails.map((details) => [details.usuario.id, details]),
    );
  }

  async listUsuarios(input: ListUsuariosInput): Promise<PaginatedUsuarios> {
    const data = [...this.details.values()].map((details) => details.usuario);

    return {
      data,
      page: input.page,
      pageSize: input.pageSize,
      total: data.length,
      totalPages: data.length === 0 ? 0 : 1,
    };
  }

  async findUsuarioDetailsById(id: string): Promise<UsuarioDetails | null> {
    return this.details.get(id) ?? null;
  }

  async createAdministrador(
    input: CreateAdministradorRepositoryInput,
  ): Promise<UsuarioDetails> {
    this.createdAdmins.push(input);

    const details = createUsuarioDetails({
      id: 'admin-1',
      tipo: 'ADMINISTRADOR',
      permissoesAdministrativas: input.permissoesAdministrativas,
    });
    details.usuario.nome = input.nome;
    details.usuario.email = input.email;
    details.usuario.login = input.login;
    details.usuario.telefone = input.telefone;
    details.usuario.dataNascimento = input.dataNascimento;
    details.usuario.trocaSenhaObrigatoria = input.trocaSenhaObrigatoria;
    this.details.set(details.usuario.id, details);

    return details;
  }

  async updateAdministrador(
    input: UpdateAdministradorRepositoryInput,
  ): Promise<UsuarioDetails> {
    const current = this.details.get(input.id);

    if (current === undefined) {
      throw new AuthApplicationError('NOT_FOUND', 'Usuário não encontrado.');
    }

    const updated: UsuarioDetails = {
      ...current,
      usuario: {
        ...current.usuario,
        ...input.data,
        permissoesAdministrativas:
          input.data.permissoesAdministrativas ??
          current.usuario.permissoesAdministrativas,
      },
    };
    this.details.set(input.id, updated);

    return updated;
  }

  async createPaciente(
    input: CreatePacienteRepositoryInput,
  ): Promise<UsuarioDetails> {
    this.createdPatients.push(input);

    const details = createUsuarioDetails({
      id: 'patient-1',
      tipo: 'PACIENTE',
      permissoesAdministrativas: [],
    });
    details.usuario.nome = input.nome;
    details.usuario.email = input.email;
    details.usuario.login = input.login;
    details.usuario.telefone = input.telefone;
    details.usuario.dataNascimento = input.dataNascimento;
    details.endereco = {
      id: 'endereco-1',
      ...input.endereco,
    };
    this.details.set(details.usuario.id, details);

    return details;
  }

  async updatePaciente(
    input: UpdatePacienteRepositoryInput,
  ): Promise<UsuarioDetails> {
    const current = this.details.get(input.id);

    if (current === undefined) {
      throw new AuthApplicationError('NOT_FOUND', 'Paciente não encontrado.');
    }

    const updated: UsuarioDetails = {
      usuario: {
        ...current.usuario,
        ...input.data,
      },
      endereco:
        input.data.endereco === undefined
          ? current.endereco
          : {
              id: current.endereco?.id ?? 'endereco-1',
              ...input.data.endereco,
            },
    };
    this.details.set(input.id, updated);

    return updated;
  }

  async inactivateUsuario(id: string): Promise<void> {
    this.inactivatedIds.push(id);
    const current = this.details.get(id);

    if (current !== undefined) {
      this.details.set(id, {
        ...current,
        usuario: {
          ...current.usuario,
          status: 'INATIVO',
        },
      });
    }
  }

  async countActiveTotalAdministratorsExcluding(): Promise<number> {
    return this.remainingTotalAdmins;
  }
}

class InMemoryAuthSessionRepository implements AuthSessionRepository {
  readonly items: AuthSession[] = [];

  async create(input: CreateAuthSessionInput): Promise<AuthSession> {
    const session = new AuthSession({
      id: 'session-created',
      usuarioId: input.usuarioId,
      refreshTokenHash: input.refreshTokenHash,
      csrfTokenHash: input.csrfTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      lastUsedAt: null,
    });
    this.items.push(session);

    return session;
  }

  async findById(id: string): Promise<AuthSession | null> {
    return this.items.find((session) => session.id === id) ?? null;
  }

  async findByRefreshTokenHash(): Promise<AuthSession | null> {
    return null;
  }

  async rotate(input: RotateAuthSessionInput): Promise<AuthSession> {
    return createSession(input.id, 'unused');
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

class FixedTemporaryPasswordGenerator implements TemporaryPasswordGenerator {
  constructor(private readonly password: string) {}

  generate(): string {
    return this.password;
  }
}
