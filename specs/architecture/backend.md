# Backend Architecture

## 1. Objetivo

Este documento define a arquitetura do backend utilizado pelo backoffice do OnCoopera.

Seu objetivo é estabelecer:

* organização estrutural do backend;
* responsabilidades das camadas;
* direção das dependências;
* separação entre regras de negócio e infraestrutura;
* critérios para criação de novos componentes;
* fluxo de execução das funcionalidades;
* regras para integração com banco de dados e serviços externos.

Este documento complementa a `constitution.md`.

As regras aqui descritas devem ser consideradas durante:

* criação de specifications;
* elaboração de technical designs;
* implementação;
* revisão de código;
* atuação de agentes de inteligência artificial.

---

# 2. Tecnologias definidas

A stack atualmente definida para o backend é:

* Node.js;
* TypeScript;
* PostgreSQL;
* Prisma;
* REST API;
* Zod para validação nas bordas;
* Japa para testes.


---

# 3. Estilo arquitetural

O backend do OnCoopera utilizará princípios de Domain-Driven Design — DDD.

A estrutura principal será dividida em:

```text
api/
application/
documentation/
domain/
infrastructure/
```

Cada camada possui uma responsabilidade específica.

A arquitetura deve buscar manter as regras de negócio independentes de:

* HTTP;
* framework;
* banco de dados;
* Prisma;
* bibliotecas externas;
* detalhes de infraestrutura.

---

# 4. Visão geral

A arquitetura pode ser representada, em alto nível, da seguinte forma:

```text
                    ┌──────────────────────┐
                    │        Client        │
                    │  Backoffice React    │
                    └──────────┬───────────┘
                               │
                             HTTP
                               │
                               ▼
                    ┌──────────────────────┐
                    │         API          │
                    │                      │
                    │ Controllers          │
                    │ Request handling     │
                    │ HTTP mapping         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Application      │
                    │                      │
                    │ Use Cases            │
                    │ Orchestration        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Domain         │
                    │                      │
                    │ Entities             │
                    │ Business Rules       │
                    │ Domain Contracts     │
                    └──────────▲───────────┘
                               │
                         abstractions
                               │
                    ┌──────────┴───────────┐
                    │   Infrastructure     │
                    │                      │
                    │ Prisma               │
                    │ Persistence          │
                    │ External Services    │
                    └──────────────────────┘
```

O fluxo principal de uma requisição deve ocorrer através de:

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
Application
    ↓
API
    ↓
HTTP Response
```

Essa representação descreve o fluxo operacional.

A direção das dependências de código deve preservar a independência das camadas internas.

---

# 5. Regra de dependência

A arquitetura deve seguir o princípio de que camadas externas podem conhecer camadas internas, mas as camadas internas não devem depender de detalhes externos.

Como regra geral:

```text
API
 └── Application
       └── Domain

Infrastructure
 ├── Application contracts
 └── Domain contracts
