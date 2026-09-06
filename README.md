# OnCoopera — BackEnd

Este repositório contém o backend/API do ecossistema OnCoopera. Ele centraliza regras de negócio, autenticação, controle de usuários, funcionalidades de artigos e acesso aos dados persistidos em PostgreSQL com PostGIS.

A aplicação é construída com NestJS e TypeScript, seguindo uma organização em camadas que separa entrada HTTP, casos de uso, domínio e infraestrutura. A API expõe rotas voltadas tanto ao uso mobile quanto ao backoffice administrativo.

## Sobre o OnCoopera

O OnCoopera é uma solução desenvolvida como Trabalho de Conclusão de Curso voltada ao apoio de pacientes oncológicos.

No estado atual deste repositório, o backend contempla recursos relacionados a autenticação, cadastro e manutenção de usuários, pacientes e administradores, além de gerenciamento e consulta de artigos informativos com categorias e tags.

## Responsabilidade deste repositório

Este repositório representa o backend/API do OnCoopera. Sua responsabilidade é disponibilizar uma REST API para os demais componentes do ecossistema, aplicar regras de domínio e intermediar o acesso ao banco de dados.

Pela estrutura atual, a API possui rotas destinadas à aplicação mobile, como cadastro e manutenção do próprio paciente e listagem de artigos publicados, e rotas destinadas ao backoffice, como gestão de usuários, administradores, artigos, categorias e tags.

## Tecnologias

| Tecnologia | Finalidade |
| ---------- | ---------- |
| Node.js | Runtime da aplicação backend |
| TypeScript | Linguagem principal do projeto |
| NestJS | Framework para estruturação da API HTTP |
| Prisma | ORM e camada de acesso ao banco de dados |
| PostgreSQL | Banco de dados relacional |
| PostGIS | Extensão geoespacial utilizada no schema do banco |
| Zod | Validação de dados nas bordas da API |
| JWT | Autenticação por access token |
| bcrypt | Hash de senhas |
| cookie-parser | Leitura de cookies HTTP |
| Swagger/OpenAPI | Documentação interativa da API |
| Jest | Testes e2e, watch mode, debug e cobertura |
| Japa | Execução dos testes em `tests/**/*.spec.ts` |
| ESLint | Análise estática e padronização de código |
| Prettier | Formatação de código |

## Arquitetura

O projeto está organizado em camadas, com separação explícita entre API, aplicação, domínio e infraestrutura. A documentação em `specs/architecture/backend.md` define o uso de princípios de Domain-Driven Design, e a estrutura atual do código reflete essa divisão.

A camada `api` contém controllers, guards, schemas de validação e mapeamento HTTP. A camada `application` concentra portas e casos de uso. A camada `domain` reúne entidades, value objects, serviços e erros de domínio. A camada `infrastructure` implementa detalhes externos, como repositórios Prisma, geração de tokens, hash de senhas e configuração de autenticação.

```text
HTTP Request
    ↓
API
    ↓
Application
    ↓
Domain
    ↓
Infrastructure
    ↓
PostgreSQL/PostGIS
```

## Estrutura do projeto

