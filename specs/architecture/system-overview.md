# Visão Geral do Sistema

## 1. Objetivo

Este documento apresenta a visão arquitetural de alto nível do backoffice do OnCoopera.

Seu objetivo é fornecer uma referência comum sobre:

* propósito do backoffice;
* escopo deste SDD;
* principais contextos funcionais;
* componentes do sistema;
* relacionamento entre frontend, backend e banco de dados;
* fluxo geral das requisições;
* fronteiras arquiteturais;
* tecnologias já definidas;
* decisões ainda pendentes.

Este documento não substitui os documentos especializados de arquitetura.

Detalhes devem ser consultados em:

* `architecture/backend.md`;
* `architecture/database.md`;
* `architecture/security.md`;
* demais documentos arquiteturais aplicáveis;
* ADRs vigentes.

---

# 2. Escopo deste SDD

Este SDD é destinado exclusivamente ao desenvolvimento do **backoffice do OnCoopera**.

O backoffice representa a aplicação administrativa do projeto.

A aplicação mobile do OnCoopera não faz parte do escopo deste SDD.

Entretanto, o backoffice pode compartilhar:

* backend;
* banco de dados;
* entidades persistidas;
* regras de domínio;
* serviços;

com outros componentes do ecossistema OnCoopera.

Por esse motivo, alterações realizadas pelo backoffice não devem assumir que determinada estrutura é utilizada exclusivamente pela aplicação administrativa quando isso não estiver explicitamente definido.

---

# 3. Contexto do sistema

O OnCoopera possui diferentes contextos funcionais persistidos no modelo atual.

Entre os contextos atualmente identificados estão:

* identidade;
* acesso administrativo;
* acompanhamento;
* rede de apoio;
* conteúdo.

No banco de dados atual, esses contextos são representados, entre outras, pelas seguintes estruturas:

| Contexto              | Principais estruturas persistidas                            |
| --------------------- | ------------------------------------------------------------ |
| Identidade            | `usuario`, `paciente`, `administrador`                       |
| Acesso administrativo | `perfil_administrativo`, `administrador_perfil`              |
| Acompanhamento        | `registro_diario`, `registro_sintoma`, `consulta`            |
| Rede de apoio         | `apoio`, `endereco`, `horario_funcionamento`, `apoio_imagem` |
| Conteúdo              | `artigo`, `categoria`, `tag` e associações                   |

A presença dessas estruturas no banco não determina, por si só, quais funcionalidades estarão disponíveis no backoffice.

A exposição e manipulação de cada contexto devem ser definidas pelas respectivas specifications.

---

# 4. Visão arquitetural

Em alto nível, o backoffice utiliza a seguinte arquitetura:

```text
┌──────────────────────────┐
│      Usuário do          │
│       Backoffice         │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│         Frontend         │
│                          │
│ React                    │
│ TypeScript               │
└────────────┬─────────────┘
             │
          REST API
             │
             ▼
┌──────────────────────────┐
│          Backend         │
│                          │
│ Node.js                  │
│ TypeScript               │
│ DDD                      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       Persistência       │
│                          │
│ Prisma ORM               │
│ PostgreSQL               │
│ PostGIS                  │
└──────────────────────────┘
```

O frontend não deve acessar diretamente o banco de dados.

Toda operação persistente ou regra de negócio disponibilizada ao backoffice deve passar pelo backend.

---

# 5. Componentes principais

A arquitetura atual é composta pelos seguintes componentes principais:

```text
Backoffice Frontend
        ↓
REST API
        ↓
Backend
        ↓
Prisma
        ↓
PostgreSQL / PostGIS
```

Cada componente possui uma responsabilidade distinta.

---

# 6. Backoffice Frontend

O frontend do backoffice será desenvolvido utilizando:

* React;
* TypeScript.

Sua responsabilidade principal é fornecer a interface administrativa do sistema.

O frontend é responsável por:

* apresentação das informações;
* interação com o usuário;
* formulários;
* navegação;
* consumo da REST API;
* feedback visual;
* composição das telas;
* experiência do usuário.

O frontend não deve ser responsável pela aplicação definitiva de:

* regras de negócio;
* autorização;
* integridade persistente;
* segurança de acesso.

Essas responsabilidades devem ser validadas também no backend.

---

# 7. Design da interface

Os protótipos existentes no Figma são atualmente a principal referência visual do backoffice.

Ainda não existe um Design System formalmente definido.

O frontend deve priorizar:

* consistência;
* reutilização de componentes;
* componentização;
* composição;
* manutenção;
* padrões de desenvolvimento adequados.

A escolha definitiva de biblioteca de componentes ainda não foi realizada.

---

# 8. Arquitetura interna do frontend

A arquitetura interna definitiva do frontend ainda não foi formalmente definida.

Ainda devem ser decididos, entre outros pontos:

* organização de pastas;
* organização por feature ou camada;
* estratégia de gerenciamento de estado;
* biblioteca de componentes;
* estratégia de acesso à API;
* organização de formulários;
* tratamento global de erros.

Essas decisões não devem ser presumidas pelas specifications.

Quando formalizadas, devem ser incorporadas ao documento de arquitetura correspondente e, quando necessário, registradas por ADR.

---

# 9. Backend

O backend será desenvolvido utilizando:

* Node.js;
* TypeScript.

O framework definitivo ainda não foi escolhido.

O backend utiliza Domain-Driven Design como princípio arquitetural.

Sua organização principal é:

```text
api/
application/
documentation/
domain/
infrastructure/
```

As responsabilidades detalhadas dessas camadas estão definidas em:

```text
architecture/backend.md
```

---

# 10. Responsabilidade do backend

O backend deve centralizar:

* regras de aplicação;
* regras de domínio;
* validação efetiva de autorização;
* acesso à persistência;
* integração com serviços externos;
* exposição da REST API.

O backend deve funcionar como a fronteira confiável entre clientes e os recursos internos do sistema.

---

# 11. Fluxo interno do backend

O fluxo conceitual esperado é:

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
Database / External Services
```

A resposta percorre o caminho inverso até a API.

A direção das dependências deve preservar a independência do domínio.

---

# 12. REST API

A comunicação entre o backoffice e o backend será realizada através de REST API.

A API representa a fronteira de comunicação entre:

```text
Frontend
    ↕
Backend
```

Ainda não estão formalmente definidos:

* padrão global de rotas;
* versionamento;
* formato global de response;
* formato global de erros;
* paginação;
* filtros;
* ordenação.

Essas definições não devem ser criadas silenciosamente por uma feature.

---

# 13. Contratos da API

Toda operação consumida pelo frontend deve possuir contrato compreensível.

Quando aplicável, uma specification deve identificar:

* método HTTP;
* rota;
* parâmetros;
* request body;
* response;
* erros possíveis;
* requisitos de autenticação;
* requisitos de autorização.

O contrato da API deve representar as necessidades do caso de uso, e não simplesmente expor diretamente o modelo persistido.

---

# 14. Persistência

O banco de dados oficial é PostgreSQL com PostGIS.

O acesso ao banco é realizado através do Prisma ORM.

O schema Prisma encontra-se em:

```text
db/prisma/schema.prisma
```

As migrations encontram-se em:

```text
db/prisma/migrations/
```

As regras detalhadas de persistência estão documentadas em:

```text
architecture/database.md
```

---

# 15. Separação entre domínio e persistência

O modelo físico do banco não deve ser interpretado automaticamente como modelo de domínio.

A arquitetura deve preservar a distinção:

```text
Database Model
      ≠
Domain Model
      ≠
