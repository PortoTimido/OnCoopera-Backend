# Modulo de Artigo - Requirements

## 1. Objetivo

Definir o comportamento esperado para gestao e consulta de artigos no backend do OnCoopera.

Esta specification cobre o modulo indicado pelo diagrama de classes de artigo, respeitando a arquitetura DDD, as regras de seguranca e o padrao ja aplicado no modulo de usuario e autenticacao.

## 2. Referencias

- Diagrama de classes: `backend/.temp/DiagramaClasse/ModuloArtigo.png`
- Database diagram: `backend/.temp/docs/db-marmaid.mmd`
- Constitution: `backend/specs/constitution.md`
- Backend Architecture: `backend/specs/architecture/backend.md`
- Security Architecture: `backend/specs/architecture/security.md`
- Database Architecture: `backend/specs/architecture/database.md`
- SDD Conventions: `backend/specs/architecture/conventions.md`

## 3. Escopo

O modulo deve representar:

- artigo;
- categorias de artigo;
- tags de artigo;
- autor administrador;
- status editorial;
- imagem por URL;
- consulta publica/mobile de artigos publicados;
- gestao administrativa pelo backoffice.

Upload de arquivos nao faz parte desta entrega.

## 4. Requisitos funcionais

### REQ-ART-001 - Representacao de artigo

O sistema deve representar artigo com identificador, autor, titulo, conteudo, tempo de leitura, URL opcional de imagem, status, categorias, tags e datas de criacao, atualizacao e publicacao.

### REQ-ART-002 - Status editorial

O sistema deve reconhecer os status:

- `RASCUNHO`;
- `PUBLICADO`;
- `DESATIVADO`.

### REQ-ART-003 - Categoria obrigatoria

Todo artigo deve possuir ao menos uma categoria.

### REQ-ART-004 - Gestao administrativa de artigos

Administradores autorizados devem poder listar, consultar, criar, atualizar, publicar e desativar artigos pelo backoffice.

### REQ-ART-005 - Autor derivado da autenticacao

Na criacao de artigo, o autor deve ser o administrador autenticado e nao deve ser recebido pelo payload da API.

### REQ-ART-006 - Leitura mobile

O aplicativo mobile deve poder listar e consultar apenas artigos publicados.

Artigos em rascunho ou desativados nao devem aparecer na leitura mobile.

### REQ-ART-007 - Gestao de categorias

Administradores autorizados devem poder listar, criar, atualizar e remover categorias de artigo.

Categoria associada a artigo nao deve ser removida.

### REQ-ART-008 - Gestao de tags

Administradores autorizados devem poder listar, criar, atualizar e remover tags de artigo.

Tag associada a artigo nao deve ser removida.

## 5. Regras de negocio

### RN-ART-001 - Publicacao

Quando um artigo for salvo como `PUBLICADO`, `dataPublicacao` deve ser preenchida.

### RN-ART-002 - Rascunho

Quando um artigo for salvo como `RASCUNHO`, `dataPublicacao` deve permanecer `null`.

### RN-ART-003 - Desativacao

Exclusao de artigo deve ser logica, alterando o status para `DESATIVADO`.

### RN-ART-004 - Categoria inexistente

Artigo nao deve ser criado ou atualizado com categoria inexistente.

### RN-ART-005 - Tag inexistente

Artigo nao deve ser criado ou atualizado com tag inexistente.

### RN-ART-006 - Permissao de conteudo

Gestao de artigo, categoria e tag deve ser permitida apenas a administrador com perfil `TOTAL` ou `MODERADOR_DE_CONTEUDO`.

## 6. Seguranca e privacidade

- Entrada deve ser validada no backend com Zod.
- Autorizacao deve ocorrer no backend.
- A API nao deve aceitar `autorId` no body.
- Rotas mobile nao devem revelar artigos nao publicados.
