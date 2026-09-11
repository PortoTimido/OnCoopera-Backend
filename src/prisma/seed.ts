import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { seedApoios } from './seeders/apoios.seeder.js';
import { seedArtigos } from './seeders/artigos.seeder.js';
import { seedUsuarios } from './seeders/usuarios.seeder.js';

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

      await tx.administradorPermissao.upsert({
        where: {
          administradorId_permissao: {
            administradorId: usuario.id,
            permissao: 'TOTAL',
          },
        },
        create: { administradorId: usuario.id, permissao: 'TOTAL' },
        update: {},
      });

      await seedUsuarios(tx, senhaHash);
      await seedArtigos(tx, usuario.id);
      await seedApoios(tx);
    });
  } finally {
    await prisma.$disconnect();
  }
}

await main();
