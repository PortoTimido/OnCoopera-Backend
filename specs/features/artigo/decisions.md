# Modulo de Artigo - Decisions

## DEC-ART-001 - Status canônico pelo Prisma atual

Status: Aceita.

O modulo usara `StatusArtigo = RASCUNHO | PUBLICADO | DESATIVADO`.

Justificativa:

- O schema Prisma e a migration inicial ja possuem esse enum.
- Evita migration desnecessaria nesta entrega.

## DEC-ART-002 - Imagem como URL no artigo

Status: Aceita.

A imagem do artigo sera representada por `imagemUrl` opcional.

Justificativa:

- O schema Prisma atual ja persiste `artigo.imagem_url`.
- Upload de arquivo nao faz parte desta entrega.

## DEC-ART-003 - Backoffice gerencia taxonomia

Status: Aceita.

Categorias e tags terao CRUD administrativo simples no backoffice.

Justificativa:

- Artigos dependem de categorias obrigatorias.
- O backoffice precisa preparar a taxonomia antes da publicacao.

## DEC-ART-004 - Leitura mobile somente para publicados

Status: Aceita.

Rotas mobile devem listar e consultar apenas artigos `PUBLICADO`.

Justificativa:

- Rascunhos e artigos desativados sao estados administrativos.
- A API mobile nao deve revelar conteudo nao publicado.

## DEC-ART-005 - Autor derivado da identidade autenticada

Status: Aceita.

`autorId` sera extraido da identidade autenticada no backoffice e nao sera aceito no body.

Justificativa:

- Evita falsificacao de autoria por input do cliente.
- Mantem autorizacao e identidade na fronteira da API.