```

São proibidas dependências como:

```text
Domain → API
Domain → Prisma
Domain → Framework HTTP
Domain → Infrastructure
Application → Controller
Application → React
```

A camada de domínio deve permanecer a mais independente possível.

---

# 6. Estrutura de diretórios

A estrutura principal do backend deve seguir:

```text
src/
├── api/
├── application/
├── documentation/
├── domain/
└── infrastructure/
```

A estrutura interna segue a organização híbrida definida no ADR-006: camadas explícitas com agrupamento por módulo de negócio quando houver arquivos suficientes para justificá-lo.

Novos diretórios não devem ser criados apenas por conveniência.

Sua criação deve representar uma responsabilidade arquitetural clara.

---

# 7. Domain

## 7.1 Responsabilidade

A camada `domain` representa o núcleo das regras de negócio.

Ela deve conter os conceitos que existem independentemente da forma como o sistema:

* recebe requisições;
* persiste informações;
* exibe dados;
* integra serviços externos.

O domínio deve representar o comportamento do sistema e não detalhes técnicos.

---

## 7.2 Conteúdos esperados

Dependendo da necessidade da feature, a camada pode conter:

```text
domain/
├── entities/
├── value-objects/
├── repositories/
├── services/
├── errors/
└── ...
```

Esses diretórios não precisam existir antecipadamente.

Eles devem ser criados somente quando houver elementos correspondentes no domínio.

---

# 8. Entities

Entidades representam elementos do domínio que possuem identidade própria.

Uma entidade pode:

* possuir estado;
* preservar invariantes;
* validar mudanças relevantes;
* encapsular comportamento de negócio.

Entidades não devem funcionar apenas como estruturas passivas de dados quando houver comportamento de domínio associado.

Exemplo conceitual:

```text
Entity
├── identity
├── state
└── business behavior
```

Entidades de domínio não devem depender diretamente de modelos Prisma.

---

# 9. Value Objects

Value Objects podem ser utilizados para representar conceitos definidos por seus valores e não por uma identidade.

Quando utilizados, devem:

* representar conceitos relevantes do domínio;
* encapsular validações associadas ao conceito;
* evitar estados inválidos quando possível.

Sua criação deve ser motivada por necessidade real do domínio.

Não deve ser criado um Value Object para todo campo primitivo apenas para aumentar abstração.

---

# 10. Domain Services

Uma regra de negócio pode ser representada por um Domain Service quando:

* pertence claramente ao domínio;
* envolve múltiplas entidades ou conceitos;
* não possui um responsável natural entre as entidades existentes.

Domain Services não devem ser utilizados como depósito genérico de regras.

Quando uma regra pertence claramente a uma entidade, deve-se preferir mantê-la na própria entidade.

---

# 11. Domain Errors

Erros relacionados a violações de regras do domínio devem poder ser representados sem depender de HTTP.

O domínio não deve retornar erros como:

```text
400 Bad Request
403 Forbidden
404 Not Found
```

Esses são conceitos de transporte.

O domínio pode representar erros semanticamente, como:

```text
InvalidOperation
EntityNotFound
BusinessRuleViolation
```

O mapeamento desses erros para respostas HTTP pertence à camada de API.

A estrutura definitiva de erros ainda deve ser definida pelo projeto.

---

# 12. Repository Contracts

Quando a camada de aplicação ou domínio necessitar de persistência, deve depender de abstrações e não diretamente de Prisma.

Exemplo conceitual:

```text
Application
     │
     ▼
Repository Contract
     ▲
     │
Infrastructure
     │
Prisma Repository
```

O contrato define o que a aplicação necessita.

A infraestrutura define como isso é obtido.

Exemplo conceitual:

```text
UserRepository

- findById()
- findByEmail()
- save()
- delete()
```

A definição dos métodos deve refletir necessidades reais dos casos de uso.

Repositories genéricos excessivamente abstratos devem ser evitados.

---

# 13. Application

## 13.1 Responsabilidade

A camada `application` coordena os casos de uso disponíveis no sistema.

Ela representa ações que o sistema pode executar.

Exemplos conceituais:

```text
CreateUser
UpdateArticle
DeleteSupportPoint
PublishArticle
```

Os nomes reais devem refletir o vocabulário do domínio e as funcionalidades efetivamente existentes.

---

# 14. Use Cases

Use Cases devem possuir uma responsabilidade clara.

Um Use Case deve representar uma intenção da aplicação, e não simplesmente uma operação técnica.

Fluxo esperado:

```text
Controller
    ↓
Use Case
    ↓
Domain
    ↓
Repository Contract
```

O Use Case pode:

* receber dados de entrada;
* consultar repositórios;
* carregar entidades;
* executar regras;
* persistir mudanças;
* retornar um resultado.

---

# 15. O que não pertence ao Use Case

Use Cases não devem conter detalhes relacionados a:

* Request HTTP;
* Response HTTP;
* status code;
* framework;
* Prisma Client;
* componentes frontend.

Um Use Case deve poder ser executado sem que exista necessariamente uma requisição HTTP.

---

# 16. Input e Output

Casos de uso devem possuir contratos de entrada e saída claros.

Exemplo conceitual:

```text
CreateSomethingInput
    ↓
CreateSomethingUseCase
    ↓
