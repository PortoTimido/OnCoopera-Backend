# SDD Conventions

## 1. Objetivo

Este documento define as convenções utilizadas nos artefatos de Spec Driven Development — SDD — do backoffice do OnCoopera.

Seu objetivo é garantir consistência na criação e manutenção de:

* requirements;
* designs;
* reviews;
* tasks;
* decisions;
* ADRs;
* documentos de arquitetura.

Estas convenções determinam:

* estrutura de diretórios;
* nomenclatura de arquivos;
* identificação de requisitos;
* identificação de critérios de aceite;
* identificação de tasks;
* referências entre documentos;
* estados dos artefatos;
* nível de detalhe esperado;
* regras para informações ainda não definidas.

Este documento não define regras de negócio ou decisões arquiteturais.

---

# 2. Estrutura do SDD

Os documentos do SDD devem permanecer centralizados no diretório:

```text
.sdd/
```

A estrutura principal é:

```text
.sdd/
├── constitution.md
├── conventions.md
│
├── architecture/
│   ├── backend.md
│   ├── frontend.md
│   ├── database.md
│   └── api.md
│
├── adr/
│
└── specs/
```

Novos diretórios de primeiro nível não devem ser criados sem uma responsabilidade documental clara.

---

# 3. Estrutura de uma feature

Cada funcionalidade especificada deve possuir seu próprio diretório dentro de:

```text
.sdd/specs/
```

Exemplo:

```text
.sdd/specs/article-management/
```

A estrutura padrão de uma feature é:

```text
article-management/
├── requirements.md
├── design.md
├── review.md
├── tasks.md
└── decisions.md
```

Nem todo arquivo precisa necessariamente possuir conteúdo desde o início.

Os documentos devem ser criados conforme a feature avança pelo fluxo de SDD.

---

# 4. Fluxo dos artefatos

Toda feature relevante deve seguir:

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

Os documentos devem acompanhar esse fluxo.

Uma etapa posterior não deve introduzir silenciosamente requisitos que deveriam ter sido definidos em uma etapa anterior.

---

# 5. Nomenclatura de diretórios

Diretórios relacionados a specifications devem utilizar:

```text
kebab-case
```

Exemplos válidos:

```text
article-management
support-point-management
user-management
category-management
```

Evitar:

```text
ArticleManagement
article_management
Article Management
articlesFeature
```

O nome deve representar o domínio ou funcionalidade e não detalhes técnicos da implementação.

Evitar nomes como:

```text
new-page
crud-screen
controller-feature
database-update
```

---

# 6. Nomenclatura dos arquivos de uma feature

Os arquivos padrão devem utilizar os seguintes nomes:

```text
requirements.md
design.md
review.md
tasks.md
decisions.md
```

Esses nomes não devem ser substituídos por variações como:

```text
req.md
technical.md
todo.md
implementation.md
notes.md
```

A padronização permite que desenvolvedores e agentes localizem rapidamente cada artefato.

---

# 7. Idioma

A documentação do SDD deve ser escrita de forma consistente dentro de cada documento.

Termos técnicos amplamente utilizados na arquitetura podem permanecer em inglês, como:

* Use Case;
* Repository;
* Entity;
* Value Object;
* Controller;
* Domain;
* Application;
* Infrastructure;
* endpoint;
* request;
* response.

Os textos explicativos e regras devem priorizar clareza e consistência.

Não deve haver tradução forçada de conceitos técnicos quando isso tornar o documento menos compreensível.

---

# 8. Escrita dos requisitos

Requirements devem descrever:

> o que o sistema deve fazer

e não:

> como o sistema será implementado.

Um requirement deve ser:

* específico;
* verificável;
* compreensível;
* independente de detalhes técnicos quando possível;
* rastreável.

Evitar requisitos vagos como:

```text
REQ-001 — Melhorar a tela de artigos.
```

Preferir:

```text
REQ-001 — O administrador deve conseguir visualizar os artigos cadastrados no sistema.
```

---

# 9. Identificação de requisitos

Cada requisito funcional deve possuir um identificador.

O padrão é:

```text
REQ-{NNN}
```

Exemplo:

```text
REQ-001
REQ-002
REQ-003
```

A numeração deve começar em `001` dentro de cada specification.

---

# 10. Numeração de requisitos

Os IDs são locais à feature.

Por exemplo:

```text
specs/article-management/
    REQ-001
    REQ-002

specs/user-management/
    REQ-001
    REQ-002
```

