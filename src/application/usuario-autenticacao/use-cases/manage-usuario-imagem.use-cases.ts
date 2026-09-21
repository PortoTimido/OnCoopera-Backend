import type { PublicUsuario } from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';
import type {
  ImageStorage,
  UploadableImage,
} from '../../armazenamento-imagem/image-storage.port.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { UsuarioRepository } from '../ports/usuario.repository.js';

export class UploadUsuarioImagemUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(
    usuarioId: string,
    image: UploadableImage,
  ): Promise<PublicUsuario> {
    await this.requireActiveUsuario(usuarioId);

    const previousObjectKey =
      await this.usuarios.findImagemObjectKey(usuarioId);
    const uploaded = await this.storage.upload(`usuarios/${usuarioId}`, image);

    try {
      await this.usuarios.setImagemObjectKey(usuarioId, uploaded.objectKey);
    } catch (error) {
      await this.removeAfterPersistenceFailure(uploaded.objectKey);
      throw error;
    }

    if (previousObjectKey !== null) {
      await this.storage.remove(previousObjectKey);
    }

    return (await this.requireActiveUsuario(usuarioId)).toPublic();
  }

  private async requireActiveUsuario(usuarioId: string) {
    const usuario = await this.usuarios.findById(usuarioId);

    if (usuario === null || !usuario.isActive()) {
      throw new AuthApplicationError(
        'UNAUTHORIZED',
        'Usuário não autenticado.',
      );
    }

    return usuario;
  }

  private async removeAfterPersistenceFailure(
    objectKey: string,
  ): Promise<void> {
    try {
      await this.storage.remove(objectKey);
    } catch {
      // The original persistence error is more useful to the caller.
    }
  }
}

export class DeleteUsuarioImagemUseCase {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(usuarioId: string): Promise<void> {
    const usuario = await this.usuarios.findById(usuarioId);

    if (usuario === null || !usuario.isActive()) {
      throw new AuthApplicationError(
        'UNAUTHORIZED',
        'Usuário não autenticado.',
      );
    }

    const objectKey = await this.usuarios.findImagemObjectKey(usuarioId);
    if (objectKey === null) return;

    await this.usuarios.setImagemObjectKey(usuarioId, null);
    await this.storage.remove(objectKey);
  }
}