CreateSomethingOutput
```

Inputs e outputs são tipos da camada de aplicação e não dependem de HTTP ou Prisma. O sufixo `Input`/`Output` pode ser usado quando elimina ambiguidade; não se cria um DTO adicional que apenas copie outro tipo sem proteger uma fronteira.

---

# 17. API

## 17.1 Responsabilidade

A camada `api` é responsável pela exposição HTTP das funcionalidades da aplicação.

Ela deve atuar como adaptador entre:

```text
HTTP
  ↕
Application
```

A API conhece conceitos como:

* rota;
* request;
* response;
* headers;
* query parameters;
* path parameters;
* body;
* status HTTP.

Esses conceitos não devem contaminar o domínio.

---

# 18. Controllers

Controllers devem permanecer simples.

Sua responsabilidade deve ser limitada, quando aplicável, a:

1. receber a requisição;
2. obter os dados necessários;
3. executar validações relacionadas à entrada;
4. construir o input esperado pelo caso de uso;
5. executar o caso de uso;
6. mapear o resultado para HTTP;
7. retornar a resposta.

Fluxo esperado:

```text
Request
   ↓
Controller
   ↓
Use Case
   ↓
Result
   ↓
Controller
   ↓
Response
```

---

# 19. Regras proibidas em Controllers

Controllers não devem:

* implementar regras de negócio;
* acessar Prisma diretamente;
* executar queries SQL;
* concentrar orquestrações complexas;
* modificar entidades diretamente sem passar pelo fluxo apropriado;
* duplicar regras já existentes no domínio.

Um controller excessivamente grande deve ser considerado um sinal de possível violação arquitetural.

---

# 20. Rotas

O backend será exposto através de REST API.

As rotas seguem o ADR-004 e `conventions.md`: prefixo `/api/v1`, recursos plurais em `kebab-case`, JSON em `camelCase` e paginação por página. Nested resources são usados apenas quando o recurso filho não faz sentido fora do pai ou quando expressam claramente o escopo da operação.

Filtros e ordenações permitidos devem ser declarados por endpoint. Parâmetros desconhecidos ou inválidos devem produzir erro de validação, não ser ignorados silenciosamente.

---

# 21. Validação de entrada

Dados provenientes de clientes externos não devem ser considerados confiáveis.

A entrada da API deve ser validada antes de atingir operações que dependam de sua validade.

A validação de estrutura de entrada pertence às bordas da aplicação.

Exemplos:

* campo obrigatório;
* tipo;
* formato;
* tamanho permitido.

Validações relacionadas a regras de negócio devem permanecer no domínio ou na camada responsável pela respectiva regra.

Exemplo:

```text
"email deve possuir formato válido"
→ validação de entrada / conceito

"email não pode pertencer a outro usuário"
→ regra da aplicação/domínio
```

Zod é utilizado para validar configuração, parâmetros, query, headers relevantes e corpo na borda HTTP. Schemas da API não substituem invariantes do domínio.

---

# 22. Respostas HTTP

A API deve retornar códigos HTTP semanticamente adequados à operação executada.

Recursos individuais são retornados diretamente; coleções usam `{ data, meta }`. Erros usam `application/problem+json` e o formato definido em `conventions.md`. O mapeamento central de erros deve preservar códigos estáveis e nunca expor detalhes internos.

---

# 23. Infrastructure

## 23.1 Responsabilidade

A camada `infrastructure` implementa os detalhes necessários para conectar o sistema ao ambiente externo.

Isso pode incluir:

```text
infrastructure/
├── database/
├── repositories/
├── services/
├── integrations/
└── ...
```

A estrutura deve crescer conforme necessidades reais.

---

# 24. Prisma

Prisma será utilizado como mecanismo de acesso ao PostgreSQL.

Seu uso deve permanecer na camada de infraestrutura.

O Prisma Client não deve ser utilizado diretamente em:

* entidades;
* Value Objects;
* Domain Services;
* controllers;
* componentes da camada de domínio.

Quando um caso de uso precisar persistir ou recuperar informações, deve utilizar a abstração apropriada.

---

# 25. Models Prisma e Domain Entities

Models do Prisma e entidades de domínio representam responsabilidades diferentes.

Um model persistido não deve ser automaticamente tratado como entidade de domínio.

Quando necessário, a infraestrutura deve realizar transformação entre:

```text
Prisma Model
     ↕