API Contract
```

Essas representações podem possuir semelhanças, mas cumprem responsabilidades distintas.

---

# 16. Geolocalização

O sistema possui suporte a dados geográficos através do PostGIS.

No modelo atual, informações relacionadas a endereço podem utilizar dados geoespaciais.

Detalhes sobre:

* representação;
* coordenadas;
* PostGIS;
* consultas espaciais;
* integração com Prisma;

estão documentados em:

```text
architecture/database.md
```

Uma feature que utilize busca geográfica deve especificar seus requisitos próprios, como raio e comportamento esperado.

---

# 17. Segurança

A segurança do backoffice deve ser aplicada em todas as camadas necessárias.

A arquitetura segue os princípios definidos em:

```text
architecture/security.md
```

Entre os princípios gerais estão:

* não confiar no cliente;
* validar autenticação no backend;
* validar autorização no backend;
* minimizar exposição de dados;
* proteger credenciais;
* não expor detalhes internos;
* tratar dados pessoais e sensíveis com atenção específica.

---

# 18. Autenticação

Durante a fase atual, existe um mecanismo simplificado baseado em sessão.

Esse mecanismo é temporário.

Para a versão final do MVP está prevista autenticação utilizando JWT.

Os detalhes definitivos do mecanismo JWT ainda não foram definidos.

A aplicação não deve acoplar regras de negócio ao mecanismo temporário de autenticação.

---

# 19. Autorização administrativa

O modelo persistido atualmente possui:

```text
perfil_administrativo
administrador_perfil
```

Entretanto, a estratégia completa de autorização ainda não foi definida.

Ainda precisam ser formalizados:

* permissões;
* granularidade;
* relação entre perfil e permissão;
* regras específicas de acesso.

Nenhuma feature deve inferir permissões com base apenas na existência dessas estruturas.

---

# 20. Dados pessoais e sensíveis

O OnCoopera manipula dados que podem possuir impacto relevante de privacidade.

A adequação à LGPD é um requisito geral do projeto.

As políticas concretas ainda não estão integralmente definidas.

Por isso, features do backoffice que manipulem dados pessoais ou informações relacionadas ao acompanhamento do paciente devem explicitar:

* necessidade de acesso;
* atores autorizados;
* dados utilizados;
* dados retornados;
* finalidade da operação.

A existência da informação no banco não implica acesso administrativo automático.

---

# 21. Contexto de identidade

O modelo atual distingue estruturas relacionadas a:

```text
usuario
paciente
administrador
```

O comportamento e relacionamento entre esses conceitos devem permanecer de acordo com as regras de domínio existentes.

O backoffice não deve assumir que todo usuário é administrador ou que todo administrador possui acesso irrestrito.

---

# 22. Contexto administrativo

O backoffice possui um contexto específico relacionado à administração do sistema.

Atualmente existem estruturas persistidas para:

* administrador;
* perfil administrativo;
* relacionamento entre administrador e perfil.

As funcionalidades administrativas concretas devem ser especificadas individualmente.

---

# 23. Contexto de conteúdo

O modelo atual possui estruturas relacionadas à gestão de conteúdo:

```text
artigo
categoria
tag
```

e suas associações.

Funcionalidades do backoffice relacionadas a esses dados devem possuir specifications próprias.

Essas specifications devem definir, quando aplicável:

* criação;
* edição;
* publicação;
* categorização;
* associação de tags;
* exclusão;
* autorização.

Não se deve deduzir o ciclo completo apenas a partir do schema.

---

# 24. Contexto de rede de apoio

O modelo atual possui informações relacionadas à rede de apoio, incluindo:

```text
apoio
endereco
horario_funcionamento
apoio_imagem
```

Esse contexto pode envolver:

* dados cadastrais;
* endereço;
* horários;
* imagens;
* geolocalização.

As regras específicas de gerenciamento devem ser definidas pelas features correspondentes.

---

# 25. Contexto de acompanhamento

O schema atual possui estruturas relacionadas ao acompanhamento:

```text
registro_diario
registro_sintoma
consulta
```

A presença desses dados não significa que o backoffice possua acesso irrestrito a eles.

Qualquer funcionalidade administrativa que consulte ou modifique dados desse contexto deve possuir requirement explícito.

---

# 26. Dependências externas

O sistema pode possuir integrações externas conforme as necessidades das features.

Nenhuma integração adicional deve ser presumida apenas com base no domínio do produto.

Integrações devem ser introduzidas através de specification e design.

Quando existirem, devem permanecer isoladas na camada de infraestrutura conforme a arquitetura do backend.

---

# 27. Fluxo de uma operação típica

Uma operação administrativa típica deve seguir conceitualmente:

```text
1. Usuário interage com o backoffice

2. Frontend prepara a requisição

3. REST API recebe a requisição

4. Backend autentica a identidade quando necessário

5. Backend valida a entrada

6. Backend verifica autorização

7. Application executa o caso de uso

8. Domain aplica regras de negócio

9. Infrastructure acessa persistência ou integração

10. Resultado retorna para Application

11. API constrói a resposta

12. Frontend apresenta o resultado
```

Nem toda operação precisa executar todos esses passos.

O fluxo deve permanecer proporcional à complexidade da funcionalidade.

---

# 28. Fluxo de leitura

Uma consulta simples pode seguir:

```text
Backoffice
    ↓
REST API
    ↓
Controller
    ↓
Use Case
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

O retorno deve conter somente os dados necessários ao contrato da operação.

---

# 29. Fluxo de escrita

Uma operação de alteração pode seguir:

```text
Backoffice
    ↓
REST API
    ↓
Validation
    ↓
Authorization
    ↓
Use Case
    ↓
Domain Rules
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

Constraints de banco devem complementar, e não substituir, regras de domínio aplicáveis.

---

# 30. Organização das Specifications

As specifications ficam em:

```text
.sdd/specs/
```

Cada feature deve possuir, conforme as conventions:

```text
feature/
├── requirements.md
├── design.md
├── review.md
├── tasks.md
└── decisions.md
```

O desenvolvimento segue:

```text
requirements
     ↓
