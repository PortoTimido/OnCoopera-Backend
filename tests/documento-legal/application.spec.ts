import { test } from '@japa/runner';
import { DocumentoLegalApplicationError } from '../../src/application/documento-legal/errors/documento-legal-application.error.js';
import type { DocumentoLegalRepository } from '../../src/application/documento-legal/ports/documento-legal.repository.js';
import {
  CreateDocumentoLegalUseCase,
  GetDocumentoLegalUseCase,
  UpdateDocumentoLegalUseCase,
} from '../../src/application/documento-legal/use-cases/documento-legal.use-cases.js';
import type {
  PublicDocumentoLegal,
  TipoDocumentoLegal,
} from '../../src/domain/documento-legal/documento-legal.js';
import { proximaVersaoDocumentoLegal } from '../../src/domain/documento-legal/documento-legal.js';

test.group('documento legal application', () => {
  test('cria documento com versão inicial 1.0', async ({ assert }) => {
    const repository = new InMemoryDocumentoLegalRepository();
    const useCase = new CreateDocumentoLegalUseCase(repository);

    const documento = await useCase.execute({
      tipo: 'TERMOS_USO',
      conteudo: 'Termos iniciais',
    });

    assert.equal(documento.versao, '1.0');
    assert.equal(documento.conteudo, 'Termos iniciais');
  });

  test('consulta documento por tipo e informa ausência', async ({ assert }) => {
    const repository = new InMemoryDocumentoLegalRepository();
    const getDocumento = new GetDocumentoLegalUseCase(repository);
    const missing = await captureError(() =>
      getDocumento.execute('POLITICA_PRIVACIDADE'),
    );

    assert.instanceOf(missing, DocumentoLegalApplicationError);
    assert.equal((missing as DocumentoLegalApplicationError).code, 'NOT_FOUND');
  });

  test('atualiza conteúdo e incrementa versão', async ({ assert }) => {
    const repository = new InMemoryDocumentoLegalRepository();
    await repository.create({
      tipo: 'TERMOS_USO',
      versao: '1.0',
      conteudo: 'Conteúdo anterior',
      atualizadoEm: new Date(),
    });
    const useCase = new UpdateDocumentoLegalUseCase(repository);

    const documento = await useCase.execute({
      tipo: 'TERMOS_USO',
      conteudo: 'Conteúdo novo',
    });

    assert.equal(documento.versao, '1.1');
    assert.equal(documento.conteudo, 'Conteúdo novo');
  });

  test('avança de 1.9 para 2.0 e bloqueia o limite 999.9', async ({
    assert,
  }) => {
    assert.equal(proximaVersaoDocumentoLegal('1.9'), '2.0');
    const error = captureSyncError(() => proximaVersaoDocumentoLegal('999.9'));

    assert.instanceOf(error, Error);
    assert.equal(
      (error as Error).message,
      'Limite de versão do documento legal atingido.',
    );
  });
});

class InMemoryDocumentoLegalRepository implements DocumentoLegalRepository {
  private readonly items = new Map<TipoDocumentoLegal, PublicDocumentoLegal>();

  async findByTipo(tipo: TipoDocumentoLegal) {
    return this.items.get(tipo) ?? null;
  }

  async create(input: {
    tipo: TipoDocumentoLegal;
    versao: string;
    conteudo: string;
    atualizadoEm: Date;
  }) {
    if (this.items.has(input.tipo)) {
      throw new DocumentoLegalApplicationError(
        'CONFLICT',
        'Já existe um documento para este tipo.',
      );
    }

    const document = { id: `documento-${input.tipo}`, ...input };
    this.items.set(input.tipo, document);
    return document;
  }

  async updateIfVersion(input: {
    tipo: TipoDocumentoLegal;
    versaoAtual: string;
    proximaVersao: string;
    conteudo: string;
    atualizadoEm: Date;
  }) {
    const current = this.items.get(input.tipo);
    if (current === undefined || current.versao !== input.versaoAtual)
      return null;

    const document = {
      ...current,
      versao: input.proximaVersao,
      conteudo: input.conteudo,
      atualizadoEm: input.atualizadoEm,
    };
    this.items.set(input.tipo, document);
    return document;
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

function captureSyncError(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}
