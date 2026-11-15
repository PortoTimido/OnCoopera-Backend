import { test } from '@japa/runner';
import type { CreatePacienteRepositoryInput } from '../../src/application/usuario-autenticacao/ports/usuario-management.repository.js';
import { PrismaUsuarioRepository } from '../../src/infrastructure/usuario-autenticacao/prisma-usuario.repository.js';

test.group('PrismaUsuarioRepository', () => {
  test('grava o aceite do termo vigente na transação do cadastro', async ({
    assert,
  }) => {
    const fixture = createRepositoryFixture('termos-vigentes');

    await fixture.repository.createPaciente(createPacienteInput());

    assert.equal(fixture.aceites.length, 1);
    assert.equal(fixture.aceites[0]?.usuarioId, 'paciente-1');
    assert.equal(fixture.aceites[0]?.documentoId, 'termos-vigentes');
    assert.instanceOf(fixture.aceites[0]?.aceitoEm, Date);
    assert.equal(fixture.committed, true);
  });

  test('não grava aceite quando não há termo vigente', async ({ assert }) => {
    const fixture = createRepositoryFixture(null);

    await fixture.repository.createPaciente(createPacienteInput());

    assert.deepEqual(fixture.aceites, []);
    assert.equal(fixture.committed, true);
  });

  test('propaga falha do aceite e reverte a transação do cadastro', async ({
    assert,
  }) => {
    const fixture = createRepositoryFixture('termos-vigentes', true);

    await assert.rejects(
      () => fixture.repository.createPaciente(createPacienteInput()),
      'Falha ao registrar aceite.',
    );

    assert.equal(fixture.committed, false);
    assert.equal(fixture.rolledBack, true);
  });
});

function createPacienteInput(): CreatePacienteRepositoryInput {
  return {
    nome: 'Paciente Teste',
    email: 'paciente@example.com',
    login: 'paciente.teste',
    telefone: '11999998888',
    dataNascimento: new Date('1990-05-20T00:00:00.000Z'),
    senhaHash: 'hash-password:SenhaPaciente!123',
    termosUsoAceito: true,
    endereco: {
      cep: '01310930',
      logradouro: 'Avenida Paulista',
      numero: '1000',
      complemento: null,
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      latitude: -23.561684,
      longitude: -46.655981,
    },
  };
}

function createRepositoryFixture(
  termosUsoId: string | null,
  failOnAceite = false,
) {
  const aceites: Array<{
    usuarioId: string;
    documentoId: string;
    aceitoEm: Date;
  }> = [];
  let committed = false;
  let rolledBack = false;

  const transaction = {
    usuario: {
      create: async () => ({ id: 'paciente-1' }),
      findUniqueOrThrow: async () => usuarioPersistenceRecord(),
    },
    paciente: { create: async () => undefined },
    documentoLegal: {
      findUnique: async () =>
        termosUsoId === null ? null : { id: termosUsoId },
    },
    aceiteDocumento: {
      create: async (input: {
        data: { usuarioId: string; documentoId: string; aceitoEm: Date };
      }) => {
        if (failOnAceite) throw new Error('Falha ao registrar aceite.');
        aceites.push(input.data);
      },
    },
    $executeRaw: async () => 1,
  };

  const prisma = {
    $transaction: async <T>(
      callback: (tx: typeof transaction) => Promise<T>,
    ) => {
      try {
        const result = await callback(transaction);
        committed = true;
        return result;
      } catch (error) {
        rolledBack = true;
        throw error;
      }
    },
    $queryRaw: async () => [
      {
        id: 'endereco-1',
        cep: '01310930',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        complemento: null,
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        latitude: -23.561684,
        longitude: -46.655981,
      },
    ],
  };

  return {
    repository: new PrismaUsuarioRepository(
      prisma as never,
      {
        getTemporaryUrl: async () => '',
      } as never,
    ),
    aceites,
    get committed() {
      return committed;
    },
    get rolledBack() {
      return rolledBack;
    },
  };
}

function usuarioPersistenceRecord() {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'paciente-1',
    nome: 'Paciente Teste',
    email: 'paciente@example.com',
    login: 'paciente.teste',
    senhaHash: 'hash-password:SenhaPaciente!123',
    telefone: '11999998888',
    dataNascimento: new Date('1990-05-20T00:00:00.000Z'),
    status: 'ATIVO',
    trocaSenhaObrigatoria: false,
    dataCriacao: now,
    dataAtualizacao: now,
    ultimoAcesso: null,
    senhaTemporariaExpiraEm: null,
    imagemObjectKey: null,
    paciente: {
      enderecoId: 'endereco-1',
      endereco: {
        id: 'endereco-1',
        cep: '01310930',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        complemento: null,
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
      },
    },
    administrador: null,
  };
}