Não é necessário manter uma numeração global entre todas as specifications.

Quando for necessário referenciar um requisito fora do diretório da própria feature, deve-se incluir também a identificação da feature.

Exemplo:

```text
article-management/REQ-003
```

---

# 11. Permanência dos IDs

Depois que um requisito tiver sido utilizado por:

* design;
* task;
* teste;
* implementação;
* documentação;

seu identificador não deve ser reutilizado para outro requisito.

Se `REQ-003` deixar de existir, deve-se preferir registrar sua remoção quando isso for relevante em vez de atribuir o mesmo número a um requisito diferente.

Isso preserva rastreabilidade.

---

# 12. Estrutura de um requisito

O formato recomendado é:

```markdown
## REQ-001 — Título

Descrição objetiva do comportamento esperado.
```

Quando necessário, podem existir subseções:

```markdown
### Regras

### Restrições

### Exceções
```

Não é obrigatório adicionar essas subseções quando não houver informação relevante.

---

# 13. Regras de negócio

Regras de negócio importantes devem possuir identificação quando precisarem ser rastreadas individualmente.

O padrão é:

```text
BR-{NNN}
```

onde `BR` representa Business Rule.

Exemplo:

```text
BR-001
BR-002
```

Exemplo:

```markdown
## BR-001 — Publicação de artigo

Um artigo somente pode ser publicado quando possuir as informações obrigatórias definidas pela funcionalidade.
```

Regras simples que já estejam completamente expressas em um requirement não precisam ser duplicadas apenas para possuir um `BR`.

---

# 14. Critérios de aceite

Critérios de aceite devem utilizar:

```text
AC-{NNN}
```

Exemplo:

```text
AC-001
AC-002
AC-003
```

Os IDs são locais à feature.

---

# 15. Estrutura dos critérios de aceite

Sempre que for adequado ao comportamento, preferir:

```text
DADO
QUANDO
ENTÃO
```

Exemplo:

```markdown
### AC-001

DADO que existem artigos cadastrados  
QUANDO o administrador acessar a listagem de artigos  
ENTÃO os registros disponíveis devem ser apresentados.
```

O formato não deve ser forçado quando não melhorar a compreensão.

Um critério de aceite deve ser verificável.

Evitar:

```text
A tela deve funcionar corretamente.
```

---

# 16. Relação entre requisitos e critérios de aceite

Um requisito pode possuir um ou mais critérios de aceite.

Exemplo:

```markdown
## REQ-003 — Exclusão

O administrador deve conseguir excluir um artigo quando a operação for permitida.

### Critérios de aceite

#### AC-005

...

#### AC-006

...
```

Quando um critério estiver diretamente associado a um requisito, essa relação deve permanecer clara no documento.

---

# 17. Requisitos não funcionais

Quando existirem requisitos não funcionais específicos da feature, deve-se utilizar:

```text
NFR-{NNN}
```

Exemplo:

```text
NFR-001
```

Eles podem representar aspectos como:

* segurança;
* desempenho;
* acessibilidade;
* privacidade;
* disponibilidade;

quando houver uma definição concreta.

Não devem ser criados NFRs genéricos apenas para repetir a Constitution.

---

# 18. Informações pendentes

Informações ainda não definidas devem ser explicitamente identificadas.

O padrão é:

```text
TBD
```

ou:

```text
PENDENTE
```

Dentro do projeto deve-se utilizar uma única forma de maneira consistente.

Exemplo:

```markdown
> PENDENTE: definir comportamento quando o artigo já possuir vínculos.
```

Uma pendência deve explicar objetivamente o que precisa ser esclarecido.

Evitar:

```text
PENDENTE: verificar.
```

---

# 19. Proibição de suposições

Uma informação desconhecida não deve ser preenchida com uma decisão considerada "provável".

Se uma definição pode alterar:

* regra de negócio;
* comportamento;
* segurança;
* persistência;
* contrato de API;
* arquitetura;

ela deve permanecer como pendência até ser definida.

Agentes de IA devem tratar essa regra como obrigatória.

---

# 20. Design

O `design.md` deve descrever:

> como os requirements aprovados serão implementados.

O design pode conter, quando aplicável:

```text
Frontend
Backend
Domain
Application
API
Database
Authorization
Validation
Error handling
Testing
```

A ausência de impacto em determinada área não exige a criação de uma seção vazia.

---

# 21. Referência aos requisitos no Design

Decisões técnicas devem ser relacionadas aos requisitos que atendem quando isso melhorar a rastreabilidade.

