import { test } from '@japa/runner';
import { BadRequestException } from '@nestjs/common';
import type { Client } from 'minio';
import type { ConfigService } from '@nestjs/config';
import { MinioImageStorageService } from '../../src/infrastructure/armazenamento-imagem/minio-image-storage.service.js';
import {
  DeleteArtigoImagemUseCase,
  UploadArtigoImagemUseCase,
} from '../../src/application/artigo/use-cases/manage-artigo-imagem.use-cases.js';
import { DeleteApoioImagemUseCase } from '../../src/application/radar-apoio/use-cases/manage-apoio-imagem.use-cases.js';
import {
  DeleteUsuarioImagemUseCase,
  UploadUsuarioImagemUseCase,
} from '../../src/application/usuario-autenticacao/use-cases/manage-usuario-imagem.use-cases.js';
import { AuthApplicationError } from '../../src/application/usuario-autenticacao/errors/auth-application.error.js';
import { Usuario } from '../../src/domain/usuario-autenticacao/entities/usuario.entity.js';
import { DataNascimento } from '../../src/domain/usuario-autenticacao/value-objects/data-nascimento.value-object.js';
import { Email } from '../../src/domain/usuario-autenticacao/value-objects/email.value-object.js';
import { Login } from '../../src/domain/usuario-autenticacao/value-objects/login.value-object.js';
import { Nome } from '../../src/domain/usuario-autenticacao/value-objects/nome.value-object.js';
import { SenhaHash } from '../../src/domain/usuario-autenticacao/value-objects/senha-hash.value-object.js';
import { Telefone } from '../../src/domain/usuario-autenticacao/value-objects/telefone.value-object.js';
import type { UploadableImage } from '../../src/application/armazenamento-imagem/image-storage.port.js';

const jpeg: UploadableImage = {
  buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  mimetype: 'image/jpeg',
  originalname: 'capa.jpg',
  size: 4,
};

