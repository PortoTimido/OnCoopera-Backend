import { Prisma } from '../../generated/prisma/client.js';

const apoios = [
  ['Casa Acolher', 'CASA_APOIO'],
  ['Instituto Viver Bem', 'ONG'],
  ['Clinica Esperanca', 'CLINICA'],
  ['Transporte Solidario', 'TRANSPORTE'],
  ['Psicologia em Rede', 'PSICOLOGO'],
  ['Casa Recomeçar', 'CASA_APOIO'],
  ['Associacao Bracos Abertos', 'ONG'],
  ['Clinica Horizonte', 'CLINICA'],
  ['Vai Comigo', 'TRANSPORTE'],
  ['Escuta Psicologica', 'PSICOLOGO'],
  ['Casa do Cuidado', 'CASA_APOIO'],
  ['Instituto Florescer', 'ONG'],
  ['Clinica Vida Plena', 'CLINICA'],
  ['Rota de Apoio', 'TRANSPORTE'],
  ['Espaco Acolhimento', 'PSICOLOGO'],
  ['Lar de Passagem', 'CASA_APOIO'],
  ['ONG Caminhos', 'ONG'],
  ['Clinica Integrar', 'CLINICA'],
  ['Mobilidade Amiga', 'TRANSPORTE'],
  ['Nucleo de Escuta', 'PSICOLOGO'],
] as const;

export async function seedApoios(tx: Prisma.TransactionClient): Promise<void> {
  for (const [index, [nome, tipoApoio]] of apoios.entries()) {
    const sequence = String(index + 1).padStart(2, '0');
    const id = `30000000-0000-4000-8000-0000000000${sequence}`;
    const enderecoId = `31000000-0000-4000-8000-0000000000${sequence}`;
    const statusAdministrativo =
      index === 18 ? 'RASCUNHO' : index === 19 ? 'DESATIVADO' : 'ATIVO';

    await tx.$executeRaw`
      INSERT INTO "endereco" ("id", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado", "localizacao_postgis")
      VALUES (${enderecoId}::uuid, ${`013${sequence}-000`}, ${'Avenida Paulista'}, ${String(100 + index * 10)}, ${null}, ${'Bela Vista'}, ${'Sao Paulo'}, ${'SP'}, ST_SetSRID(ST_MakePoint(${-46.65 + index * 0.006}, ${-23.56 + index * 0.003}), 4326))
      ON CONFLICT ("id") DO UPDATE SET "localizacao_postgis" = EXCLUDED."localizacao_postgis";
    `;
    await tx.apoio.upsert({
      where: { id },
      create: {
        id,
        enderecoId,
        nome,
        tipoApoio,
        telefone: `113000${String(index + 1).padStart(4, '0')}`,
        descricao: `Servico de ${nome} para pessoas em tratamento e seus familiares.`,
        statusAdministrativo,
      },
      update: {
        enderecoId,
        nome,
        tipoApoio,
        telefone: `113000${String(index + 1).padStart(4, '0')}`,
        descricao: `Servico de ${nome} para pessoas em tratamento e seus familiares.`,
        statusAdministrativo,
      },
    });
    await tx.horarioFuncionamento.createMany({
      data: [1, 2, 3, 4, 5].map((diaSemana) => ({
        apoioId: id,
        diaSemana,
        horarioInicio: new Date('1970-01-01T09:00:00.000Z'),
        horarioFim: new Date('1970-01-01T18:00:00.000Z'),
      })),
      skipDuplicates: true,
    });
  }
}
