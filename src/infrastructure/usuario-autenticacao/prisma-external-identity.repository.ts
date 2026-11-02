import { Prisma } from '../../generated/prisma/client.js';
import { AuthApplicationError } from '../../application/usuario-autenticacao/errors/auth-application.error.js';
import type {
  ExternalIdentityKey,
  ExternalIdentityRepository,
  LinkExternalIdentityInput,
} from '../../application/usuario-autenticacao/ports/external-identity.repository.js';
import { PrismaService } from '../database/prisma.service.js';

export class PrismaExternalIdentityRepository implements ExternalIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUsuarioId(identity: ExternalIdentityKey): Promise<string | null> {
    const record = await this.prisma.identidadeExterna.findUnique({
      where: {
        provedor_subject: {
          provedor: identity.provider,
          subject: identity.subject,
        },
      },
      select: { usuarioId: true },
    });

    return record?.usuarioId ?? null;
  }

  async link(input: LinkExternalIdentityInput): Promise<void> {
    try {
      await this.prisma.identidadeExterna.create({
        data: {
          provedor: input.provider,
          subject: input.subject,
          usuarioId: input.usuarioId,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existingUsuarioId = await this.findUsuarioId(input);
      if (existingUsuarioId === input.usuarioId) {
        return;
      }

      throw new AuthApplicationError(
        'GOOGLE_IDENTITY_CONFLICT',
        'Esta conta Google já possui outro vínculo.',
      );
    }
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