Domain Entity
```

Esse processo pode utilizar mappers quando houver necessidade real.

Não é obrigatório criar mappers para toda operação caso não exista distinção relevante entre representação de persistência e aplicação.

---

# 26. Migrations

Alterações estruturais no banco devem ser realizadas através do mecanismo de migrations utilizado em conjunto com Prisma.

---

# 27. Transações

Operações que precisem ser executadas atomicamente devem considerar utilização de transação.

Uma transação deve ser considerada quando uma operação:

```text
A
+
B
+
C
```

precisa possuir comportamento:

```text
tudo é persistido
OU
nada é persistido
```

A estratégia técnica de transações com Prisma deve permanecer na infraestrutura.

---

# 28. Serviços externos

Integrações com serviços externos devem permanecer isoladas da regra central de negócio.

Exemplo conceitual:

```text
Application
      ↓
External Service Contract
      ↑
Infrastructure Implementation
```

O domínio não deve conhecer:

* SDK utilizado;
* protocolo específico;
* credenciais;
* detalhes de transporte.

As integrações concretas existentes serão documentadas nas specifications que dependam delas.

---

# 29. Documentation

A camada `documentation` contém artefatos técnicos servidos ou gerados pela API, como a descrição OpenAPI e exemplos de contrato. Ela não contém regra de negócio e não substitui os documentos do SDD.

A estrutura de SDD permanece separada:

```text
specs/
├── constitution.md
├── architecture/
├── adr/
├── features/
└── templates/
```

Enquanto:

```text
src/documentation/
```

pertence à estrutura arquitetural do backend. Se a documentação OpenAPI for mantida integralmente junto às rotas e schemas, esse diretório pode não existir; a responsabilidade continua sendo da borda da API.

A finalidade específica dessa camada deverá ser detalhada quando houver definição formal no projeto.

---

# 30. Autenticação

O mecanismo do MVP é definido no ADR-005: access token JWT curto e refresh token rotativo em cookies HttpOnly, com sessão revogável no servidor e proteção CSRF.

A arquitetura deve evitar acoplamento das regras de negócio ao mecanismo de autenticação atual.

O fluxo conceitual deve preservar:

```text
Authentication mechanism
       ↓
Authenticated identity
       ↓
Application
```

O domínio não deve depender diretamente de:

* JWT;
* cookies;
* sessão HTTP.

---

# 31. Autorização

Autorização deve ser aplicada no backend.

Uma funcionalidade não deve ser considerada protegida apenas porque determinada ação não aparece no frontend.

Specifications que possuam restrições devem identificar:

* ator;
* operação;
* condição de acesso.

O mecanismo é RBAC baseado em permissões, com negação por padrão. Perfis agrupam permissões, mas os casos de uso verificam a permissão exigida e eventuais restrições sobre o recurso. A matriz funcional deve ser definida na specification de acesso.

---

# 32. Testes

Japa será utilizado para testes do backend.

A estratégia de testes ainda será detalhada em documento ou decisão específica.

A arquitetura deve permitir que:

* regras de domínio sejam testadas isoladamente;
* casos de uso possam ser testados sem depender necessariamente de HTTP;
* infraestrutura possa ser substituída por implementações controladas quando necessário;
* endpoints possam ser testados de forma integrada.

---

# 33. Testabilidade

Uma consequência desejada da separação arquitetural é permitir:

```text
Domain test
→ sem HTTP
→ sem Prisma
→ sem PostgreSQL

Application test
→ sem HTTP
→ dependências substituíveis

API test
→ fluxo HTTP

Infrastructure test
→ integração real quando necessária
```

Essa divisão representa uma diretriz arquitetural.

A estratégia definitiva e quantidade de testes ainda não estão definidas.

---

# 34. Fluxo de uma operação

Uma operação típica deve seguir aproximadamente:

```text
1. Client envia requisição

2. API recebe request

3. API valida estrutura de entrada

4. Controller constrói input

5. Controller chama Use Case

6. Use Case carrega informações necessárias

7. Domain aplica regras de negócio

8. Infrastructure executa persistência

9. Use Case retorna resultado

10. Controller converte resultado para HTTP