test.group('armazenamento de imagens', () => {
  test('envia imagem vÃ¡lida com chave opaca e URL assinada', async ({ assert }) => {
    const calls: string[] = [];
    const client = {
      bucketExists: async () => false,
      makeBucket: async (bucket: string) => calls.push(`bucket:${bucket}`),
      putObject: async (
        bucket: string,
        key: string,
        _content: Buffer,
        _size: number,
        meta: Record<string, string>,
      ) => calls.push(`put:${bucket}:${key}:${meta['Content-Type']}`),
      removeObject: async () => undefined,
      presignedGetObject: async (_bucket: string, key: string, expiry: number) =>
        `https://signed.example/${key}?expires=${expiry}`,
    };
    const storage = new MinioImageStorageService(
      client as unknown as Client,
      config() as ConfigService,
    );

    const stored = await storage.upload('artigos/artigo-1', jpeg);

    assert.match(
      stored.objectKey,
      /^artigos\/artigo-1\/[0-9a-f-]{36}\.jpg$/,
    );
    assert.equal(stored.mimeType, 'image/jpeg');
    assert.equal(calls[0], 'bucket:oncoopera-images');
    assert.match(calls[1]!, /^put:oncoopera-images:artigos\/artigo-1\//);
    assert.equal(
      await storage.getTemporaryUrl(stored.objectKey),
      `https://signed.example/${stored.objectKey}?expires=900`,
    );
  });

  test('rejeita MIME, extensÃ£o ou conteÃºdo divergentes', async ({ assert }) => {
    const storage = new MinioImageStorageService(
      {} as Client,
      config() as ConfigService,
    );
    const error = await capture(() =>
      storage.upload('artigos/artigo-1', { ...jpeg, mimetype: 'image/png' }),
    );
    assert.instanceOf(error, BadRequestException);
  });

  test('substitui capa somente apÃ³s persistir e remove novo objeto em falha', async ({ assert }) => {
    const storage = new MemoryStorage();
    const repository = new ArticleImageRepository();
    const useCase = new UploadArtigoImagemUseCase(repository, storage);

    await useCase.execute('artigo-1', jpeg);
    assert.deepEqual(storage.removed, ['artigos/artigo-1/old.jpg']);
    assert.equal(repository.objectKey, 'artigos/artigo-1/new.jpg');

    repository.failSave = true;
    const error = await capture(() => useCase.execute('artigo-1', jpeg));
    assert.instanceOf(error, Error);
    assert.equal(storage.removed.at(-1), 'artigos/artigo-1/new.jpg');
  });

  test('exclui referÃªncia e objeto de imagem do apoio', async ({ assert }) => {
    const storage = new MemoryStorage();
    const repository = {
      removeImagem: async () => 'radar-apoio/apoio-1/imagem.webp',
    };
    const useCase = new DeleteApoioImagemUseCase(repository as never, storage);

    await useCase.execute('apoio-1', 'imagem-1');

    assert.deepEqual(storage.removed, ['radar-apoio/apoio-1/imagem.webp']);
  });

  test('exclui objeto da capa do artigo', async ({ assert }) => {
    const storage = new MemoryStorage();
    const repository = new ArticleImageRepository();
    const useCase = new DeleteArtigoImagemUseCase(repository, storage);

    await useCase.execute('artigo-1');

    assert.deepEqual(storage.removed, ['artigos/artigo-1/old.jpg']);
    assert.equal(repository.objectKey, null);
  });

  test('substitui imagem de perfil do usuário somente apÃ³s persistir', async ({
    assert,
  }) => {
    const storage = new MemoryStorage();
    const repository = new UsuarioImageRepository();
    const useCase = new UploadUsuarioImagemUseCase(repository, storage);

    const updated = await useCase.execute('usuario-1', jpeg);

    assert.deepEqual(storage.removed, ['usuarios/usuario-1/old.jpg']);
    assert.equal(repository.objectKey, 'usuarios/usuario-1/new.jpg');
    assert.equal(updated.id, 'usuario-1');

    repository.failSave = true;
    const error = await capture(() => useCase.execute('usuario-1', jpeg));
    assert.instanceOf(error, Error);
    assert.equal(storage.removed.at(-1), 'usuarios/usuario-1/new.jpg');
  });

  test('rejeita upload/remoção de imagem para usuário inexistente ou inativo', async ({
    assert,
  }) => {
    const storage = new MemoryStorage();
    const repository = new UsuarioImageRepository();
    repository.usuario = null;
    const uploadUseCase = new UploadUsuarioImagemUseCase(repository, storage);
    const deleteUseCase = new DeleteUsuarioImagemUseCase(repository, storage);

    const uploadError = await capture(() =>
      uploadUseCase.execute('usuario-1', jpeg),
    );
    const deleteError = await capture(() => deleteUseCase.execute('usuario-1'));

    assert.instanceOf(uploadError, AuthApplicationError);
    assert.instanceOf(deleteError, AuthApplicationError);
  });

  test('exclui imagem de perfil do usuário de forma idempotente', async ({
    assert,
  }) => {
    const storage = new MemoryStorage();
    const repository = new UsuarioImageRepository();
    const useCase = new DeleteUsuarioImagemUseCase(repository, storage);

    await useCase.execute('usuario-1');
    assert.deepEqual(storage.removed, ['usuarios/usuario-1/old.jpg']);
    assert.equal(repository.objectKey, null);

    await useCase.execute('usuario-1');
    assert.deepEqual(storage.removed, ['usuarios/usuario-1/old.jpg']);
  });
});

class MemoryStorage {
  readonly removed: string[] = [];

  async upload(folder: string) {
    return {
      objectKey: `${folder}/new.jpg`,
      mimeType: 'image/jpeg',
      size: 4,
    };
  }

  async remove(objectKey: string): Promise<void> {
    this.removed.push(objectKey);
  }

  async getTemporaryUrl(objectKey: string): Promise<string> {
    return `https://signed.example/${objectKey}`;
  }
}

class ArticleImageRepository {
  objectKey: string | null = 'artigos/artigo-1/old.jpg';
  failSave = false;

  async findArtigoById() {
    return {
      id: 'artigo-1',
      imagemUrl: this.objectKey === null ? null : 'https://signed.example/image',
    };
  }

  async findImagemObjectKey() {
    return this.objectKey;
  }

  async setImagemObjectKey(_id: string, objectKey: string | null): Promise<void> {
    if (this.failSave) throw new Error('falha de banco');
    this.objectKey = objectKey;
  }
}

class UsuarioImageRepository {
  objectKey: string | null = 'usuarios/usuario-1/old.jpg';
  failSave = false;
  usuario: Usuario | null = buildUsuario();

  async findById() {
    return this.usuario;
  }

  async findImagemObjectKey() {
    return this.objectKey;
  }

  async setImagemObjectKey(
    _id: string,
    objectKey: string | null,
  ): Promise<void> {
    if (this.failSave) throw new Error('falha de banco');
    this.objectKey = objectKey;
  }
}

function buildUsuario(): Usuario {
  return Usuario.create({
    id: 'usuario-1',
    nome: Nome.create('Usuário Teste'),
    email: Email.create('usuario.teste@example.com'),
    login: Login.create('usuario.teste'),
    senhaHash: SenhaHash.create('hashed-password'),
    telefone: Telefone.fromString('11999998888'),
    dataNascimento: DataNascimento.create(new Date('1990-05-20T00:00:00.000Z')),
    status: 'ATIVO',
    tipo: 'PACIENTE',
    permissoesAdministrativas: [],
    trocaSenhaObrigatoria: false,
    dataCriacao: new Date('2026-01-01T00:00:00.000Z'),
    dataAtualizacao: new Date('2026-01-01T00:00:00.000Z'),
    ultimoAcesso: null,
  });
}

function config() {
  const values: Record<string, string | number> = {
    MINIO_BUCKET: 'oncoopera-images',
    MINIO_URL_EXPIRATION_SECONDS: 900,
    IMAGE_MAX_SIZE_BYTES: 5 * 1024 * 1024,
  };
  return { getOrThrow: <T>(key: string) => values[key] as T };
}

async function capture(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
    return null;
  } catch (error) {
    return error;
  }
}
