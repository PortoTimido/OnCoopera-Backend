ALTER TABLE "artigo" RENAME COLUMN "imagem_url" TO "imagem_object_key";
ALTER TABLE "apoio_imagem" RENAME COLUMN "imagem_url" TO "object_key";

-- URLs antigas nÃ£o sÃ£o chaves de objetos e nÃ£o podem ser expostas como se
-- fossem arquivos privados. Novos uploads passam a preencher apenas chaves.
UPDATE "artigo"
SET "imagem_object_key" = NULL
WHERE "imagem_object_key" LIKE 'http://%' OR "imagem_object_key" LIKE 'https://%';

DELETE FROM "apoio_imagem"
WHERE "object_key" LIKE 'http://%' OR "object_key" LIKE 'https://%';