```text
.
├── bin/
│   └── test.ts
├── prisma/
│   └── migrations/
├── specs/
│   ├── architecture/
│   └── features/
├── src/
│   ├── api/
│   ├── application/
│   ├── domain/
│   ├── generated/
│   ├── infrastructure/
│   ├── prisma/
│   ├── app.module.ts
│   └── main.ts
├── test/
├── tests/
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

Principais responsabilidades:

| Diretório | Responsabilidade |
| --------- | ---------------- |
| `bin/` | Script de execução dos testes com Japa |
| `prisma/` | Migrações do banco de dados |
| `specs/` | Documentação arquitetural e especificações funcionais |
| `src/api/` | Controllers, guards, schemas, Swagger e adaptação HTTP |
| `src/application/` | Casos de uso, portas e erros de aplicação |
| `src/domain/` | Entidades, value objects, serviços e regras de domínio |
| `src/generated/` | Client Prisma gerado |
| `src/infrastructure/` | Implementações técnicas de persistência, autenticação e segurança |
| `src/prisma/` | Schema Prisma utilizado pelo projeto |
| `test/` | Configuração e teste e2e em Jest |
| `tests/` | Testes de domínio, aplicação e API executados via Japa |

## Pré-requisitos

| Ferramenta | Observação |
| ---------- | ---------- |
| Node.js | Necessário para executar a aplicação NestJS |
| npm | Gerenciador indicado pelo `package-lock.json` |
| PostgreSQL | Banco configurado pelo Prisma |
| PostGIS | Necessário para campos geoespaciais definidos no schema |

Não há versão de Node.js fixada no repositório.

## Instalação

Instale as dependências a partir da raiz deste projeto backend:

```bash
npm install
```

## Configuração do ambiente

O repositório possui o arquivo `.env.example` como referência. Para criar o arquivo local de configuração:

```bash
cp .env.example .env
```

Variáveis utilizadas:

| Variável | Descrição |
| -------- | --------- |
| `DATABASE_URL` | URL de conexão com o banco PostgreSQL |
| `PORT` | Porta HTTP utilizada pela aplicação |
| `JWT_ACCESS_SECRET` | Segredo usado para assinatura de access tokens JWT |
| `AUTH_TOKEN_HASH_SECRET` | Segredo usado no hash de tokens de autenticação |
| `BCRYPT_SALT_ROUNDS` | Quantidade de rounds utilizada pelo bcrypt |
| `ACCESS_TOKEN_TTL_SECONDS` | Tempo de vida do access token, em segundos |
| `REFRESH_TOKEN_TTL_DAYS` | Tempo de vida do refresh token, em dias |
| `AUTH_COOKIE_SECURE` | Define se o cookie de autenticação deve exigir conexão segura |

Os valores do `.env.example` são apenas exemplos para ambiente local. Segredos reais não devem ser versionados.

## Executando o projeto

Execução em modo padrão:

```bash
npm run start
```

Execução em desenvolvimento com watch mode:

```bash
npm run start:dev
```

Execução em modo debug:

```bash
npm run start:debug
```

Execução usando a build gerada:

```bash
npm run start:prod
```

A API usa o prefixo global `/api`. A porta padrão é `3000`, caso `PORT` não seja definida.

## Build

Para gerar a build da aplicação:

```bash
npm run build
```

O build é gerado pelo NestJS no diretório `dist/`.

## Banco de dados

Este repositório possui responsabilidade direta sobre o modelo de dados e acesso ao banco por meio do Prisma.

| Item | Configuração identificada |
| ---- | ------------------------- |
| Banco | PostgreSQL |
| Extensão | PostGIS |
| ORM | Prisma |
| Schema | `src/prisma/schema.prisma` |
| Migrações | `prisma/migrations/` |
| Client gerado | `src/generated/prisma` |
| Configuração Prisma | `prisma.config.ts` |

O schema atual contém estruturas relacionadas a usuários, pacientes, administradores, perfis administrativos, sessões de autenticação, endereços, registros diários, sintomas, consultas, rede de apoio, artigos, categorias e tags.

A primeira migration habilita a extensão PostGIS e define o campo `localizacao_postgis` como `geometry(Point, 4326)`. O seed administrativo pode ser executado com `npm run db:seed`.

## Testes

O projeto possui testes em `tests/**/*.spec.ts` executados pelo Japa:

```bash
npm run test
```

Também existem scripts configurados para Jest:

```bash
npm run test:watch
npm run test:cov
npm run test:e2e
npm run test:debug
```

O arquivo `test/jest-e2e.json` configura os testes e2e em Jest, e o diretório `tests/` contém testes de domínio, aplicação e API para os módulos atuais.

## Qualidade de código

O projeto utiliza ESLint e Prettier.

Para executar o lint:

```bash
npm run lint
```

Para formatar os arquivos TypeScript de `src/` e `test/`:

```bash
npm run format
```

A configuração do ESLint está em `eslint.config.mjs`, com integração ao Prettier e regras de TypeScript.

## Documentação da API

Este backend disponibiliza documentação Swagger/OpenAPI durante a execução da aplicação.

Com a aplicação em execução, a documentação fica disponível em:

```text
http://localhost:3000/docs
```

Caso a variável `PORT` seja alterada, substitua `3000` pela porta configurada. As rotas da API usam o prefixo global `/api`, mas a documentação Swagger foi configurada diretamente em `/docs`.

## Integração com o ecossistema OnCoopera

Este backend atua como ponto central entre as interfaces do ecossistema OnCoopera e o banco de dados.

```text
Aplicação Mobile ─────┐
                      ├──> API OnCoopera ───> PostgreSQL + PostGIS
Backoffice Web ───────┘
```

As rotas sob `mobile/` atendem fluxos destinados à aplicação mobile. As rotas sob `backoffice/` atendem funcionalidades administrativas. Ambas compartilham regras de aplicação, domínio e persistência.

## Principais funcionalidades

- Autenticação de usuários com access token, refresh token e cookies.
- Consulta do usuário autenticado e troca de senha.
- Cadastro, atualização e inativação de pacientes.
- Listagem, consulta, criação, atualização e inativação de usuários administrativos.
- Controle de perfis administrativos por guardas de autorização.
- Gestão de artigos pelo backoffice.
- Gestão de categorias e tags de artigos.
- Consulta de artigos publicados para consumo mobile.

## Status do projeto

O projeto está em desenvolvimento. A estrutura atual já possui módulos implementados para autenticação, usuários e artigos, além de schema Prisma, migrations, documentação arquitetural e testes.

## Contribuição

Este é um projeto acadêmico desenvolvido pela equipe responsável pelo OnCoopera. Alterações devem seguir as decisões arquiteturais e especificações mantidas no diretório `specs/`.

## Projeto acadêmico

O OnCoopera está sendo desenvolvido como Trabalho de Conclusão de Curso, com foco no apoio a pacientes oncológicos.

## Licença

Este projeto possui finalidade acadêmica. Consulte os responsáveis pelo projeto sobre condições de utilização e distribuição.
