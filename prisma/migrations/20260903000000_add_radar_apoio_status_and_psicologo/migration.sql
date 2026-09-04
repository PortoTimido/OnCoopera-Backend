ALTER TYPE "TipoApoio" ADD VALUE IF NOT EXISTS 'PSICOLOGO';

CREATE TYPE "StatusApoio" AS ENUM ('RASCUNHO', 'ATIVO', 'DESATIVADO');

ALTER TABLE "apoio"
  ALTER COLUMN "descricao" DROP NOT NULL,
  ALTER COLUMN "status_administrativo" DROP DEFAULT,
  ALTER COLUMN "status_administrativo" TYPE "StatusApoio"
    USING CASE
      WHEN "status_administrativo" = 'ATIVO' THEN 'ATIVO'::"StatusApoio"
      WHEN "status_administrativo" = 'DESATIVADO' THEN 'DESATIVADO'::"StatusApoio"
      ELSE 'RASCUNHO'::"StatusApoio"
    END;

CREATE INDEX "endereco_localizacao_postgis_gist_idx"
  ON "endereco" USING GIST ("localizacao_postgis");
