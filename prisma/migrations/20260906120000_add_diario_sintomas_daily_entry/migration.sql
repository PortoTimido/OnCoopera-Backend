ALTER TABLE "registro_diario" ADD COLUMN "data_registro" DATE;
UPDATE "registro_diario" SET "data_registro" = "data_hora"::date WHERE "data_registro" IS NULL;
ALTER TABLE "registro_diario" ALTER COLUMN "data_registro" SET NOT NULL;
ALTER TABLE "registro_diario" ADD CONSTRAINT "registro_diario_paciente_id_data_registro_key" UNIQUE ("paciente_id", "data_registro");
ALTER TABLE "registro_sintoma" ADD COLUMN "descricao_outro" TEXT;
