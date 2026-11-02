-- CreateIndex
CREATE UNIQUE INDEX "documento_legal_tipo_key" ON "documento_legal"("tipo");

-- AddConstraint
ALTER TABLE "documento_legal"
ADD CONSTRAINT "documento_legal_tipo_check"
CHECK ("tipo" IN ('TERMOS_USO', 'POLITICA_PRIVACIDADE'));
