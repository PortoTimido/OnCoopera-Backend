CREATE TYPE "StatusEmailEnvio" AS ENUM ('PENDENTE', 'ENVIADO', 'FALHOU');

ALTER TABLE "usuario" ADD COLUMN "senha_temporaria_expira_em" TIMESTAMP(3);

CREATE TABLE "recuperacao_senha" (
  "id" UUID NOT NULL,
  "usuario_id" UUID NOT NULL,
  "codigo_hash" TEXT NOT NULL,
  "expira_em" TIMESTAMP(3) NOT NULL,
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "bloqueado_em" TIMESTAMP(3),
  "codigo_validado_em" TIMESTAMP(3),
  "reset_token_hash" TEXT,
  "reset_token_expira_em" TIMESTAMP(3),
  "token_utilizado_em" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recuperacao_senha_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "recuperacao_senha_usuario_id_criado_em_idx" ON "recuperacao_senha"("usuario_id", "criado_em");
ALTER TABLE "recuperacao_senha" ADD CONSTRAINT "recuperacao_senha_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "limite_recuperacao_senha" (
  "id" UUID NOT NULL,
  "email_hash" TEXT NOT NULL,
  "ip_hash" TEXT NOT NULL,
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "limite_recuperacao_senha_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "limite_recuperacao_senha_email_hash_criado_em_idx" ON "limite_recuperacao_senha"("email_hash", "criado_em");
CREATE INDEX "limite_recuperacao_senha_ip_hash_criado_em_idx" ON "limite_recuperacao_senha"("ip_hash", "criado_em");

CREATE TABLE "email_envio" (
  "id" UUID NOT NULL,
  "tipo" TEXT NOT NULL,
  "destinatario_mascarado" TEXT NOT NULL,
  "status" "StatusEmailEnvio" NOT NULL DEFAULT 'PENDENTE',
  "tentativas" INTEGER NOT NULL DEFAULT 0,
  "erro_codigo" TEXT,
  "enviado_em" TIMESTAMP(3),
  "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_envio_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "email_envio_tipo_criado_em_idx" ON "email_envio"("tipo", "criado_em");
