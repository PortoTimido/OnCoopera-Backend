import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const perfisAdministrativos = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nome: 'TOTAL',
    descricao: 'Acesso administrativo total ao backoffice.',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nome: 'MODERADOR_DE_CONTEUDO',
    descricao: 'Moderação de conteúdo editorial.',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    nome: 'GERENTE_DE_APOIOS',
    descricao: 'Gestão de apoios, clínicas, ONGs e serviços.',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    nome: 'ANALISTA_DE_INTERACOES',
    descricao: 'Consulta e análise de interações operacionais.',
  },
] as const;

const adminSeed = {
  nome: process.env.ADMIN_SEED_NAME ?? 'Henrique Carvalho',
  email: process.env.ADMIN_SEED_EMAIL ?? 'henrique.carvalho@oncoopera.local',
  login: process.env.ADMIN_SEED_LOGIN ?? 'henrique.carvalho',
  telefone: process.env.ADMIN_SEED_PHONE ?? '11999999999',
  dataNascimento: new Date(process.env.ADMIN_SEED_BIRTH_DATE ?? '1990-01-01'),
  senha: process.env.ADMIN_SEED_PASSWORD ?? 'Admin@123',
};

function parseSaltRounds(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '12', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
}

async function main(): Promise<void> {
  if (process.env.DATABASE_URL === undefined) {
    throw new Error(
      'DATABASE_URL deve estar configurada para executar o seed.',
    );
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  const senhaHash = await bcrypt.hash(
    adminSeed.senha,
    parseSaltRounds(process.env.BCRYPT_SALT_ROUNDS),
  );

  try {
    await prisma.$transaction(async (tx) => {
      for (const perfil of perfisAdministrativos) {
        await tx.perfilAdministrativo.upsert({
          where: { nome: perfil.nome },
          create: perfil,
          update: { descricao: perfil.descricao },
        });
      }

      const usuario = await tx.usuario.upsert({
        where: { login: adminSeed.login },
        create: {
          nome: adminSeed.nome,
          email: adminSeed.email.toLowerCase(),
          login: adminSeed.login,
          senhaHash,
          telefone: adminSeed.telefone,
          dataNascimento: adminSeed.dataNascimento,
          status: 'ATIVO',
          trocaSenhaObrigatoria: true,
        },
        update: {
          nome: adminSeed.nome,
          email: adminSeed.email.toLowerCase(),
          telefone: adminSeed.telefone,
          dataNascimento: adminSeed.dataNascimento,
          status: 'ATIVO',
        },
      });

      await tx.administrador.upsert({
        where: { usuarioId: usuario.id },
        create: { usuarioId: usuario.id },
        update: {},
      });

      const perfis = await tx.perfilAdministrativo.findMany({
        where: {
          nome: {
            in: perfisAdministrativos.map((perfil) => perfil.nome),
          },
        },
        select: { id: true },
      });

      await tx.administradorPerfil.createMany({
        data: perfis.map((perfil) => ({
          administradorId: usuario.id,
          perfilId: perfil.id,
        })),
        skipDuplicates: true,
      });
    });
  } finally {
    await prisma.$disconnect();
  }
}

await main();
