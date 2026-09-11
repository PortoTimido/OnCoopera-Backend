-- Substitui o modelo de perfis administrativos (perfil_administrativo /
-- administrador_perfil) por permissões administrativas granulares.
--
-- Mapeamento de dados legados para as novas permissões:
--   TOTAL                   -> TOTAL
--   MODERADOR_DE_CONTEUDO   -> GESTAO_CONTEUDOS
--   GERENTE_DE_APOIOS       -> GESTAO_RADAR_APOIO
--   ANALISTA_DE_INTERACOES  -> (sem equivalente) nenhuma permissão é atribuída.
--     Decisão: o novo modelo não possui uma permissão de apenas leitura /
--     análise de interações operacionais. Administradores que possuíam
--     exclusivamente esse perfil ficam sem nenhuma permissão administrativa
--     após a migração e precisam ser revisados manualmente por um
--     administrador TOTAL, que deve conceder as permissões granulares
--     apropriadas (ex.: GERENCIAR_USUARIOS, GESTAO_CONTEUDOS ou
--     GESTAO_RADAR_APOIO) conforme a necessidade real de cada usuário.

-- CreateEnum
CREATE TYPE "permissao_administrativa" AS ENUM (
  'TOTAL',
  'GERENCIAR_USUARIOS',
  'GESTAO_CONTEUDOS',
  'GESTAO_RADAR_APOIO'
);

-- CreateTable
CREATE TABLE "administrador_permissao" (
    "administrador_id" UUID NOT NULL,
    "permissao" "permissao_administrativa" NOT NULL,

    CONSTRAINT "administrador_permissao_pkey" PRIMARY KEY ("administrador_id","permissao")
);

-- AddForeignKey
ALTER TABLE "administrador_permissao" ADD CONSTRAINT "administrador_permissao_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "administrador"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy profile assignments into the new permission table.
INSERT INTO "administrador_permissao" ("administrador_id", "permissao")
SELECT DISTINCT
  ap."administrador_id",
  CASE pa."nome"
    WHEN 'TOTAL' THEN 'TOTAL'
    WHEN 'MODERADOR_DE_CONTEUDO' THEN 'GESTAO_CONTEUDOS'
    WHEN 'GERENTE_DE_APOIOS' THEN 'GESTAO_RADAR_APOIO'
  END::"permissao_administrativa"
FROM "administrador_perfil" ap
JOIN "perfil_administrativo" pa ON pa."id" = ap."perfil_id"
WHERE pa."nome" IN ('TOTAL', 'MODERADOR_DE_CONTEUDO', 'GERENTE_DE_APOIOS')
ON CONFLICT ("administrador_id", "permissao") DO NOTHING;

-- TOTAL is exclusive in the new model: an administrator who held TOTAL
-- alongside other legacy profiles keeps only TOTAL after the migration.
DELETE FROM "administrador_permissao"
WHERE "permissao" <> 'TOTAL'
  AND "administrador_id" IN (
    SELECT "administrador_id" FROM "administrador_permissao" WHERE "permissao" = 'TOTAL'
  );

-- DropTable (legacy profile model, superseded by administrador_permissao)
DROP TABLE "administrador_perfil";
DROP TABLE "perfil_administrativo";