Exemplo:

```markdown
## Listagem de artigos

Atende:

- REQ-001
- REQ-002
```

Ou:

```text
REQ-001 → ArticleList
REQ-002 → ListArticlesUseCase
```

---

# 22. Design não deve adicionar requisito

O `design.md` não deve criar comportamentos que não existam em `requirements.md`.

Se durante o design for identificada uma necessidade funcional nova:

```text
design
   ↓
novo requisito encontrado
   ↓
requirements.md deve ser atualizado
   ↓
design continua
```

A decisão não deve permanecer exclusivamente no design.

---

# 23. Diagramas

Diagramas podem ser utilizados quando aumentarem a compreensão.

Quando representáveis textualmente, preferir Mermaid.

Exemplo:

```text
flowchart TD
    Controller --> UseCase
    UseCase --> Repository
    Repository --> Prisma
```

Diagramas não devem existir apenas por formalidade.

---

# 24. Review

O resultado da etapa de review deve ser registrado em:

```text
review.md
```

O review deve avaliar requirements e design antes da criação das tasks.

---

# 25. Estrutura do Review

O review deve considerar, quando aplicável:

```markdown
# Review

## Requirements
- ...

## Architecture
- ...

## Security
- ...

## Privacy
- ...

## Reuse
- ...

## Open Questions
- ...

## Result
...
```

Somente seções relevantes devem ser utilizadas.

---

# 26. Resultado do Review

O review deve possuir um estado explícito.

Valores permitidos:

```text
APPROVED
APPROVED_WITH_NOTES
CHANGES_REQUIRED
```

Significado:

### APPROVED

Requirements e design podem avançar para tasks.

### APPROVED_WITH_NOTES

Existem observações que não impedem a implementação.

### CHANGES_REQUIRED

Existem problemas que devem ser corrigidos antes da criação das tasks.

---

# 27. Tasks

Tasks devem representar unidades concretas e executáveis de trabalho.

O padrão de identificação é:

```text
T-{NNN}
```

Exemplo:

```text
T-001
T-002
T-003
```

A numeração é local à feature.

---

# 28. Escrita das Tasks

Uma task deve começar com verbo de ação.

Preferir:

```text
T-001 — Criar ListArticlesUseCase
T-002 — Implementar endpoint de listagem
T-003 — Criar componente de filtros
T-004 — Adicionar teste do REQ-003
```

Evitar:

```text
T-001 — Artigos
T-002 — Backend
T-003 — Tela
```

---

# 29. Tamanho das Tasks

Uma task deve representar uma unidade de trabalho que possa ser:

* entendida isoladamente;
* implementada;
* validada;
* marcada como concluída.

Tasks muito grandes devem ser divididas.

Evitar:

```text
T-001 — Implementar CRUD completo de artigos.
```

Quando o trabalho possuir diversas responsabilidades independentes.

---

# 30. Dependências entre Tasks

Quando uma task depender de outra, isso deve ser explícito.

Exemplo:

```markdown
### T-004 — Integrar listagem

**Depende de:** T-002
```

Não é necessário declarar dependências óbvias quando não acrescentarem valor.

---

# 31. Rastreabilidade das Tasks

Quando aplicável, cada task deve indicar quais requisitos atende.

Exemplo:

```markdown
### T-004 — Implementar exclusão

**Atende:** REQ-004, AC-007
```

Uma task puramente técnica pode não possuir associação direta com um único requirement.

Nesse caso, sua justificativa deve estar clara no design.

---

# 32. Status das Tasks

Tasks podem utilizar:

```text
TODO
IN_PROGRESS
DONE
BLOCKED
```

Quando representadas como checklist, utilizar:

```markdown
- [ ] T-001 — ...
- [x] T-002 — ...
```

O projeto não precisa manter simultaneamente checkbox e campo textual de status se isso gerar duplicação.

---

# 33. Tasks bloqueadas

Quando uma task estiver bloqueada, o motivo deve ser informado.

Exemplo:

```markdown
### T-005 — Implementar autorização

**Status:** BLOCKED

**Motivo:** mecanismo de autorização ainda não definido.
```

Não utilizar `BLOCKED` sem explicar a dependência.

---

# 34. Decisions

Decisões específicas de uma feature devem ser registradas em:

```text
decisions.md
```

Essas decisões não devem ser confundidas com ADRs.

---

# 35. Identificação de Decisions

O padrão é:

```text
DEC-{NNN}
```

