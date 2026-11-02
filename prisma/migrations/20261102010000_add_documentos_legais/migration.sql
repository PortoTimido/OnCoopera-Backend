-- CreateTable
CREATE TABLE "documento_legal" (
    "id" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "versao" VARCHAR(5) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documento_legal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aceite_documento" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "documento_id" UUID NOT NULL,
    "aceito_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aceite_documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aceite_documento_usuario_id_idx" ON "aceite_documento"("usuario_id");

-- CreateIndex
CREATE INDEX "aceite_documento_documento_id_idx" ON "aceite_documento"("documento_id");

-- AddForeignKey
ALTER TABLE "aceite_documento" ADD CONSTRAINT "aceite_documento_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aceite_documento" ADD CONSTRAINT "aceite_documento_documento_id_fkey"
FOREIGN KEY ("documento_id") REFERENCES "documento_legal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
