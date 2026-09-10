import { Prisma } from '../../generated/prisma/client.js';

const categorias = ['Diagnostico', 'Tratamento', 'Bem-estar', 'Direitos', 'Alimentacao'] as const;
const tags = ['apoio', 'autocuidado', 'familia', 'prevencao', 'qualidade de vida'] as const;
const temas = [
  'Como organizar a rotina apos o diagnostico', 'Perguntas importantes para sua consulta',
  'Rede de apoio: como pedir e aceitar ajuda', 'Alimentacao durante o tratamento',
  'Saude emocional e acolhimento', 'Entendendo os efeitos colaterais',
  'Direitos da pessoa em tratamento', 'Atividade fisica com seguranca',
  'Como conversar com criancas sobre a doenca', 'Planejamento para os dias de consulta',
  'Sono e descanso: pequenos cuidados diarios', 'A importancia do acompanhamento psicologico',
  'Cuidados com a pele durante o tratamento', 'Relacoes afetivas e autoestima',
  'Como preparar uma mala para internacao', 'Exames: como se preparar e tirar duvidas',
  'Financas e tratamento: onde buscar orientacao', 'Receitas praticas para dias dificeis',
  'Lidando com a ansiedade antes dos resultados', 'Celebrando pequenas conquistas no caminho',
] as const;

export async function seedArtigos(
  tx: Prisma.TransactionClient,
  autorId: string,
): Promise<void> {
  const categoriaRecords = await Promise.all(
    categorias.map((nome) => tx.categoria.upsert({ where: { nome }, create: { nome }, update: {} })),
  );
  const tagRecords = await Promise.all(
    tags.map((nome) => tx.tag.upsert({ where: { nome }, create: { nome }, update: {} })),
  );

  for (const [index, titulo] of temas.entries()) {
    const sequence = String(index + 1).padStart(2, '0');
    const id = `20000000-0000-4000-8000-0000000000${sequence}`;
    const status = index === 18 ? 'RASCUNHO' : index === 19 ? 'DESATIVADO' : 'PUBLICADO';
    const categoriaId = categoriaRecords[index % categoriaRecords.length]!.id;
    const tagId = tagRecords[index % tagRecords.length]!.id;
    const dataPublicacao = status === 'PUBLICADO' ? new Date(2026, 0, index + 1) : null;
    const conteudo = `Este artigo apresenta orientacoes iniciais sobre ${titulo.toLowerCase()}. Cada pessoa vivencia o tratamento de forma unica; converse sempre com sua equipe de saude para decidir os proximos passos.`;

    await tx.artigo.upsert({
      where: { id },
      create: {
        id, autorId, titulo, conteudo, tempoLeituraMinutos: 3 + (index % 5),
        imagemUrl: `https://images.oncoopera.local/artigos/${sequence}.jpg`, status, dataPublicacao,
        categorias: { create: { categoriaId } }, tags: { create: { tagId } },
      },
      update: { autorId, titulo, conteudo, tempoLeituraMinutos: 3 + (index % 5), imagemUrl: `https://images.oncoopera.local/artigos/${sequence}.jpg`, status, dataPublicacao },
    });
    await tx.artigoCategoria.createMany({ data: [{ artigoId: id, categoriaId }], skipDuplicates: true });
    await tx.artigoTag.createMany({ data: [{ artigoId: id, tagId }], skipDuplicates: true });
  }
}
