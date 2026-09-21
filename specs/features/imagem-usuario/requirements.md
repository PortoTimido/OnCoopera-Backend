# Imagem de Perfil do Usuário — Requirements

## 1. Objetivo

Permitir que um usuário autenticado (paciente ou administrador) cadastre, substitua e remova sua própria imagem de perfil, armazenada no MinIO, com a URL de acesso exposta de forma segura pela API.

## 2. Referências

- Constitution: `backend/specs/constitution.md`
- SDD Conventions: `backend/specs/architecture/conventions.md`
- Feature relacionada (padrão de imagem já implementado): `backend/specs/features/artigo/design.md`
- Módulo base: `backend/specs/features/usuario-autenticacao/requirements.md`

## 3. Escopo

Esta feature cobre:

- upload/substituição da imagem de perfil do próprio usuário autenticado;
- remoção da imagem de perfil do próprio usuário autenticado;
- exposição da URL temporária da imagem nas respostas que já retornam dados do usuário (`/auth/me`, detalhes e listagem de usuários no backoffice).

Fora de escopo:

- gestão da imagem de perfil de outro usuário (um administrador não pode definir ou remover a imagem de outra pessoa);
- moderação ou aprovação de imagens enviadas.

## 4. Atores

### Usuário autenticado

Paciente ou administrador com sessão válida (access token JWT), que gerencia exclusivamente sua própria imagem de perfil.

## 5. Requisitos funcionais

### REQ-001 — Upload de imagem de perfil

O usuário autenticado deve poder enviar um arquivo de imagem para ser usado como sua imagem de perfil.

Ao enviar uma nova imagem quando já existe uma cadastrada, a imagem anterior deve ser substituída.

### REQ-002 — Remoção de imagem de perfil

O usuário autenticado deve poder remover sua imagem de perfil. Quando não houver imagem cadastrada, a remoção deve ser tratada como uma operação sem efeito (idempotente).

### REQ-003 — Exposição da URL da imagem

Quando o usuário possuir imagem cadastrada, as respostas que retornam seus dados sanitizados devem incluir uma URL temporária e válida por tempo limitado para acesso à imagem. Quando não houver imagem, o campo deve ser retornado como nulo.

### REQ-004 — Armazenamento em MinIO

Os arquivos de imagem devem ser armazenados no MinIO, seguindo o mesmo mecanismo de armazenamento já utilizado por artigos e apoios (`ImageStorage`), sem expor chaves internas do objeto na API.

## 6. Regras de negócio

### BR-001 — Autogestão exclusiva

Somente o próprio usuário autenticado pode enviar ou remover sua imagem de perfil. Não há operação administrativa para gerenciar a imagem de outro usuário nesta feature.

### BR-002 — Validação de arquivo

O arquivo enviado deve ser validado quanto a tipo, extensão, conteúdo e tamanho máximo, reaproveitando as mesmas regras já aplicadas ao upload de imagens de artigos e apoios (JPEG, PNG ou WEBP; tamanho máximo definido pela configuração global `IMAGE_MAX_SIZE_BYTES`).

### BR-003 — Consistência entre storage e banco

Uma falha ao persistir a referência da nova imagem no banco de dados deve reverter o upload já realizado no MinIO (remover o objeto órfão), evitando arquivos armazenados sem referência.

## 7. Critérios de aceite

### AC-001

DADO um usuário autenticado sem imagem de perfil
QUANDO ele enviar uma imagem válida
ENTÃO a imagem deve ser salva no MinIO e a resposta deve conter a URL temporária da nova imagem.

### AC-002

DADO um usuário autenticado com imagem de perfil já cadastrada
QUANDO ele enviar uma nova imagem válida
ENTÃO a imagem anterior deve ser removida do MinIO e substituída pela nova.

### AC-003

DADO um usuário autenticado com imagem de perfil cadastrada
QUANDO ele solicitar a remoção da imagem
ENTÃO a referência deve ser removida do banco e o objeto removido do MinIO.

### AC-004

DADO um usuário autenticado sem imagem de perfil
QUANDO ele solicitar a remoção da imagem
ENTÃO a operação deve ser concluída sem erro e sem efeito.

### AC-005

DADO um arquivo que não seja uma imagem válida (tipo, extensão ou tamanho fora do permitido)
QUANDO o usuário tentar enviá-lo como imagem de perfil
ENTÃO o sistema deve rejeitar a operação com erro de requisição inválida.

### AC-006

DADO um usuário não autenticado
QUANDO ele tentar enviar ou remover uma imagem de perfil
ENTÃO o sistema deve rejeitar a operação com erro de não autorizado.

## 8. Requisitos de segurança

Os endpoints de upload e remoção de imagem devem exigir autenticação (JWT) e operar exclusivamente sobre o usuário identificado pelo token, sem aceitar um identificador de usuário alvo na requisição.

## 9. Requisitos de privacidade (LGPD)

- Dado tratado: imagem de perfil (dado pessoal, podendo constituir imagem de paciente).
- Motivo: permitir identificação visual do usuário nas interfaces do produto.
- Armazenamento: bucket privado no MinIO, sem política de acesso anônimo; acesso somente por URL temporária assinada com expiração curta (`MINIO_URL_EXPIRATION_SECONDS`).
- Atores com acesso: o próprio usuário, via API autenticada. Administradores não têm endpoint de acesso à imagem de outro usuário nesta feature.
- Exposição pela API: apenas como URL temporária assinada, nunca a chave interna do objeto.

## 10. Pendências

Nenhuma pendência identificada no momento da elaboração deste documento além do que já está registrado no escopo.
