-- CreateIndex
CREATE UNIQUE INDEX "aceite_documento_usuario_id_documento_id_key"
ON "aceite_documento"("usuario_id", "documento_id");
