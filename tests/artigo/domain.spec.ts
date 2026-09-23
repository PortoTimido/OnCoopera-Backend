import { test } from '@japa/runner';
import { Artigo } from '../../src/domain/artigo/entities/artigo.entity.js';
import { DomainValidationError } from '../../src/domain/artigo/errors/domain-validation.error.js';
import { ConteudoArtigo } from '../../src/domain/artigo/value-objects/conteudo-artigo.value-object.js';
import { ImagemUrl } from '../../src/domain/artigo/value-objects/imagem-url.value-object.js';
import { TempoLeitura } from '../../src/domain/artigo/value-objects/tempo-leitura.value-object.js';
import { TituloArtigo } from '../../src/domain/artigo/value-objects/titulo-artigo.value-object.js';

test.group('artigo domain', () => {
  test('valida value objects de artigo', ({ assert }) => {
    assert.equal(TituloArtigo.create(' Titulo ').value, 'Titulo');
    assert.equal(ConteudoArtigo.create(' Conteudo ').value, 'Conteudo');
    assert.equal(TempoLeitura.create(3).calcularMinutos(), 3);
    assert.equal(
      ImagemUrl.create('https://example.com/imagem.jpg').value,
      'https://example.com/imagem.jpg',
    );

    assert.instanceOf(
      captureSyncError(() => TituloArtigo.create('')),
      DomainValidationError,
    );
    assert.instanceOf(
      captureSyncError(() => TempoLeitura.create(0)),
      DomainValidationError,
    );
    assert.instanceOf(
      captureSyncError(() => ImagemUrl.create('ftp://example.com/imagem.jpg')),
      DomainValidationError,
    );
  });

  test('exige categoria e coerencia entre status e data de publicacao', ({
    assert,
  }) => {
    assert.instanceOf(
      captureSyncError(() => createArtigo({ categorias: [] })),
      DomainValidationError,
    );
    assert.instanceOf(
      captureSyncError(() =>
        createArtigo({
          status: 'PUBLICADO',
          dataPublicacao: null,
        }),
      ),
      DomainValidationError,
    );
    assert.instanceOf(
      captureSyncError(() =>
        createArtigo({
          status: 'RASCUNHO',
          dataPublicacao: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ),
      DomainValidationError,
    );
  });

  test('transiciona entre rascunho, publicado e desativado', ({ assert }) => {
    const artigo = createArtigo();
    const publicado = artigo.publicar(
      new Date('2026-01-01T00:00:00.000Z'),
    );
    const rascunho = publicado.rascunhar(
      new Date('2026-01-02T00:00:00.000Z'),
    );
    const desativado = rascunho.desativar(
      new Date('2026-01-03T00:00:00.000Z'),
    );

    assert.equal(publicado.toPublic().status, 'PUBLICADO');
    assert.equal(
      publicado.toPublic().dataPublicacao?.toISOString(),
      '2026-01-01T00:00:00.000Z',
    );
    assert.equal(rascunho.toPublic().status, 'RASCUNHO');
    assert.equal(rascunho.toPublic().dataPublicacao, null);
    assert.equal(desativado.toPublic().status, 'DESATIVADO');
  });
});

function createArtigo(
  overrides: Partial<Parameters<typeof Artigo.create>[0]> = {},
): Artigo {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return Artigo.create({
    id: 'artigo-1',
    autorId: 'admin-1',
    titulo: TituloArtigo.create('Titulo'),
    resumo: null,
    conteudo: ConteudoArtigo.create('Conteudo'),
    tempoLeitura: TempoLeitura.create(3),
    imagemUrl: null,
    status: 'RASCUNHO',
    categorias: [{ id: 'categoria-1', nome: 'Categoria' }],
    tags: [{ id: 'tag-1', nome: 'Tag' }],
    dataCriacao: now,
    dataAtualizacao: now,
    dataPublicacao: null,
    ...overrides,
  });
}

function captureSyncError(fn: () => unknown): unknown {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}