11. API retorna response
```

Nem toda operação precisa utilizar todos esses passos.

A complexidade deve ser proporcional à necessidade da funcionalidade.

---

# 35. Exemplo estrutural conceitual

Uma feature hipotética poderia ser organizada desta maneira:

```text
src/

├── api/
│   └── controllers/
│       └── create-example-controller.ts
│
├── application/
│   └── use-cases/
│       └── create-example.ts
│
├── domain/
│   ├── entities/
│   │   └── example.ts
│   │
│   └── repositories/
│       └── example-repository.ts
│
└── infrastructure/
    └── repositories/
        └── prisma-example-repository.ts
```

Com fluxo:

```text
CreateExampleController
        ↓
CreateExampleUseCase
        ↓
Example
        ↓
ExampleRepository
        ↑
PrismaExampleRepository
        ↓
PostgreSQL
```

Esse exemplo representa responsabilidades arquiteturais e não impõe os nomes utilizados pelas funcionalidades reais.

---

# 36. Organização por domínio

A organização é híbrida, conforme ADR-006. As camadas principais continuam explícitas e, dentro delas, módulos de negócio agrupam arquivos relacionados quando isso melhora navegação e isolamento.

Exemplo evolutivo:

```text
domain/articles/
application/articles/
api/articles/
infrastructure/articles/
```

Uma feature inicial pequena pode permanecer diretamente na camada. A criação de módulos não autoriza dependências circulares nem deep imports em internals de outro módulo.

---

# 37. Dependências entre módulos

Módulos não devem depender livremente de detalhes internos de outros módulos.

Quando funcionalidades precisarem se comunicar, a dependência deve ocorrer através de contratos ou interfaces apropriadas ao desenho definido.

Acoplamento circular deve ser evitado.

Uma feature não deve acessar diretamente estruturas internas de outra apenas por conveniência.

---

# 38. Complexidade proporcional

DDD não deve ser interpretado como obrigação de criar todas as abstrações possíveis.

Uma funcionalidade simples não necessita obrigatoriamente de:

* Entity;
* Value Object;
* Domain Service;
* Factory;
* Repository;
* Mapper;

simultaneamente.

A estrutura utilizada deve refletir a complexidade real da regra implementada.

O objetivo é proteger o domínio e melhorar a manutenção, não maximizar o número de camadas ou arquivos.

---

# 39. Critério para nova abstração

Uma nova abstração deve resolver um problema concreto.

Antes de criar:

```text
interface
repository
factory
service
mapper
adapter
```

deve existir uma responsabilidade ou necessidade arquitetural que justifique sua existência.

Abstrações criadas apenas por possibilidade futura devem ser evitadas.

---

# 40. Regras para agentes de IA

Antes de implementar alterações no backend, o agente deve:

1. consultar a Constitution;
2. consultar este documento;
3. consultar ADRs aplicáveis;
4. consultar a specification da feature;
5. analisar implementações semelhantes no código existente.

O agente deve respeitar a separação:

```text
HTTP
→ API

orquestração
→ Application

regra de negócio
→ Domain

persistência e integrações
→ Infrastructure
```

---

# 41. O agente não deve

Um agente não deve:

* colocar regra de negócio em controller;
* utilizar Prisma diretamente no domínio;
* utilizar Prisma em entidades;
* acoplar Use Cases ao framework HTTP;
* criar abstrações sem necessidade;
* inventar padrões de API;
* inventar formatos globais de resposta;
* inventar convenções de rotas;
* inventar regras de autorização;
* criar dependências entre módulos sem avaliar impacto arquitetural.

Se uma decisão necessária ainda não estiver definida, ela deve ser tratada como pendência arquitetural.

---

# 42. Princípio final

A arquitetura do backend deve proteger as regras de negócio contra dependências desnecessárias de tecnologia.

O fluxo deve permanecer compreensível:

```text
API
    ↓
Application
    ↓
Domain
    ↑
Infrastructure
```

A adoção de DDD não deve aumentar artificialmente a complexidade do sistema.

Cada abstração deve existir porque resolve uma necessidade concreta de:

* domínio;
* separação de responsabilidades;
* testabilidade;
* manutenção;
* integração;
* evolução do software.