Exemplo:

```text
DEC-001
DEC-002
```

---

# 36. Estrutura de uma Decision

O formato recomendado é:

```markdown
## DEC-001 — Título

### Contexto

...

### Decisão

...

### Motivo

...
```

Quando relevante:

```markdown
### Consequências

...
```

---

# 37. Decision versus ADR

Usar `DEC` quando a decisão:

* pertence a uma feature;
* possui impacto local;
* não define padrão para o projeto inteiro.

Usar ADR quando a decisão:

* é arquitetural;
* afeta múltiplas features;
* estabelece padrão global;
* possui alternativas relevantes;
* deve permanecer como histórico arquitetural.

Regra prática:

```text
local → DEC
global → ADR
```

---

# 38. ADRs

Architecture Decision Records devem ficar em:

```text
.sdd/adr/
```

O padrão de nome é:

```text
ADR-{NNN}-{slug}.md
```

Exemplo:

```text
ADR-001-backend-framework.md
ADR-002-frontend-architecture.md
ADR-003-api-conventions.md
```

---

# 39. Numeração dos ADRs

ADRs possuem numeração global dentro do projeto.

Exemplo:

```text
ADR-001
ADR-002
ADR-003
```

Um número de ADR não deve ser reutilizado.

---

# 40. Status de ADR

Os estados permitidos são:

```text
PROPOSED
ACCEPTED
SUPERSEDED
REJECTED
DEPRECATED
```

### PROPOSED

Decisão ainda em avaliação.

### ACCEPTED

Decisão aprovada e vigente.

### SUPERSEDED

Substituída por outro ADR.

### REJECTED

Alternativa formalmente analisada e não adotada.

### DEPRECATED

Decisão não deve mais ser utilizada, mesmo que ainda não exista substituição direta.

---

# 41. ADR substituído

Quando um ADR substituir outro, a relação deve ser explícita.

Exemplo:

```markdown
Status: SUPERSEDED

Superseded by: ADR-008
```

E no novo:

```markdown
Supersedes: ADR-003
```

ADRs antigos não devem ser apagados apenas porque uma decisão mudou.

Eles preservam o histórico arquitetural.

---

# 42. Architecture

Documentos de arquitetura ficam em:

```text
.sdd/architecture/
```

Eles representam o estado arquitetural atualmente adotado.

Exemplos:

```text
backend.md
frontend.md
database.md
api.md
```

ADRs explicam:

> por que determinada decisão foi tomada.

Architecture documents explicam:

> como a arquitetura funciona atualmente.

---

# 43. Referências entre documentos

Referências devem utilizar o identificador do artefato quando disponível.

Exemplo:

```text
Conforme ADR-002...
```

```text
Atende REQ-004.
```

```text
Implementado por T-007.
```

Quando a referência estiver fora da feature atual, incluir contexto.

Exemplo:

```text
user-management/REQ-003
```

---

# 44. Links

Quando útil, referências podem utilizar links Markdown relativos.

Exemplo:

```markdown
[ADR-001](../../adr/ADR-001-backend-framework.md)
```

Evitar caminhos absolutos dependentes da máquina do desenvolvedor.

---

# 45. Cabeçalho dos documentos

Specifications devem possuir informações mínimas de identificação.

Formato recomendado:

```markdown
# Nome da Feature

**Status:** DRAFT
```

Outros metadados devem ser adicionados somente se trouxerem valor ao processo.

Evitar excesso de informações administrativas que precisem ser atualizadas manualmente.

---

# 46. Status de Specification

Os estados permitidos são:

```text
DRAFT
IN_REVIEW
APPROVED
IMPLEMENTING
VALIDATING
COMPLETED
BLOCKED
```

Fluxo esperado:

```text
DRAFT
  ↓
IN_REVIEW
  ↓
APPROVED
  ↓
IMPLEMENTING
  ↓
VALIDATING
  ↓
COMPLETED
```

`BLOCKED` pode ocorrer enquanto existir uma dependência que impeça a continuidade.

---

# 47. DRAFT

`DRAFT` significa que requirements ou design ainda estão sendo elaborados.

O conteúdo pode sofrer alterações relevantes.

Não deve ser tratado como contrato definitivo de implementação.

---

# 48. APPROVED

Uma specification `APPROVED` passou pela etapa de review e está apta para geração das tasks e implementação.

Aprovação não significa que a implementação já existe.

---

# 49. COMPLETED

Uma specification somente deve ser considerada `COMPLETED` depois da etapa de validation.

