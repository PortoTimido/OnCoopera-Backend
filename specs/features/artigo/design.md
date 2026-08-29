# Modulo de Artigo - Technical Design

## 1. Visao geral

O modulo de artigo segue a divisao arquitetural ja aplicada ao modulo de usuario e autenticacao:

```text
API
  ↓
Application
  ↓
Domain
  ↑
Infrastructure
```

O dominio modela artigo, categoria, tag e validacoes de conteudo. A aplicacao orquestra casos de uso de gestao e leitura. A infraestrutura fornece persistencia Prisma sobre as tabelas ja existentes.

## 2. Modelo de dominio

### Artigo

Entidade raiz do contexto de conteudo.

Atributos conceituais:

- `id: UUID`
- `autorId: UUID`
- `titulo: TituloArtigo`
- `conteudo: ConteudoArtigo`
- `tempoLeituraMinutos: TempoLeitura`
- `imagemUrl: ImagemUrl | null`
- `status: StatusArtigo`
- `categoriaIds: string[]`
- `tagIds: string[]`
- `dataCriacao: Date`
- `dataAtualizacao: Date`
- `dataPublicacao: Date | null`

Comportamentos:

- `publicar(publicadoEm: Date): Artigo`
- `rascunhar(): Artigo`
- `desativar(desativadoEm: Date): Artigo`
- `toPublic(): PublicArtigo`

### Categoria e Tag

Entidades simples com `id` e `nome`.

### Objetos de valor

- `TituloArtigo`: texto obrigatorio com limite definido na borda da API.
- `ConteudoArtigo`: texto obrigatorio.
- `TempoLeitura`: inteiro positivo.
- `ImagemUrl`: URL HTTP/HTTPS opcional.

## 3. Casos de uso

Backoffice:

- listar artigos;
- consultar artigo por ID;
- criar artigo;
- atualizar artigo;
- desativar artigo;
- listar/criar/atualizar/remover categorias;
- listar/criar/atualizar/remover tags.

Mobile:

- listar artigos publicados;
- consultar artigo publicado por ID.

## 4. API

Contratos desta entrega:

```text
GET    /api/backoffice/artigos
GET    /api/backoffice/artigos/:id
POST   /api/backoffice/artigos
PATCH  /api/backoffice/artigos/:id
DELETE /api/backoffice/artigos/:id

GET    /api/backoffice/artigo-categorias
POST   /api/backoffice/artigo-categorias
PATCH  /api/backoffice/artigo-categorias/:id
DELETE /api/backoffice/artigo-categorias/:id

GET    /api/backoffice/artigo-tags
POST   /api/backoffice/artigo-tags
PATCH  /api/backoffice/artigo-tags/:id
DELETE /api/backoffice/artigo-tags/:id

GET    /api/mobile/artigos
GET    /api/mobile/artigos/:id
```

Backoffice usa Bearer token e autorizacao por perfil `TOTAL` ou `MODERADOR_DE_CONTEUDO`.

Mobile retorna apenas artigos `PUBLICADO`.

## 5. Persistencia

Nao ha migration prevista nesta entrega.

O Prisma atual ja possui:

- `artigo`;
- `categoria`;
- `tag`;
- `artigo_categoria`;
- `artigo_tag`;
- `StatusArtigo`.

Criacao e atualizacao de artigo devem usar transacao para persistir dados do artigo e substituir associacoes de categoria/tag de forma consistente.

## 6. Tratamento de erros

Erros esperados:

- validacao de entrada invalida;
- artigo nao encontrado;
- categoria/tag inexistente;
- duplicidade de categoria/tag;
- tentativa de remover categoria/tag em uso;
- acesso nao autenticado;
- acesso sem autorizacao.

## 7. Estrategia de testes

Testes devem cobrir dominio, casos de uso, API schemas/controllers/guards e a ausencia de exposicao de dados indevidos.
