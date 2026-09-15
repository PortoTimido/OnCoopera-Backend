import { Prisma } from '../../generated/prisma/client.js';
import {
  RegistroDiario,
  type PublicRegistroDiario,
  type PublicRegistroSintoma,
} from '../../domain/diario-sintomas/entities/registro-diario.entity.js';
import { DiarioSintomasApplicationError } from '../../application/diario-sintomas/errors/diario-sintomas-application.error.js';
import type {
  DiarioSintomasRepository,
  PaginatedRegistrosDiarios,
  SaveRegistroDiarioInput,
} from '../../application/diario-sintomas/ports/diario-sintomas.repository.js';
import { PrismaService } from '../database/prisma.service.js';

const includeSintomas = { sintomas: { orderBy: { id: 'asc' } } } as const;
type RegistroPersistence = {
  id: string;
  pacienteId: string;
  dataRegistro: Date;
  dataHora: Date;
  humor: string;
  notaVozUrl: string | null;
  sintomas: Array<{
    id: string;
    sintomaTipo: string;
    intensidade: number;
    descricaoOutro: string | null;
  }>;
};

export class PrismaDiarioSintomasRepository implements DiarioSintomasRepository {
  constructor(private readonly prisma: PrismaService) {}
  async listByPaciente(
    pacienteId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedRegistrosDiarios> {
    const where = { pacienteId };
    const [total, records] = await this.prisma.$transaction([
      this.prisma.registroDiario.count({ where }),
      this.prisma.registroDiario.findMany({
        where,
        include: includeSintomas,
        orderBy: [{ dataRegistro: 'desc' }, { dataHora: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data: records.map((item) => this.toPublic(item)),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  async findByIdAndPaciente(
    id: string,
    pacienteId: string,
  ): Promise<PublicRegistroDiario | null> {
    const record = await this.prisma.registroDiario.findFirst({
      where: { id, pacienteId },
      include: includeSintomas,
    });
    return record === null ? null : this.toPublic(record);
  }
  async findByPacienteAndDate(
    pacienteId: string,
    dataRegistro: Date,
  ): Promise<PublicRegistroDiario | null> {
    const record = await this.prisma.registroDiario.findUnique({
      where: { pacienteId_dataRegistro: { pacienteId, dataRegistro } },
      include: includeSintomas,
    });
    return record === null ? null : this.toPublic(record);
  }
  async save(input: SaveRegistroDiarioInput): Promise<PublicRegistroDiario> {
    try {
      const record = await this.prisma.registroDiario.upsert({
        where: {
          pacienteId_dataRegistro: {
            pacienteId: input.pacienteId,
            dataRegistro: input.dataRegistro,
          },
        },
        create: {
          pacienteId: input.pacienteId,
          dataRegistro: input.dataRegistro,
          dataHora: input.dataHora,
          humor: input.humor,
          notaVozUrl: input.notaVozUrl,
          sintomas: { create: input.sintomas.map(toSintomaData) },
        },
        update: {
          dataHora: input.dataHora,
          humor: input.humor,
          notaVozUrl: input.notaVozUrl,
          sintomas: {
            deleteMany: {},
            create: input.sintomas.map(toSintomaData),
          },
        },
        include: includeSintomas,
      });
      return this.toPublic(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      )
        throw new DiarioSintomasApplicationError(
          'NOT_FOUND',
          'Paciente não encontrado.',
        );
      throw error;
    }
  }
  private toPublic(record: RegistroPersistence): PublicRegistroDiario {
    return RegistroDiario.create({
      id: record.id,
      pacienteId: record.pacienteId,
      dataRegistro: record.dataRegistro,
      dataHora: record.dataHora,
      humor: record.humor as PublicRegistroDiario['humor'],
      notaVozUrl: record.notaVozUrl,
      sintomas: record.sintomas.map((item): PublicRegistroSintoma => ({
        id: item.id,
        tipo: item.sintomaTipo as PublicRegistroSintoma['tipo'],
        intensidade: item.intensidade,
        descricaoOutro: item.descricaoOutro,
      })),
    }).toPublic();
  }
}
function toSintomaData(item: SaveRegistroDiarioInput['sintomas'][number]) {
  return {
    sintomaTipo: item.tipo,
    intensidade: item.intensidade,
    descricaoOutro: item.descricaoOutro?.trim() ?? null,
  };
}
