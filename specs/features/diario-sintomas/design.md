# Diário de Sintomas — Technical Design

## Arquitetura

O módulo segue API → Application → Domain, com Prisma e armazenamento local na infraestrutura. O controller expõe `/api/v1/mobile/diario-sintomas` e requer JWT mais contexto de paciente.

## Persistência

`registro_diario` recebe `data_registro` (`DATE`) e unicidade por paciente/data. `registro_sintoma` recebe `descricao_outro`. O repositório usa upsert pela chave diária e substitui os sintomas numa operação Prisma atômica.

## Áudio

Uploads são validados na borda e persistidos com UUID no diretório `VOICE_NOTES_UPLOAD_DIR`. A chave é mantida em `nota_voz_url`; o conteúdo é servido por endpoint autenticado, não por diretório público.

## Contratos

- `GET /`, `GET /hoje`, `GET /:id`: consulta própria.
- `PUT /hoje`: cria/substitui a entrada de hoje.
- `PATCH /:id`: altera somente a entrada de hoje.
- `GET /:id/nota-voz`: streaming autenticado do áudio próprio.

Corpo de escrita é `multipart/form-data`: `humor`, `sintomas` (JSON), `notaVoz` opcional e `removerNotaVoz` opcional.
