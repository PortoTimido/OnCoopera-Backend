# Imagem de Perfil do Usuário — Design

## 1. Visão geral

A feature reutiliza a infraestrutura de armazenamento de imagens já existente (`ImageStorage` / MinIO, usada por artigos e apoios), adicionando à entidade `Usuario` uma referência opcional de imagem (`imagemObjectKey`) e expondo autogestão via os endpoints já existentes de perfil próprio (`/auth/me`).

## 2. Modelo de dados

### Alteração em `Usuario`

Novo campo na tabela `usuario`:

```
imagemObjectKey String? @map("imagem_object_key")
```

Nenhuma alteração é feita em `Paciente` ou `Administrador`: como ambos são especializações de `Usuario`, um único campo cobre os dois casos, evitando duplicação (decisão confirmada com o responsável pelo produto).

A chave de objeto nunca é exposta pela API; apenas a URL temporária assinada resolvida em tempo de leitura, seguindo o mesmo padrão do módulo de artigos.

## 3. Domínio

`Usuario` (`src/domain/usuario-autenticacao/entities/usuario.entity.ts`) passa a carregar `imagemUrl: string | null` em `UsuarioProps` (opcional, default `null`, para não quebrar construções existentes) e em `PublicUsuario`. A resolução da URL assinada a partir da chave de objeto é responsabilidade da infraestrutura (repositório), não do domínio — o domínio apenas carrega e expõe o valor já resolvido, como já ocorre em `Artigo`/`ImagemUrl`.

## 4. Application

### Portas

`UsuarioRepository` (`src/application/usuario-autenticacao/ports/usuario.repository.ts`) ganha:

```ts
findImagemObjectKey(id: string): Promise<string | null>;
setImagemObjectKey(id: string, objectKey: string | null): Promise<void>;
```

### Casos de uso

Novo arquivo `src/application/usuario-autenticacao/use-cases/manage-usuario-imagem.use-cases.ts`, espelhando `manage-artigo-imagem.use-cases.ts`:

- `UploadUsuarioImagemUseCase`: valida que o usuário existe e está ativo, envia a nova imagem ao storage, persiste a nova chave, remove a chave anterior do storage somente após a persistência ter sucesso; em caso de falha ao persistir, remove o objeto recém-enviado (órfão) antes de propagar o erro.
- `DeleteUsuarioImagemUseCase`: valida que o usuário existe e está ativo; se não houver imagem cadastrada, retorna sem efeito; caso contrário remove a referência no banco e o objeto no storage.

Ambos reutilizam `ImageStorage` (`src/application/armazenamento-imagem/image-storage.port.ts`) e lançam `AuthApplicationError('UNAUTHORIZED', ...)` quando o usuário não existir ou estiver inativo, consistente com `GetAuthenticatedUserUseCase` e `UpdateOwnProfileUseCase`.

Pasta de armazenamento das imagens: `usuarios/{usuarioId}` (segue o padrão `artigos/{id}`).

## 5. Infraestrutura

`PrismaUsuarioRepository` (`src/infrastructure/usuario-autenticacao/prisma-usuario.repository.ts`) passa a:

- receber `ImageStorage` no construtor;
- incluir `imagemObjectKey` no shape lido do Prisma;
- resolver a URL temporária assinada (`storage.getTemporaryUrl`) ao converter um registro em domínio (`toDomain` torna-se assíncrono, como já ocorre em `PrismaArtigoRepository.toPublicArtigo`), retornando `null` quando não houver chave cadastrada;
- implementar `findImagemObjectKey`/`setImagemObjectKey` com leitura/escrita direta do campo, seguindo o padrão já usado em `PrismaArtigoRepository`.

Os pontos de chamada de `toDomain` (`findByIdentifier`, `findById`, `updateProfile`, `listUsuarios`, `toDetails`) são ajustados para aguardar a resolução assíncrona.

## 6. API

Os endpoints de autogestão de imagem são adicionados ao `AuthController` (`src/api/usuario-autenticacao/auth.controller.ts`), pois aplicam-se a qualquer usuário autenticado — paciente ou administrador — sem exigir tipo específico, mesma característica de `GET/PATCH /auth/me`:

- `POST /auth/me/imagem` — multipart/form-data, campo `imagem`; retorna o usuário autenticado atualizado (`AuthenticatedUserSwaggerDto`), agora incluindo `imagemUrl`.
- `DELETE /auth/me/imagem` — `204 No Content`.

Ambos exigem `JwtAuthGuard` e operam apenas sobre `request.auth.usuarioId` — não aceitam um identificador de usuário alvo, cumprindo BR-001.

`AuthenticatedUserSwaggerDto` ganha a propriedade `imagemUrl: string | null`, refletida automaticamente em `UsuarioDetailsSwaggerDto` e `PaginatedUsuariosSwaggerDto`, que já reutilizam esse DTO.

## 7. Tratamento de erros

Reaproveita `mapAuthError`, que já traduz `AuthApplicationError('UNAUTHORIZED', ...)` para `401`. Erros de validação de arquivo (`BadRequestException`) são lançados diretamente por `MinioImageStorageService`, como já ocorre no módulo de artigos.

## 8. Autorização

Apenas `JwtAuthGuard` é necessário — não há checagem de permissão administrativa, pois a operação é sempre sobre o próprio usuário autenticado (BR-001). Nenhum novo nível de permissão administrativa é introduzido.

## 9. Impacto em funcionalidades existentes

- Respostas que já retornam `PublicUsuario` (`/auth/me`, `/auth/login`, `/auth/refresh`, detalhes e listagem de usuários no backoffice, `mobile/pacientes/me`) passam a incluir `imagemUrl`. Nenhum contrato existente é removido; é uma adição de campo.
- `toDomain` no repositório de usuário torna-se assíncrono; chamadas síncronas existentes são ajustadas nesta implementação.

## 10. Testes

- Unitário: casos de uso `UploadUsuarioImagemUseCase`/`DeleteUsuarioImagemUseCase` com repositório e storage fake, no mesmo arquivo/padrão de `tests/armazenamento-imagem/armazenamento-imagem.spec.ts`.
- Unitário: domínio (`toPublic()` inclui `imagemUrl`).

## 11. Migração de banco

Nova migration adicionando a coluna opcional `imagem_object_key` na tabela `usuario`, sem necessidade de backfill (coluna nova, sempre nula até o primeiro upload).