design
     ↓
review
     ↓
tasks
     ↓
implementation
     ↓
validation
```

---

# 31. Relação entre SDD e arquitetura

Specifications devem trabalhar dentro das fronteiras arquiteturais já definidas.

Uma feature não deve redefinir silenciosamente:

* arquitetura do backend;
* estratégia de persistência;
* estratégia de segurança;
* tecnologia padrão;
* convenções globais.

Quando uma feature revelar a necessidade de alterar uma decisão global, deve-se avaliar:

```text
Feature
   ↓
necessidade arquitetural
   ↓
ADR
   ↓
Architecture update
   ↓
Feature design
```

---

# 32. Documentos arquiteturais

A estrutura arquitetural do SDD deve conter documentos especializados.

Atualmente:

```text
.sdd/
├── architecture/
│   ├── system-overview.md
│   ├── backend.md
│   ├── database.md
│   └── security.md
```

Outros documentos podem ser adicionados quando houver responsabilidade arquitetural clara.

Possíveis documentos futuros incluem, caso sejam necessários e formalizados:

```text
frontend.md
api.md
testing.md
```

Sua existência não deve ser presumida antes da respectiva definição.

---

# 33. Papel dos ADRs

Documentos de arquitetura representam:

> como o sistema funciona atualmente.

ADRs representam:

> por que uma decisão arquitetural relevante foi tomada.

Exemplo:

```text
ADR
"Qual framework de backend escolhemos e por quê?"

architecture/backend.md
"Como o backend funciona com o framework atualmente adotado?"
```

Quando uma decisão for formalizada, o documento de arquitetura correspondente deve ser atualizado.

---

# 34. Tecnologias atualmente definidas

## Frontend

```text
React
TypeScript
```

## Backend

```text
Node.js
TypeScript
```

## Banco de dados

```text
PostgreSQL
PostGIS
```

## ORM

```text
Prisma
```

## Comunicação

```text
REST API
```

## Backend tests

```text
Japa
```

## Frontend tests

```text
Playwright
```

Playwright está definido para testes aplicáveis ao backoffice, mas a estratégia completa de testes frontend ainda não foi formalizada.

---

# 35. Tecnologias ainda não definidas

Ainda não foram formalmente escolhidos:

* framework Node.js;
* biblioteca de componentes do frontend;
* estratégia complementar de testes frontend;
* biblioteca ou mecanismo padrão de validação;
* mecanismo formal de dependency injection, caso necessário;
* arquitetura interna definitiva do frontend.

Essas decisões não devem ser preenchidas por suposição.

---

# 36. Decisões arquiteturais ainda abertas

Além das tecnologias, existem decisões globais ainda pendentes.

Entre elas:

## API

* convenção de rotas;
* versionamento;
* formato de response;
* formato de erros;
* paginação;
* filtros.

## Segurança

* modelo de autorização;
* permissões;
* algoritmo e configuração de hash;
* detalhes do JWT;
* rate limiting;
* política de CORS;
* estratégia de CSRF aplicável.

## Dados

* política definitiva de retenção;
* anonimização;
* exclusão;
* backup e recuperação para produção.

## Frontend

* arquitetura interna;
* gerenciamento de estado;
* biblioteca de componentes;
* estratégia de comunicação com a API.

Essas decisões devem ser formalizadas quando se tornarem necessárias.

---

# 37. Fronteiras arquiteturais

O sistema deve respeitar as seguintes fronteiras:

```text
Frontend
  não acessa banco diretamente

API
  não concentra regra de negócio

Application
  não depende de React

Domain
  não depende de HTTP
  não depende de Prisma
  não depende de PostgreSQL

Infrastructure
  implementa detalhes tecnológicos
