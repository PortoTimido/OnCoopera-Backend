-- EnableExtension
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "StatusUsuario" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoApoio" AS ENUM ('ONG', 'CLINICA', 'TRANSPORTE', 'CASA_APOIO');

-- CreateEnum
CREATE TYPE "StatusArtigo" AS ENUM ('RASCUNHO', 'PUBLICADO', 'DESATIVADO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "status" "StatusUsuario" NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "ultimo_acesso" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paciente" (
    "usuario_id" UUID NOT NULL,
    "endereco_id" UUID NOT NULL,

    CONSTRAINT "paciente_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "administrador" (
    "usuario_id" UUID NOT NULL,

    CONSTRAINT "administrador_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "perfil_administrativo" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "perfil_administrativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrador_perfil" (
    "administrador_id" UUID NOT NULL,
    "perfil_id" UUID NOT NULL,

    CONSTRAINT "administrador_perfil_pkey" PRIMARY KEY ("administrador_id","perfil_id")
);

-- CreateTable
CREATE TABLE "endereco" (
    "id" UUID NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "localizacao_postgis" geometry(Point, 4326) NOT NULL,

    CONSTRAINT "endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_diario" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "humor" TEXT NOT NULL,
    "nota_voz_url" TEXT,

    CONSTRAINT "registro_diario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_sintoma" (
    "id" UUID NOT NULL,
    "registro_diario_id" UUID NOT NULL,
    "sintoma_tipo" TEXT NOT NULL,
    "intensidade" INTEGER NOT NULL,

    CONSTRAINT "registro_sintoma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "medico_nome" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "status_consulta" TEXT NOT NULL,
    "observacao" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apoio" (
    "id" UUID NOT NULL,
    "endereco_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo_apoio" "TipoApoio" NOT NULL,
    "telefone" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status_administrativo" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apoio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horario_funcionamento" (
    "id" UUID NOT NULL,
    "apoio_id" UUID NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "horario_inicio" TIME(0) NOT NULL,
    "horario_fim" TIME(0) NOT NULL,

    CONSTRAINT "horario_funcionamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apoio_imagem" (
    "id" UUID NOT NULL,
    "apoio_id" UUID NOT NULL,
    "imagem_url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "apoio_imagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artigo" (
    "id" UUID NOT NULL,
    "autor_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tempo_leitura_minutos" INTEGER NOT NULL,
    "imagem_url" TEXT,
    "status" "StatusArtigo" NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "data_publicacao" TIMESTAMP(3),

    CONSTRAINT "artigo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artigo_categoria" (
    "artigo_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,

    CONSTRAINT "artigo_categoria_pkey" PRIMARY KEY ("artigo_id","categoria_id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artigo_tag" (
    "artigo_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "artigo_tag_pkey" PRIMARY KEY ("artigo_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE INDEX "paciente_endereco_id_idx" ON "paciente"("endereco_id");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_administrativo_nome_key" ON "perfil_administrativo"("nome");

-- CreateIndex
CREATE INDEX "administrador_perfil_perfil_id_idx" ON "administrador_perfil"("perfil_id");

-- CreateIndex
CREATE INDEX "registro_diario_paciente_id_idx" ON "registro_diario"("paciente_id");

-- CreateIndex
CREATE INDEX "registro_sintoma_registro_diario_id_idx" ON "registro_sintoma"("registro_diario_id");

-- CreateIndex
CREATE INDEX "consulta_paciente_id_idx" ON "consulta"("paciente_id");

-- CreateIndex
CREATE INDEX "apoio_endereco_id_idx" ON "apoio"("endereco_id");

-- CreateIndex
CREATE INDEX "horario_funcionamento_apoio_id_idx" ON "horario_funcionamento"("apoio_id");

-- CreateIndex
CREATE UNIQUE INDEX "horario_funcionamento_apoio_id_dia_semana_horario_inicio_ho_key" ON "horario_funcionamento"("apoio_id", "dia_semana", "horario_inicio", "horario_fim");

-- CreateIndex
CREATE INDEX "apoio_imagem_apoio_id_idx" ON "apoio_imagem"("apoio_id");

-- CreateIndex
CREATE UNIQUE INDEX "apoio_imagem_apoio_id_ordem_key" ON "apoio_imagem"("apoio_id", "ordem");

-- CreateIndex
CREATE INDEX "artigo_autor_id_idx" ON "artigo"("autor_id");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nome_key" ON "categoria"("nome");

-- CreateIndex
CREATE INDEX "artigo_categoria_categoria_id_idx" ON "artigo_categoria"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_nome_key" ON "tag"("nome");

-- CreateIndex
CREATE INDEX "artigo_tag_tag_id_idx" ON "artigo_tag"("tag_id");

-- AddForeignKey
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente" ADD CONSTRAINT "paciente_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "endereco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrador" ADD CONSTRAINT "administrador_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrador_perfil" ADD CONSTRAINT "administrador_perfil_administrador_id_fkey" FOREIGN KEY ("administrador_id") REFERENCES "administrador"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrador_perfil" ADD CONSTRAINT "administrador_perfil_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil_administrativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_diario" ADD CONSTRAINT "registro_diario_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_sintoma" ADD CONSTRAINT "registro_sintoma_registro_diario_id_fkey" FOREIGN KEY ("registro_diario_id") REFERENCES "registro_diario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta" ADD CONSTRAINT "consulta_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "paciente"("usuario_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apoio" ADD CONSTRAINT "apoio_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "endereco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario_funcionamento" ADD CONSTRAINT "horario_funcionamento_apoio_id_fkey" FOREIGN KEY ("apoio_id") REFERENCES "apoio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apoio_imagem" ADD CONSTRAINT "apoio_imagem_apoio_id_fkey" FOREIGN KEY ("apoio_id") REFERENCES "apoio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigo" ADD CONSTRAINT "artigo_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "administrador"("usuario_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigo_categoria" ADD CONSTRAINT "artigo_categoria_artigo_id_fkey" FOREIGN KEY ("artigo_id") REFERENCES "artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigo_categoria" ADD CONSTRAINT "artigo_categoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigo_tag" ADD CONSTRAINT "artigo_tag_artigo_id_fkey" FOREIGN KEY ("artigo_id") REFERENCES "artigo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artigo_tag" ADD CONSTRAINT "artigo_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
