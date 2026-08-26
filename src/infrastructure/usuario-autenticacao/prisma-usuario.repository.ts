import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { Usuario } from '../../domain/usuario-autenticacao/entities/usuario.entity.js';
import type {
  PerfilAdministrativoNome,
  StatusUsuario,
  TipoUsuario,
} from '../../domain/usuario-autenticacao/entities/usuario.entity.js';
import {
  PERFIL_ADMINISTRATIVO_TOTAL,
  PERFIS_ADMINISTRATIVOS_CONHECIDOS,
} from '../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { AuthApplicationError } from '../../application/usuario-autenticacao/errors/auth-application.error.js';
import { DataNascimento } from '../../domain/usuario-autenticacao/value-objects/data-nascimento.value-object.js';
import { Email } from '../../domain/usuario-autenticacao/value-objects/email.value-object.js';
import { Login } from '../../domain/usuario-autenticacao/value-objects/login.value-object.js';
import { Nome } from '../../domain/usuario-autenticacao/value-objects/nome.value-object.js';
import { SenhaHash } from '../../domain/usuario-autenticacao/value-objects/senha-hash.value-object.js';
import { Telefone } from '../../domain/usuario-autenticacao/value-objects/telefone.value-object.js';
import type { UsuarioRepository } from '../../application/usuario-autenticacao/ports/usuario.repository.js';
import type {
  CreateAdministradorRepositoryInput,
  CreatePacienteRepositoryInput,
  EnderecoData,
  EnderecoOutput,
  ListUsuariosInput,
  PaginatedUsuarios,
  UpdateAdministradorRepositoryInput,
  UpdatePacienteRepositoryInput,
  UsuarioDetails,
  UsuarioManagementRepository,
} from '../../application/usuario-autenticacao/ports/usuario-management.repository.js';
import { PrismaService } from '../database/prisma.service.js';

type PrismaTransaction = Prisma.TransactionClient;

interface UsuarioPersistenceRecord {
  id: string;
  nome: string;
  email: string;
  login: string;
  senhaHash: string;
  telefone: string;
  dataNascimento: Date;
  status: string;
  trocaSenhaObrigatoria: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
  ultimoAcesso: Date | null;
  paciente: {
    enderecoId: string;
    endereco?: EnderecoPersistenceRecord | null;
  } | null;
  administrador: {
    perfis: Array<{
      perfil: {
        nome: string;
      };
    }>;
  } | null;
}

interface EnderecoPersistenceRecord {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
}

interface EnderecoWithLocationRow extends EnderecoPersistenceRecord {
  latitude: number;
  longitude: number;
}

const usuarioInclude = {
  paciente: {
    include: {
      endereco: true,
    },
  },
  administrador: {
    include: {
      perfis: {
        include: {
          perfil: true,
        },
      },
    },
  },
} as const;

