import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import type {
  ApoioRepository,
  ApoioWriteInput,
  ListApoiosInput,
  PaginatedApoios,
} from '../../application/radar-apoio/ports/apoio.repository.js';
import {
  isOpenNow,
  type EnderecoApoio,
  type HorarioApoio,
  type PublicApoio,
} from '../../domain/radar-apoio/entities/apoio.entity.js';
import { PrismaService } from '../database/prisma.service.js';
import type { ImageStorage } from '../../application/armazenamento-imagem/image-storage.port.js';

type AddressRow = Omit<EnderecoApoio, 'id'> & {
  id: string;
  latitude: number;
  longitude: number;
};
const include = {
  endereco: true,
  horariosFuncionamento: {
    orderBy: [{ diaSemana: 'asc' }, { horarioInicio: 'asc' }],
  },
  imagens: { orderBy: { ordem: 'asc' } },
} satisfies Prisma.ApoioInclude;
type ApoioRecord = Prisma.ApoioGetPayload<{ include: typeof include }>;

export class PrismaApoioRepository implements ApoioRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ImageStorage,
  ) {}
  async list(input: ListApoiosInput): Promise<PaginatedApoios> {
    const where = {
      ...(input.onlyActive ? { statusAdministrativo: 'ATIVO' as const } : {}),
      ...(input.status ? { statusAdministrativo: input.status } : {}),
      ...(input.tipoApoio ? { tipoApoio: input.tipoApoio } : {}),
      ...(input.search
        ? { nome: { contains: input.search, mode: 'insensitive' as const } }
        : {}),
      ...(input.cidade
        ? {
            endereco: {
              cidade: { equals: input.cidade, mode: 'insensitive' as const },
            },
          }
        : {}),
    };
    const nearby =
      input.latitude !== undefined && input.longitude !== undefined;
    const [total, records] = await this.prisma.$transaction([
      this.prisma.apoio.count({ where }),
      this.prisma.apoio.findMany({
        where,
        include,
        orderBy: { nome: 'asc' },
        ...(nearby
          ? {}
          : { skip: (input.page - 1) * input.pageSize, take: input.pageSize }),
      }),
    ]);
    const data = await Promise.all(
      records.map(async (record) =>
        this.toPublic(record, input.latitude, input.longitude),
      ),
    );
    if (nearby)
      data.sort(
        (a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity),
      );
    const paged = nearby
      ? data.slice(
          (input.page - 1) * input.pageSize,
          input.page * input.pageSize,
        )
      : data;
    return {
      data: paged,
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    };
  }
  async findById(id: string, onlyActive = false): Promise<PublicApoio | null> {
    const record = await this.prisma.apoio.findFirst({
      where: { id, ...(onlyActive ? { statusAdministrativo: 'ATIVO' } : {}) },
      include,
    });
    return record ? this.toPublic(record) : null;
  }
  async create(input: ApoioWriteInput): Promise<PublicApoio> {
    const id = randomUUID();
    const enderecoId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      await this.insertAddress(tx, enderecoId, input.endereco);
      await tx.apoio.create({
        data: {
          id,
          enderecoId,
          nome: input.nome,
          tipoApoio: input.tipoApoio,
          telefone: input.telefone,
          descricao: input.descricao ?? '',
          statusAdministrativo: input.status,
          horariosFuncionamento: {
            create: input.horarios.map((item) => ({
              diaSemana: item.diaSemana,
              horarioInicio: time(item.horarioInicio),
              horarioFim: time(item.horarioFim),
            })),
          },
        },
      });
    });
    return (await this.findById(id))!;
  }
  async update(
    id: string,
    input: Partial<ApoioWriteInput>,
  ): Promise<PublicApoio> {
    await this.prisma.$transaction(async (tx) => {
      if (input.endereco) {
        const current = await tx.apoio.findUniqueOrThrow({
          where: { id },
          select: { enderecoId: true },
        });
        await this.updateAddress(tx, current.enderecoId, input.endereco);
      }
      await tx.apoio.update({
        where: { id },
        data: {
          ...(input.nome !== undefined ? { nome: input.nome } : {}),
          ...(input.tipoApoio !== undefined
            ? { tipoApoio: input.tipoApoio }
            : {}),
          ...(input.telefone !== undefined ? { telefone: input.telefone } : {}),
          ...(input.descricao !== undefined
            ? { descricao: input.descricao ?? '' }
            : {}),
          ...(input.status !== undefined
            ? { statusAdministrativo: input.status }
            : {}),
        },
      });
      if (input.horarios) {
        await tx.horarioFuncionamento.deleteMany({ where: { apoioId: id } });
        await tx.horarioFuncionamento.createMany({
          data: input.horarios.map((item) => ({
            apoioId: id,
            diaSemana: item.diaSemana,
            horarioInicio: time(item.horarioInicio),
            horarioFim: time(item.horarioFim),
          })),
        });
      }
    });
    return (await this.findById(id))!;
  }
  async addImagem(apoioId: string, objectKey: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const last = await tx.apoioImagem.findFirst({
        where: { apoioId },
        orderBy: { ordem: 'desc' },
        select: { ordem: true },
      });
      await tx.apoioImagem.create({
        data: { apoioId, objectKey, ordem: (last?.ordem ?? -1) + 1 },
      });
    });
  }
  async findImagemObjectKey(
    apoioId: string,
    imagemId: string,
  ): Promise<string | null> {
    const image = await this.prisma.apoioImagem.findFirst({
      where: { id: imagemId, apoioId },
      select: { objectKey: true },
    });
    return image?.objectKey ?? null;
  }
  async replaceImagem(
    apoioId: string,
    imagemId: string,
    objectKey: string,
  ): Promise<void> {
    await this.prisma.apoioImagem.updateMany({
      where: { id: imagemId, apoioId },
      data: { objectKey },
    });
  }
  async removeImagem(
    apoioId: string,
    imagemId: string,
  ): Promise<string | null> {
    return this.prisma.$transaction(async (tx) => {
      const image = await tx.apoioImagem.findFirst({
        where: { id: imagemId, apoioId },
        select: { objectKey: true },
      });
      if (!image) return null;
      await tx.apoioImagem.delete({ where: { id: imagemId } });
      return image.objectKey;
    });
  }
  async deactivateAndRemoveImagens(id: string): Promise<string[]> {
    return this.prisma.$transaction(async (tx) => {
      const imagens = await tx.apoioImagem.findMany({
        where: { apoioId: id },
        select: { objectKey: true },
      });
      await tx.apoio.update({
        where: { id },
        data: { statusAdministrativo: 'DESATIVADO' },
      });
      await tx.apoioImagem.deleteMany({ where: { apoioId: id } });
      return imagens.map((image) => image.objectKey);
    });
  }
  private async toPublic(
    record: ApoioRecord,
    latitude?: number,
    longitude?: number,
  ): Promise<PublicApoio> {
    const endereco = await this.address(record.endereco.id);
    const horarios: HorarioApoio[] = record.horariosFuncionamento.map(
      (item) => ({
        diaSemana: item.diaSemana,
        horarioInicio: formatTime(item.horarioInicio),
        horarioFim: formatTime(item.horarioFim),
      }),
    );
    const distance =
      latitude === undefined || longitude === undefined
        ? undefined
        : await this.distanceKm(record.endereco.id, latitude, longitude);
    const imagens = await Promise.all(
      record.imagens.map(async (item) => ({
        id: item.id,
        url: await this.storage.getTemporaryUrl(item.objectKey),
        ordem: item.ordem,
      })),
    );
    return {
      id: record.id,
      nome: record.nome,
      tipoApoio: record.tipoApoio,
      telefone: record.telefone,
      descricao: record.descricao ?? '',
      status: record.statusAdministrativo,
      endereco,
      horarios,
      imagensUrl: imagens.map((imagem) => imagem.url),
      imagens,
      dataCriacao: record.dataCriacao,
      dataAtualizacao: record.dataAtualizacao,
      estaAbertoAgora: isOpenNow(horarios),
      ...(distance === undefined ? {} : { distanciaKm: distance }),
    };
  }
  private async address(id: string): Promise<EnderecoApoio> {
    const rows = await this.prisma.$queryRaw<
      AddressRow[]
    >`SELECT "id", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado", ST_Y("localizacao_postgis") AS "latitude", ST_X("localizacao_postgis") AS "longitude" FROM "endereco" WHERE "id" = ${id}::uuid`;
    const row = rows[0];
    return row;
  }
  private async distanceKm(
    id: string,
    latitude: number,
    longitude: number,
  ): Promise<number> {
    const rows = await this.prisma.$queryRaw<
      { distance: number }[]
    >`SELECT ST_DistanceSphere("localizacao_postgis", ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)) / 1000 AS "distance" FROM "endereco" WHERE "id" = ${id}::uuid`;
    return Number(rows[0].distance.toFixed(2));
  }
  private async insertAddress(
    tx: Prisma.TransactionClient,
    id: string,
    address: EnderecoApoio,
  ): Promise<void> {
    await tx.$executeRaw`INSERT INTO "endereco" ("id", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado", "localizacao_postgis") VALUES (${id}::uuid, ${address.cep}, ${address.logradouro}, ${address.numero}, ${address.complemento}, ${address.bairro}, ${address.cidade}, ${address.estado}, ST_SetSRID(ST_MakePoint(${address.longitude}, ${address.latitude}), 4326))`;
  }
  private async updateAddress(
    tx: Prisma.TransactionClient,
    id: string,
    address: EnderecoApoio,
  ): Promise<void> {
    await tx.$executeRaw`UPDATE "endereco" SET "cep"=${address.cep}, "logradouro"=${address.logradouro}, "numero"=${address.numero}, "complemento"=${address.complemento}, "bairro"=${address.bairro}, "cidade"=${address.cidade}, "estado"=${address.estado}, "localizacao_postgis"=ST_SetSRID(ST_MakePoint(${address.longitude}, ${address.latitude}), 4326) WHERE "id"=${id}::uuid`;
  }
}
function time(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}
function formatTime(value: Date) {
  return value.toISOString().slice(11, 16);
}
