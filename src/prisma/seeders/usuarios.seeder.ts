import { Prisma } from '../../generated/prisma/client.js';

const nomes = [
  'Ana Beatriz Alves', 'Bruno Costa', 'Camila Ferreira', 'Daniel Gomes',
  'Elisa Martins', 'Felipe Rocha', 'Gabriela Souza', 'Heitor Lima',
  'Isabela Nunes', 'Joao Pedro Silva', 'Karina Barros', 'Lucas Ribeiro',
  'Mariana Dias', 'Nicolas Freitas', 'Olivia Teixeira', 'Paulo Henrique',
  'Quezia Araujo', 'Rafael Mendes', 'Sofia Carvalho', 'Tiago Moreira',
] as const;

export async function seedUsuarios(
  tx: Prisma.TransactionClient,
  senhaHash: string,
): Promise<void> {
  for (const [index, nome] of nomes.entries()) {
    const sequence = String(index + 1).padStart(2, '0');
    const usuarioId = `10000000-0000-4000-8000-0000000000${sequence}`;
    const enderecoId = `11000000-0000-4000-8000-0000000000${sequence}`;
    const email = `paciente.${sequence}@oncoopera.local`;
    const login = `paciente.${sequence}`;

    await tx.$executeRaw`
      INSERT INTO "endereco" ("id", "cep", "logradouro", "numero", "complemento", "bairro", "cidade", "estado", "localizacao_postgis")
      VALUES (${enderecoId}::uuid, ${`010${sequence}-000`}, ${'Rua da Cooperacao'}, ${String(index + 10)}, ${index % 3 === 0 ? 'Apto. 12' : null}, ${'Bela Vista'}, ${'Sao Paulo'}, ${'SP'}, ST_SetSRID(ST_MakePoint(${-46.63 + index * 0.008}, ${-23.55 + index * 0.004}), 4326))
      ON CONFLICT ("id") DO UPDATE SET
        "cep" = EXCLUDED."cep", "logradouro" = EXCLUDED."logradouro", "numero" = EXCLUDED."numero", "complemento" = EXCLUDED."complemento", "bairro" = EXCLUDED."bairro", "cidade" = EXCLUDED."cidade", "estado" = EXCLUDED."estado", "localizacao_postgis" = EXCLUDED."localizacao_postgis";
    `;

    const usuario = await tx.usuario.upsert({
      where: { login },
      create: {
        id: usuarioId,
        nome,
        email,
        login,
        senhaHash,
        telefone: `1198000${String(index + 1).padStart(4, '0')}`,
        dataNascimento: new Date(1980 + (index % 20), index % 12, index + 1),
        status: index === 18 ? 'INATIVO' : index === 19 ? 'BLOQUEADO' : 'ATIVO',
        trocaSenhaObrigatoria: true,
      },
      update: {
        nome,
        email,
        telefone: `1198000${String(index + 1).padStart(4, '0')}`,
        dataNascimento: new Date(1980 + (index % 20), index % 12, index + 1),
        status: index === 18 ? 'INATIVO' : index === 19 ? 'BLOQUEADO' : 'ATIVO',
        trocaSenhaObrigatoria: true,
      },
    });

    await tx.paciente.upsert({
      where: { usuarioId: usuario.id },
      create: { usuarioId: usuario.id, enderecoId },
      update: { enderecoId },
    });
  }
}