export class PrismaUsuarioRepository
  implements UsuarioRepository, UsuarioManagementRepository
{
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async findByIdentifier(identifier: string): Promise<Usuario | null> {
    const trimmedIdentifier = identifier.trim();
    const emailIdentifier = trimmedIdentifier.toLowerCase();
    const record = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ email: emailIdentifier }, { login: trimmedIdentifier }],
      },
      include: usuarioInclude,
    });

    return record === null ? null : this.toDomain(record);
  }

  async findById(id: string): Promise<Usuario | null> {
    const record = await this.prisma.usuario.findUnique({
      where: { id },
      include: usuarioInclude,
    });

    return record === null ? null : this.toDomain(record);
  }

  async updateLastAccess(id: string, ultimoAcesso: Date): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { ultimoAcesso },
    });
  }

  async updatePasswordHash(
    id: string,
    senhaHash: string,
    options?: { trocaSenhaObrigatoria?: boolean },
  ): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: {
        senhaHash,
        ...(options?.trocaSenhaObrigatoria !== undefined
          ? { trocaSenhaObrigatoria: options.trocaSenhaObrigatoria }
          : {}),
      },
    });
  }

  async listUsuarios(input: ListUsuariosInput): Promise<PaginatedUsuarios> {
    const where = this.toUsuarioWhere(input);
    const [total, records] = await this.prisma.$transaction([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        include: usuarioInclude,
        orderBy: { dataCriacao: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
    ]);

    return {
      data: records.map((record) => this.toDomain(record).toPublic()),
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    };
  }

  async findUsuarioDetailsById(id: string): Promise<UsuarioDetails | null> {
    const record = await this.prisma.usuario.findUnique({
      where: { id },
      include: usuarioInclude,
    });

    return record === null ? null : this.toDetails(record);
  }

  async createAdministrador(
    input: CreateAdministradorRepositoryInput,
  ): Promise<UsuarioDetails> {
    try {
      const record = await this.prisma.usuario.create({
        data: {
          nome: input.nome,
          email: input.email,
          login: input.login,
          senhaHash: input.senhaHash,
          telefone: input.telefone,
          dataNascimento: input.dataNascimento,
          status: 'ATIVO',
          trocaSenhaObrigatoria: input.trocaSenhaObrigatoria,
          administrador: {
            create: {
              perfis: {
                create: input.perfisAdministrativos.map((perfil) => ({
                  perfil: {
                    connect: { nome: perfil },
                  },
                })),
              },
            },
          },
        },
        include: usuarioInclude,
      });

      return this.toDetails(record);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async updateAdministrador(
    input: UpdateAdministradorRepositoryInput,
  ): Promise<UsuarioDetails> {
    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const usuarioData = toUsuarioUpdateData(input.data);

        if (Object.keys(usuarioData).length > 0) {
          await tx.usuario.update({
            where: { id: input.id },
            data: usuarioData,
          });
        }

        if (input.data.perfisAdministrativos !== undefined) {
          await tx.administradorPerfil.deleteMany({
            where: { administradorId: input.id },
          });
          await tx.administradorPerfil.createMany({
            data: await this.toAdministradorPerfilRows(
              tx,
              input.id,
              input.data.perfisAdministrativos,
            ),
          });
        }

        return tx.usuario.findUniqueOrThrow({
          where: { id: input.id },
          include: usuarioInclude,
        });
      });

      return this.toDetails(record);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async createPaciente(
    input: CreatePacienteRepositoryInput,
  ): Promise<UsuarioDetails> {
    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const enderecoId = randomUUID();
        const usuario = await tx.usuario.create({
          data: {
            nome: input.nome,
            email: input.email,
            login: input.login,
            senhaHash: input.senhaHash,
            telefone: input.telefone,
            dataNascimento: input.dataNascimento,
            status: 'ATIVO',
            trocaSenhaObrigatoria: false,
          },
        });

        await this.insertEndereco(tx, enderecoId, input.endereco);
        await tx.paciente.create({
          data: {
            usuarioId: usuario.id,
            enderecoId,
          },
        });

        return tx.usuario.findUniqueOrThrow({
          where: { id: usuario.id },
          include: usuarioInclude,
        });
      });

      return this.toDetails(record);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async updatePaciente(
    input: UpdatePacienteRepositoryInput,
  ): Promise<UsuarioDetails> {
    try {
      const record = await this.prisma.$transaction(async (tx) => {
        const paciente = await tx.paciente.findUnique({
          where: { usuarioId: input.id },
          select: { enderecoId: true },
        });

        if (paciente === null) {
          throw new AuthApplicationError(
            'NOT_FOUND',
            'Paciente não encontrado.',
          );
        }

        const usuarioData = toUsuarioUpdateData(input.data);

        if (Object.keys(usuarioData).length > 0) {
          await tx.usuario.update({
            where: { id: input.id },
            data: usuarioData,
          });
        }

        if (input.data.endereco !== undefined) {
          await this.updateEndereco(
            tx,
            paciente.enderecoId,
            input.data.endereco,
          );
        }

        return tx.usuario.findUniqueOrThrow({
          where: { id: input.id },
          include: usuarioInclude,
        });
      });

      return this.toDetails(record);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async inactivateUsuario(id: string, inactivatedAt: Date): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: {
        status: 'INATIVO',
        dataAtualizacao: inactivatedAt,
      },
    });
  }

  async countActiveTotalAdministratorsExcluding(id?: string): Promise<number> {
    return this.prisma.usuario.count({
      where: {
        status: 'ATIVO',
        ...(id !== undefined ? { id: { not: id } } : {}),
        administrador: {
          is: {
            perfis: {
              some: {
                perfil: {
                  nome: PERFIL_ADMINISTRATIVO_TOTAL,
                },
              },
            },
          },
        },
      },
    });
  }

  private toDomain(record: UsuarioPersistenceRecord): Usuario {
    return Usuario.create({
      id: record.id,
      nome: Nome.create(record.nome),
      email: Email.create(record.email),
      login: Login.create(record.login),
      senhaHash: SenhaHash.create(record.senhaHash),
      telefone: Telefone.fromString(record.telefone),
      dataNascimento: DataNascimento.create(record.dataNascimento),
      status: toStatusUsuario(record.status),
      tipo: toTipoUsuario(record),
      perfisAdministrativos:
        record.administrador?.perfis.map((administradorPerfil) =>
          toPerfilAdministrativoNome(administradorPerfil.perfil.nome),
        ) ?? [],
      trocaSenhaObrigatoria: record.trocaSenhaObrigatoria,
      dataCriacao: record.dataCriacao,
      dataAtualizacao: record.dataAtualizacao,
      ultimoAcesso: record.ultimoAcesso,
    });
  }

  private async toDetails(
    record: UsuarioPersistenceRecord,
  ): Promise<UsuarioDetails> {
    return {
      usuario: this.toDomain(record).toPublic(),
      endereco:
        record.paciente?.endereco === undefined ||
        record.paciente.endereco === null
          ? null
          : await this.toEnderecoOutput(record.paciente.endereco.id),
    };
  }

  private toUsuarioWhere(input: ListUsuariosInput): Prisma.UsuarioWhereInput {
    const and: Prisma.UsuarioWhereInput[] = [];

    if (input.search !== undefined && input.search.length > 0) {
      and.push({
        OR: [
          { nome: { contains: input.search, mode: 'insensitive' } },
          {
            email: {
              contains: input.search.toLowerCase(),
              mode: 'insensitive',
            },
          },
          { login: { contains: input.search, mode: 'insensitive' } },
        ],
      });
    }

    if (input.tipo === 'ADMINISTRADOR') {
      and.push({ administrador: { isNot: null } });
    }

    if (input.tipo === 'PACIENTE') {
      and.push({ paciente: { isNot: null } });
    }

    if (input.tipo === 'USUARIO') {
      and.push({
        administrador: { is: null },
        paciente: { is: null },
      });
    }

    if (input.perfil !== undefined) {
      and.push({
        administrador: {
          is: {
            perfis: {
              some: {
                perfil: {
                  nome: input.perfil,
                },
              },
            },
          },
        },
      });
    }

    return {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(and.length > 0 ? { AND: and } : {}),
    };
  }

  private async toAdministradorPerfilRows(
    tx: PrismaTransaction,
    administradorId: string,
    perfisAdministrativos: PerfilAdministrativoNome[],
  ): Promise<Array<{ administradorId: string; perfilId: string }>> {
    const perfis = await tx.perfilAdministrativo.findMany({
      where: { nome: { in: perfisAdministrativos } },
      select: { id: true, nome: true },
    });

    if (perfis.length !== perfisAdministrativos.length) {
      throw new AuthApplicationError(
        'CONFLICT',
        'Perfil administrativo inválido.',
      );
    }

    return perfis.map((perfil) => ({
      administradorId,
      perfilId: perfil.id,
    }));
  }

  private async insertEndereco(
    tx: PrismaTransaction,
    id: string,
    endereco: Omit<EnderecoData, 'id'>,
  ): Promise<void> {
    await tx.$executeRaw`
      INSERT INTO "endereco" (
        "id",
        "cep",
        "logradouro",
        "numero",
        "complemento",
        "bairro",
        "cidade",
        "estado",
        "localizacao_postgis"
      )
      VALUES (
        ${id}::uuid,
        ${endereco.cep},
        ${endereco.logradouro},
        ${endereco.numero},
        ${endereco.complemento},
        ${endereco.bairro},
        ${endereco.cidade},
        ${endereco.estado},
        ST_SetSRID(ST_MakePoint(${endereco.longitude}, ${endereco.latitude}), 4326)
      )
    `;
  }

  private async updateEndereco(
    tx: PrismaTransaction,
    id: string,
    endereco: Omit<EnderecoData, 'id'>,
  ): Promise<void> {
    await tx.$executeRaw`
      UPDATE "endereco"
      SET
        "cep" = ${endereco.cep},
        "logradouro" = ${endereco.logradouro},
        "numero" = ${endereco.numero},
        "complemento" = ${endereco.complemento},
        "bairro" = ${endereco.bairro},
        "cidade" = ${endereco.cidade},
        "estado" = ${endereco.estado},
        "localizacao_postgis" = ST_SetSRID(ST_MakePoint(${endereco.longitude}, ${endereco.latitude}), 4326)
      WHERE "id" = ${id}::uuid
    `;
  }

  private async toEnderecoOutput(id: string): Promise<EnderecoOutput | null> {
    const rows = await this.prisma.$queryRaw<EnderecoWithLocationRow[]>`
      SELECT
        "id",
        "cep",
        "logradouro",
        "numero",
        "complemento",
        "bairro",
        "cidade",
        "estado",
        ST_Y("localizacao_postgis") AS "latitude",
        ST_X("localizacao_postgis") AS "longitude"
      FROM "endereco"
      WHERE "id" = ${id}::uuid
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  private mapPersistenceError(error: unknown): Error {
    if (error instanceof AuthApplicationError) {
      return error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new AuthApplicationError(
          'CONFLICT',
          'Email ou login já cadastrado.',
        );
      }

      if (error.code === 'P2025') {
        return new AuthApplicationError('NOT_FOUND', 'Usuário não encontrado.');
      }
    }

    return error instanceof Error ? error : new Error('Erro de persistência.');
  }
}

function toUsuarioUpdateData(
  data:
    | UpdateAdministradorRepositoryInput['data']
    | UpdatePacienteRepositoryInput['data'],
): Prisma.UsuarioUpdateInput {
  return {
    ...(data.nome !== undefined ? { nome: data.nome } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.login !== undefined ? { login: data.login } : {}),
    ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
    ...(data.dataNascimento !== undefined
      ? { dataNascimento: data.dataNascimento }
      : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
  };
}

function toStatusUsuario(status: string): StatusUsuario {
  if (status === 'ATIVO' || status === 'INATIVO' || status === 'BLOQUEADO') {
    return status;
  }

  throw new Error(`Status de usuário desconhecido: ${status}`);
}

function toTipoUsuario(record: UsuarioPersistenceRecord): TipoUsuario {
  if (record.administrador !== null) {
    return 'ADMINISTRADOR';
  }

  if (record.paciente !== null) {
    return 'PACIENTE';
  }

  return 'USUARIO';
}

function toPerfilAdministrativoNome(nome: string): PerfilAdministrativoNome {
  const perfil = PERFIS_ADMINISTRATIVOS_CONHECIDOS.find(
    (knownPerfil) => knownPerfil === nome,
  );

  if (perfil === undefined) {
    throw new Error(`Perfil administrativo desconhecido: ${nome}`);
  }

  return perfil;
}