Isso significa que:

* implementação foi concluída;
* critérios de aceite aplicáveis foram verificados;
* documentação está coerente com o comportamento implementado.

---

# 50. Alteração de Specification durante implementação

Specifications são documentos vivos.

Se durante implementação for necessário alterar um comportamento:

```text
implementation
     ↓
mudança necessária
     ↓
requirements/design
     ↓
review da alteração quando necessário
     ↓
tasks
     ↓
implementation
```

Não manter documentação conscientemente diferente do código.

---

# 51. Documentação do estado atual

O SDD deve representar o comportamento aceito atualmente.

Não utilizar specifications como diário de desenvolvimento.

Histórico relevante de decisões deve permanecer em:

* Git;
* ADR;
* decisions.md;

conforme o tipo da informação.

---

# 52. Conteúdo objetivo

Os documentos devem ser detalhados o suficiente para orientar a implementação, mas não devem repetir a mesma informação em vários arquivos.

Preferir:

```text
requirements → comportamento
design       → solução técnica
tasks        → execução
decisions    → decisões locais
ADR          → decisões arquiteturais
```

---

# 53. Evitar duplicação documental

Quando uma regra já estiver definida na Constitution, não é necessário copiá-la integralmente para cada specification.

Quando uma arquitetura já estiver definida em `architecture/backend.md`, uma feature deve apenas referenciá-la e documentar seus impactos específicos.

Exemplo:

```markdown
O backend seguirá a arquitetura definida em `architecture/backend.md`.

Impactos específicos desta feature:
- novo Use Case;
- novo Repository;
- novo endpoint.
```

---

# 54. Nível de detalhe

O nível de detalhe deve ser proporcional à complexidade.

Uma funcionalidade simples pode possuir uma specification pequena.

Uma funcionalidade complexa pode exigir:

* múltiplos requirements;
* diagramas;
* decisões;
* cenários de erro;
* regras de negócio;
* impactos em diferentes camadas.

Não aumentar artificialmente a documentação para obedecer a um tamanho esperado.

---

# 55. Termos absolutos

Usar termos normativos com consistência.

### DEVE

Regra obrigatória.

### NÃO DEVE

Comportamento proibido.

### PODE

Comportamento opcional.

### RECOMENDADO

Preferência que pode ser contrariada quando existir justificativa.

Evitar utilizar "deve" para sugestões não obrigatórias.

---

# 56. Exemplos

Exemplos devem ser claramente reconhecíveis como exemplos e não como requisitos reais.

Quando utilizar nomes hipotéticos, sinalizar quando necessário.

Uma specification não deve ganhar comportamento funcional apenas porque ele apareceu em um exemplo.

---

# 57. Código em documentos

Trechos de código podem ser utilizados quando melhorarem a clareza do design.

Não utilizar o SDD como substituto do código-fonte.

Preferir pseudocódigo ou assinaturas quando o objetivo for explicar uma decisão arquitetural.

---

# 58. Convenções temporárias

Uma convenção ainda não aprovada não deve ser tratada como padrão global.

Quando necessário, registrar:

```text
PENDENTE
```

ou criar um ADR `PROPOSED`.

Um agente não deve transformar uma solução utilizada em uma única feature em convenção global automaticamente.

---

# 59. Novas dependências

Quando uma feature exigir uma biblioteca externa ainda não utilizada no projeto, essa necessidade deve aparecer no `design.md`.

Se a biblioteca implicar decisão arquitetural relevante ou uso transversal, deve ser avaliada através de ADR.

Agentes não devem adicionar dependências apenas por preferência.

---

# 60. Estrutura recomendada de requirements.md

```markdown
# Nome da Feature

**Status:** DRAFT

## 1. Objetivo

...

## 2. Escopo

### Incluído

...

### Fora de escopo

...

## 3. Atores

...

## 4. Requirements

### REQ-001 — ...

...

## 5. Business Rules

### BR-001 — ...

...

## 6. Critérios de aceite

### AC-001

...

## 7. Requisitos não funcionais

### NFR-001 — ...

...

## 8. Pendências

...
```

Somente seções aplicáveis devem permanecer.

---

# 61. Estrutura recomendada de design.md

```markdown
# Nome da Feature — Technical Design

## 1. Referências

- Requirements: `requirements.md`
- Architecture:
  - ...
- ADRs:
  - ...

## 2. Visão geral

...

## 3. Fluxo

...

## 4. Frontend

...

## 5. Backend

...

## 6. Domain

...

## 7. API

...

## 8. Database

...

## 9. Segurança e autorização

...

## 10. Tratamento de erros

...

## 11. Estratégia de testes

...

## 12. Impactos

...

## 13. Pendências

...
```

