-- CreateTable
CREATE TABLE "sessao_autenticacao" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "csrf_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessao_autenticacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessao_autenticacao_refresh_token_hash_key" ON "sessao_autenticacao"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessao_autenticacao_usuario_id_idx" ON "sessao_autenticacao"("usuario_id");

-- CreateIndex
CREATE INDEX "sessao_autenticacao_expires_at_idx" ON "sessao_autenticacao"("expires_at");

-- AddForeignKey
ALTER TABLE "sessao_autenticacao" ADD CONSTRAINT "sessao_autenticacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