```

Essas fronteiras devem orientar tanto código humano quanto implementação realizada por agentes.

---

# 38. Fonte de verdade por responsabilidade

A documentação deve ser consultada conforme a natureza da dúvida.

| Dúvida                           | Fonte principal      |
| -------------------------------- | -------------------- |
| Regras globais do projeto        | `constitution.md`    |
| Convenções do SDD                | `conventions.md`     |
| Visão geral do sistema           | `system-overview.md` |
| Backend e DDD                    | `backend.md`         |
| Persistência                     | `database.md`        |
| Segurança                        | `security.md`        |
| Decisão arquitetural histórica   | ADR                  |
| Comportamento da feature         | `requirements.md`    |
| Implementação técnica da feature | `design.md`          |
| Trabalho executável              | `tasks.md`           |
| Decisão local da feature         | `decisions.md`       |

---

# 39. Responsabilidade do backoffice

O backoffice deve ser tratado como um cliente administrativo do backend.

Ele não deve assumir acesso implícito a toda informação existente no banco.

Cada funcionalidade deve definir explicitamente:

* quais dados são administráveis;
* quais operações existem;
* quem pode executá-las;
* quais regras de negócio devem ser respeitadas.

A função administrativa de uma tela não elimina regras de domínio ou segurança.

---

# 40. Evolução do sistema

A arquitetura deve evoluir de forma deliberada.

Uma nova feature pode revelar necessidade de:

* novo módulo;
* novo contexto;
* novo serviço externo;
* nova abstração;
* nova tecnologia;
* nova decisão transversal.

Isso não significa que a feature possa estabelecer a mudança unilateralmente.

Alterações globais devem ser avaliadas no nível arquitetural correspondente.

---

# 41. Complexidade proporcional

A arquitetura deve permanecer proporcional às necessidades reais do projeto.

DDD, SDD e separação em camadas não devem ser usados como justificativa para criar estruturas sem necessidade concreta.

Uma funcionalidade simples pode possuir um fluxo simples.

Uma funcionalidade complexa pode exigir:

* mais regras de domínio;
* transações;
* autorização específica;
* integrações;
* novos componentes;
* alterações estruturais no banco.

A complexidade da solução deve refletir a complexidade do problema.

---

# 42. Uso por agentes de IA

Antes de implementar uma feature do backoffice, um agente deve compreender ao menos:

```text
Constitution
     ↓
Conventions
     ↓
System Overview
     ↓
Architecture aplicável
     ↓
ADRs aplicáveis
     ↓
Feature Requirements
     ↓
Feature Design
     ↓
Tasks
```

O agente não deve inferir que toda informação presente no sistema está disponível para qualquer funcionalidade administrativa.

---

# 43. Agentes não devem

Agentes não devem:

* adicionar funcionalidades à aplicação mobile através deste SDD;
* assumir que banco e domínio são equivalentes;
* expor models Prisma diretamente como contrato por conveniência;
* assumir acesso administrativo irrestrito;
* inventar permissões;
* inventar rotas globais;
* inventar tecnologias;
* criar novos padrões arquiteturais sem decisão;
* acoplar o domínio ao framework;
* acessar banco diretamente pelo frontend;
* tratar decisões pendentes como decisões aprovadas.

---

# 44. Pontos explicitamente fora do escopo

Este documento não define:

* arquitetura da aplicação mobile;
* fluxo detalhado de cada feature;
* telas específicas;
* regras completas de negócio;
* valores permitidos para taxonomias ainda indefinidas;
* política completa de LGPD;
* infraestrutura de deploy;
* cloud provider;
* observabilidade;
* CI/CD;
* estratégia operacional de produção.

Esses tópicos devem ser documentados somente quando formalmente definidos e necessários ao escopo.

---

# 45. Diagrama resumido

```text
                         ONCOOPERA
                             │
                    ┌────────┴────────┐
                    │                 │
             Aplicação Mobile   Backoffice
              fora deste SDD       React
                                      │
                                      │ REST
                                      ▼
                              ┌───────────────┐
                              │    Backend    │
                              │ Node.js + TS  │
                              │      DDD      │
                              └───────┬───────┘
                                      │
                     ┌────────────────┴───────────────┐
                     │                                │
                     ▼                                ▼
               PostgreSQL /                     Integrações
                  PostGIS                         externas
                     │                           quando definidas
                     ▼
                Prisma ORM
```

O diagrama representa apenas uma visão conceitual.

Integrações externas devem ser adicionadas somente quando existirem formalmente no projeto.

---

# 46. Princípio final

O backoffice deve permanecer um cliente administrativo claramente separado das regras centrais do domínio.

A arquitetura deve preservar o fluxo:

```text
Usuário administrativo
        ↓
Backoffice
        ↓
REST API
        ↓
Application
        ↓
Domain
        ↓
Infrastructure
        ↓
Persistência / Integrações
```

Cada camada deve possuir responsabilidade clara.

O sistema deve evoluir através de specifications e decisões arquiteturais explícitas, sem transformar suposições em comportamento oficial.