Seções sem impacto devem ser omitidas.

---

# 62. Estrutura recomendada de review.md

```markdown
# Review

## Requirements

...

## Architecture

...

## Security

...

## Privacy

...

## Reuse

...

## Open Questions

...

## Result

**Status:** APPROVED | APPROVED_WITH_NOTES | CHANGES_REQUIRED

...
```

---

# 63. Estrutura recomendada de tasks.md

```markdown
# Implementation Tasks

## Backend

- [ ] T-001 — ...

## Frontend

- [ ] T-002 — ...

## Database

- [ ] T-003 — ...

## Tests

- [ ] T-004 — ...
```

As categorias devem refletir o trabalho real da feature.

Não é necessário criar seções vazias.

---

# 64. Estrutura recomendada de decisions.md

```markdown
# Feature Decisions

## DEC-001 — Título

### Contexto

...

### Decisão

...

### Motivo

...

### Consequências

...
```

---

# 65. Estrutura recomendada de ADR

```markdown
# ADR-{NNN} — Título

**Status:** PROPOSED

## Contexto

...

## Alternativas consideradas

### Alternativa A

...

### Alternativa B

...

## Decisão

...

## Motivos

...

## Consequências

### Positivas

...

### Negativas

...
```

A estrutura pode ser simplificada quando uma seção não acrescentar informação relevante.

---

# 66. Rastreabilidade mínima

O processo deve permitir, quando aplicável, rastrear:

```text
REQ
 ↓
AC / BR
 ↓
Design
 ↓
Task
 ↓
Implementation
 ↓
Validation
```

Não é obrigatório construir uma matriz de rastreabilidade separada para todas as features.

A rastreabilidade pode ser realizada através das referências existentes nos próprios artefatos.

---

# 67. Agentes de inteligência artificial

Ao trabalhar com uma specification, agentes devem consultar os documentos na seguinte ordem:

```text
1. constitution.md
2. conventions.md
3. architecture relevante
4. ADRs aplicáveis
5. requirements.md
6. design.md
7. review.md
8. tasks.md
9. decisions.md
```

Nem todos os arquivos precisam ser carregados quando não forem relevantes, mas Constitution, Conventions e os documentos da feature devem ser respeitados.

---

# 68. Comportamento diante de inconsistências

Se dois documentos apresentarem informações incompatíveis, o agente não deve escolher arbitrariamente uma delas.

A inconsistência deve ser identificada.

Como orientação de precedência normativa:

```text
Constitution
     ↓
Architecture + ADRs vigentes
     ↓
Requirements
     ↓
Design
     ↓
Decisions
     ↓
Tasks
```

Essa ordem não significa que um documento superior possa definir silenciosamente requisitos específicos de feature.

Ela representa a prioridade quando existir uma contradição real.

---

# 69. Definition of Ready

Uma feature está pronta para implementação quando:

* requirements relevantes estão definidos;
* critérios de aceite necessários estão definidos;
* pendências bloqueantes foram resolvidas;
* design técnico foi elaborado;
* ADRs necessários foram definidos;
* review não possui `CHANGES_REQUIRED`;
* tasks executáveis foram criadas.

Uma feature com decisões essenciais em aberto não deve ser considerada pronta.

---

# 70. Definition of Done

Uma feature pode ser considerada concluída quando:

* tasks necessárias estão concluídas;
* implementação corresponde aos requirements;
* critérios de aceite foram validados;
* testes definidos no design foram executados;
* alterações necessárias na documentação foram realizadas;
* não existem divergências conhecidas entre specification e implementação.

Somente então seu status deve passar para:

```text
COMPLETED
```

---

# 71. Princípio final

As convenções existem para tornar o SDD previsível e rastreável, não burocrático.

Quando uma regra documental não aumentar:

* clareza;
* consistência;
* rastreabilidade;
* segurança da implementação;
* compreensão da feature;

ela não deve ser aplicada apenas por formalidade.

A documentação deve ser suficientemente estruturada para permitir que outro desenvolvedor ou agente compreenda:

```text
o que precisa ser feito
        ↓
por que precisa ser feito
        ↓
como foi decidido implementar
        ↓
qual trabalho precisa ser executado
        ↓
como saber se está correto
```
