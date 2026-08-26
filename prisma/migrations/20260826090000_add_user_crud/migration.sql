ALTER TABLE "usuario"
ADD COLUMN "troca_senha_obrigatoria" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "perfil_administrativo" ("id", "nome", "descricao")
VALUES
  ('00000000-0000-4000-8000-000000000001', 'TOTAL', 'Acesso administrativo total ao backoffice.'),
  ('00000000-0000-4000-8000-000000000002', 'MODERADOR_DE_CONTEUDO', 'Moderação de conteúdo editorial.'),
  ('00000000-0000-4000-8000-000000000003', 'GERENTE_DE_APOIOS', 'Gestão de apoios, clínicas, ONGs e serviços.'),
  ('00000000-0000-4000-8000-000000000004', 'ANALISTA_DE_INTERACOES', 'Consulta e análise de interações operacionais.')
ON CONFLICT ("nome") DO UPDATE
SET "descricao" = EXCLUDED."descricao";
