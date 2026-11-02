-- CreateEnum
CREATE TYPE "provedor_identidade_externa" AS ENUM ('GOOGLE');

-- CreateTable
CREATE TABLE "identidade_externa" (
    "provedor" "provedor_identidade_externa" NOT NULL,
    "subject" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "vinculada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identidade_externa_pkey" PRIMARY KEY ("provedor", "subject")
);

-- CreateIndex
CREATE UNIQUE INDEX "identidade_externa_usuario_id_provedor_key"
ON "identidade_externa"("usuario_id", "provedor");

-- AddForeignKey
ALTER TABLE "identidade_externa"
ADD CONSTRAINT "identidade_externa_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
