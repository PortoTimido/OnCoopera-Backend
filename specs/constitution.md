# OnCoopera — Project Constitution

## 1. Propósito

Esta Constitution define os princípios, restrições e regras fundamentais que devem orientar o desenvolvimento do OnCoopera.

Ela deve ser considerada a referência normativa de mais alto nível do projeto para decisões relacionadas a:

* arquitetura;
* organização do código;
* desenvolvimento de novas funcionalidades;
* qualidade de software;
* segurança;
* privacidade;
* acessibilidade;
* testes;
* documentação;
* Spec Driven Development.

As regras descritas neste documento devem ser respeitadas por desenvolvedores e agentes de inteligência artificial utilizados durante o desenvolvimento.

Este documento não deve conter detalhes específicos de funcionalidades individuais. Esses detalhes devem ser definidos nas respectivas specifications.

---

# 2. Stack tecnológica

## 2.1 Linguagem

TypeScript é a linguagem padrão para os componentes de software desenvolvidos pelo projeto.

Novos códigos de frontend e backend devem utilizar TypeScript.

---

## 2.2 Backend

O backend será desenvolvido sobre Node.js utilizando TypeScript.

O framework de backend ainda não foi definido.

Até que exista uma decisão formal, nenhuma specification deve assumir um framework específico como requisito arquitetural global.

A escolha do framework deve ser registrada por meio de uma Architecture Decision Record — ADR.

---

## 2.3 Aplicação web — Backoffice

O OnCoopera possuirá uma aplicação de backoffice desenvolvida com:

* React;
* TypeScript.

A biblioteca de componentes e/ou biblioteca visual ainda não foi definida.

Enquanto não existir um Design System formal, o desenvolvimento deve:

* priorizar componentes reutilizáveis;
* evitar duplicação desnecessária de componentes;
* preservar consistência visual entre telas;
* seguir boas práticas de componentização;
* utilizar os protótipos existentes no Figma como referência visual.

A existência de um elemento nos protótipos não implica necessariamente a criação de um novo componente.

Antes de criar um componente, deve ser avaliado se a necessidade pode ser atendida por composição ou reutilização de componentes existentes.

---

## 2.4 Aplicação mobile

A aplicação mobile será desenvolvida utilizando:

* React Native;
* Expo;
* TypeScript.

A biblioteca de componentes e/ou biblioteca visual ainda não foi definida.

A organização arquitetural interna do frontend mobile ainda não foi definida e não deve ser presumida pelas specifications.

Sua definição deverá ocorrer antes que seja adotada como padrão global do projeto.

---

## 2.5 Banco de dados

O banco de dados utilizado pelo OnCoopera será PostgreSQL.

O acesso ao banco de dados será realizado utilizando Prisma.

Decisões relacionadas ao modelo de persistência devem respeitar a separação arquitetural definida para o backend.

O domínio da aplicação não deve depender diretamente de detalhes de persistência.

---

# 3. Arquitetura do backend

## 3.1 Domain-Driven Design

O backend do OnCoopera utilizará Domain-Driven Design — DDD — como princípio arquitetural.

A aplicação será organizada, em alto nível, nas seguintes áreas:

```text
api/
application/
documentation/
domain/
infrastructure/
```

Cada área possui uma responsabilidade distinta e essas responsabilidades devem ser preservadas durante o desenvolvimento.

---

## 3.2 Domain

A camada `domain` deve representar as regras e conceitos do domínio da aplicação.

Ela deve concentrar comportamento e regras de negócio que independem de:

* banco de dados;
* framework HTTP;
* controllers;
* bibliotecas de interface;
* mecanismos específicos de infraestrutura;
* detalhes externos à regra de negócio.

O domínio não deve conhecer Prisma, HTTP ou detalhes específicos do framework utilizado pelo backend.

Sempre que possível, regras de negócio devem permanecer independentes de tecnologias externas.

---

## 3.3 Application

A camada `application` deve coordenar os casos de uso da aplicação.

Ela é responsável por organizar a execução das operações necessárias para atender às funcionalidades do sistema.

A camada de aplicação pode utilizar elementos do domínio, mas não deve transferir regras de negócio essenciais para controllers ou para a infraestrutura.

Casos de uso devem possuir responsabilidades claramente delimitadas.

---

## 3.4 API

A camada `api` representa a entrada HTTP da aplicação.

Ela deve ser responsável por atividades relacionadas ao transporte da requisição, como:

* receber requisições;
* interpretar parâmetros;
* encaminhar dados para os casos de uso apropriados;
* transformar resultados em respostas HTTP;
* retornar códigos HTTP apropriados.

A camada de API não deve concentrar regras de negócio.

Controllers ou estruturas equivalentes devem permanecer simples e atuar principalmente como adaptadores entre HTTP e a camada de aplicação.

---

## 3.5 Infrastructure

A camada `infrastructure` deve concentrar detalhes tecnológicos e integrações externas ao domínio.

Isso inclui, quando aplicável:

* persistência;
* Prisma;
* implementações de repositórios;
* acesso a serviços externos;
* mecanismos de infraestrutura.

Dependências externas devem permanecer isoladas sempre que possível.

Mudanças de infraestrutura não devem exigir modificações desnecessárias nas regras centrais do domínio.

---

## 3.6 Documentation

A área `documentation` deve concentrar documentação técnica relacionada ao backend quando essa documentação fizer parte da estrutura da aplicação.

Specifications e Architecture Decision Records pertencentes ao processo de SDD devem permanecer na estrutura específica de documentação definida para o projeto e não devem ser misturados com código de domínio.

---

# 4. Dependências entre camadas

As dependências entre as camadas devem preservar a independência do domínio.

Como princípio geral:

```text
API
 ↓
Application
 ↓
Domain

Infrastructure
      ↓
Application / Domain abstractions
```

O domínio não deve depender da API.

O domínio não deve depender da infraestrutura.

O domínio não deve depender do framework HTTP.

O domínio não deve depender diretamente do Prisma.

A infraestrutura pode implementar contratos necessários às camadas internas.

Detalhes externos devem depender das abstrações internas quando essa separação for necessária para preservar a arquitetura.

---

# 5. API

## 5.1 Estilo de comunicação

A comunicação entre os clientes e o backend será realizada através de REST API.

Serão consumidores da API, entre outros clientes definidos pelo projeto:

* aplicação mobile;
* aplicação web de backoffice.

---

## 5.2 Padrão de rotas

O padrão global de rotas REST ainda não foi definido.

Nenhuma specification deve criar um novo padrão global implicitamente.

Até que exista uma decisão arquitetural, rotas devem ser especificadas apenas quando forem necessárias para a funcionalidade em questão.

Uma convenção global de APIs poderá posteriormente ser estabelecida por ADR ou documentação arquitetural específica.

---

## 5.3 Contratos

Os contratos entre frontend e backend devem ser explícitos.

Uma specification que introduza ou altere uma operação da API deve documentar, quando aplicável:

* objetivo da operação;
* dados de entrada;
* dados de saída;
* possíveis erros;
* critérios de autorização;
* efeitos esperados da operação.

Mudanças que quebrem contratos existentes devem ser identificadas durante a etapa de design da specification.

---

# 6. Autenticação e autorização

## 6.1 Estado atual

Durante as fases iniciais do desenvolvimento, será utilizado um mecanismo simplificado de sessão para validação de acesso.

Esse mecanismo é temporário.

---

## 6.2 MVP final

Na versão final do MVP, a autenticação deverá utilizar JWT.

Specifications desenvolvidas durante o período de autenticação temporária não devem assumir que o mecanismo atual será definitivo.

Regras de negócio não devem ser acopladas ao mecanismo temporário de autenticação.

---

## 6.3 Autorização

Autenticação não deve ser considerada equivalente à autorização.

Sempre que uma funcionalidade possuir restrições de acesso, a specification deve declarar quem pode executar a operação.

Restrições de acesso não devem existir exclusivamente no frontend.

O backend deve ser responsável pela validação efetiva das permissões aplicáveis.

---

# 7. Privacidade e LGPD

O OnCoopera deve ser desenvolvido considerando adequação à Lei Geral de Proteção de Dados — LGPD.

As regras específicas de tratamento, retenção, armazenamento e proteção de dados ainda não foram formalizadas.

Por esse motivo, este documento não estabelece mecanismos técnicos específicos que ainda não tenham sido definidos pelo projeto.

Entretanto, toda nova functionality que envolva dados pessoais deve avaliar explicitamente questões relacionadas a privacidade durante as etapas de requirements e design.

Quando aplicável, a análise deve identificar:

* quais dados são necessários;
* por que os dados são necessários;
* onde os dados serão armazenados;
* quais atores podem acessá-los;
* se os dados serão expostos através da API;
* riscos relacionados à exposição indevida.

Dados pessoais não devem ser coletados ou expostos apenas por conveniência técnica.

Decisões específicas relacionadas à adequação à LGPD deverão ser documentadas quando forem formalmente definidas.

---

# 8. Acessibilidade

A acessibilidade é um requisito transversal do OnCoopera.

Ainda não existe um padrão formal de acessibilidade adotado pelo projeto.

Portanto, nenhuma specification deve declarar conformidade com uma norma ou nível específico que ainda não tenha sido definido.

Mesmo sem uma norma formal estabelecida, novas interfaces devem considerar acessibilidade durante seu design e implementação.

Decisões futuras relacionadas a padrões formais de acessibilidade devem ser incorporadas à arquitetura ou à Constitution quando forem oficialmente adotadas.

---

# 9. Interface e experiência do usuário

## 9.1 Figma

Os protótipos existentes no Figma são atualmente a principal referência visual das interfaces do OnCoopera.

Eles devem orientar:

* estrutura visual;
* hierarquia da informação;
* fluxos;
* composição das telas;
* comportamento esperado da interface quando representado no protótipo.

---

## 9.2 Ausência de Design System formal

O projeto ainda não possui um Design System formal.

Portanto, não devem ser inventadas regras globais de:

* cores;
* tipografia;
* espaçamento;
* componentes;
* breakpoints;
* tokens;
* comportamento visual;

que não estejam formalmente definidas.

Quando padrões começarem a se repetir no projeto, deve ser avaliada sua transformação em componentes reutilizáveis ou em regras formais de Design System.

---

## 9.3 Reutilização

Antes da criação de um novo componente de interface, deve-se verificar:

1. se existe um componente equivalente;
2. se um componente existente pode ser estendido;
3. se a necessidade pode ser resolvida através de composição;
4. se o componente é específico da feature ou compartilhável.

Duplicação visual e comportamental deve ser evitada.

Reutilização não deve ser forçada quando resultar em abstrações excessivamente genéricas ou difíceis de manter.

---

# 10. Qualidade de código

O código do OnCoopera deve priorizar:

* legibilidade;
* coesão;
* baixo acoplamento;
* responsabilidades bem definidas;
* reutilização adequada;
* simplicidade;
* facilidade de manutenção.

Não devem ser introduzidas abstrações sem uma necessidade concreta.

Soluções mais complexas não devem ser escolhidas apenas por serem consideradas arquiteturalmente mais sofisticadas.

A arquitetura deve servir às necessidades do sistema.

---

## 10.1 Responsabilidade

Classes, funções, componentes e módulos devem possuir responsabilidades claras.

Código responsável por interface não deve concentrar regras de negócio.

Código responsável por transporte HTTP não deve concentrar regras de domínio.

Código responsável por persistência não deve definir regras de negócio que pertencem ao domínio.

---

## 10.2 Duplicação

Duplicação significativa de regra de negócio deve ser evitada.

Antes de duplicar comportamento existente, deve ser avaliada a possibilidade de reutilização.

Entretanto, abstrações não devem ser criadas prematuramente apenas para eliminar pequenas semelhanças de implementação.

---

## 10.3 Escopo

Uma implementação deve permanecer dentro do escopo definido pela specification e pelas tasks correspondentes.

Refatorações não relacionadas à funcionalidade não devem ser realizadas automaticamente.

Quando uma alteração fora do escopo for necessária para implementar corretamente uma feature, ela deve ser identificada durante o design ou review.

---

# 11. Testes

## 11.1 Princípio geral

Testes fazem parte da implementação da funcionalidade e não devem ser tratados apenas como uma atividade posterior.

Os critérios de aceite definidos nas specifications devem servir como referência para a estratégia de validação.

---

## 11.2 Backend

Japa será utilizado como ferramenta de testes do backend.

A estratégia completa de cobertura e divisão entre:

* testes unitários;
* testes de integração;
* testes funcionais;

ainda não foi formalmente definida.

Nenhuma taxa mínima de cobertura deve ser assumida enquanto não houver decisão explícita do projeto.

---

## 11.3 Backoffice web

Playwright será utilizado para testes aplicáveis à aplicação web.

A estratégia complementar de testes unitários e de componentes ainda não foi definida.

Playwright não deve ser implicitamente considerado a única ferramenta de testes do frontend até que essa decisão seja formalizada.

---

## 11.4 Aplicação mobile

A estratégia e as ferramentas de testes da aplicação React Native + Expo ainda não foram formalmente definidas.

Nenhuma ferramenta deve ser adotada como padrão global do projeto sem decisão explícita.

---

## 11.5 Correções de bugs

Quando um defeito revelar uma situação que possa ser reproduzida automaticamente, deve ser avaliada a criação de um teste de regressão que impeça a reintrodução do mesmo comportamento.

---

# 12. Spec Driven Development

O OnCoopera adota Spec Driven Development — SDD — como processo obrigatório para o desenvolvimento de funcionalidades relevantes.

O fluxo padrão é:

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

A implementação não deve ser utilizada como substituta da specification.

---

# 13. Requirements

A etapa de `requirements` deve definir o que precisa ser desenvolvido e por quê.

Ela deve priorizar comportamento e necessidade de negócio.

Requirements devem evitar decisões de implementação quando essas decisões pertencerem à etapa de design.

Devem ser identificados, quando aplicável:

* objetivo;
* atores envolvidos;
* requisitos funcionais;
* regras de negócio;
* restrições;
* critérios de aceite;
* cenários relevantes;
* erros esperados;
* requisitos de segurança;
* requisitos de privacidade;
* requisitos de acessibilidade.

Requirements não devem inventar comportamento para preencher lacunas.

Quando uma informação necessária não estiver definida, ela deve ser marcada como pendente e esclarecida antes de impactar a implementação.

---

# 14. Design

A etapa de `design` deve transformar os requirements aprovados em uma proposta técnica de implementação.

Ela deve documentar somente decisões necessárias para implementar a feature.

Dependendo da funcionalidade, o design pode abordar:

* componentes envolvidos;
* camadas afetadas;
* entidades e objetos do domínio;
* casos de uso;
* persistência;
* alterações no banco;
* endpoints;
* contratos;
* integrações;
* componentes de interface;
* tratamento de erros;
* autenticação;
* autorização;
* impactos em funcionalidades existentes;
* estratégia de testes.

O design deve respeitar esta Constitution e os ADRs aceitos pelo projeto.

---

# 15. Review

Nenhuma feature relevante deve avançar diretamente do design para implementação sem passar por review.

A etapa de review deve buscar inconsistências antes da criação das tasks.

O review deve verificar, quando aplicável:

* requisitos ambíguos;
* requisitos contraditórios;
* critérios de aceite incompletos;
* regras de negócio não contempladas;
* violações da arquitetura;
* duplicação de funcionalidade existente;
* impacto em funcionalidades existentes;
* riscos de segurança;
* riscos de privacidade;
* impactos no banco de dados;
* inconsistências entre Figma e specification;
* componentes existentes que podem ser reutilizados;
* decisões técnicas não justificadas.

Problemas encontrados durante review devem ser corrigidos na specification ou design antes da implementação.

---

# 16. Tasks

Após aprovação do design, a implementação deve ser dividida em tasks executáveis.

Uma task deve representar uma unidade de trabalho suficientemente clara para que seja possível determinar quando ela foi concluída.

Tasks devem, quando possível, possuir rastreabilidade com os requirements correspondentes.

Exemplo:

```text
REQ-003
  ↓
T005 — Implementar caso de uso
T006 — Expor endpoint
T007 — Integrar interface
T008 — Validar critério de aceite
```

Tasks excessivamente genéricas devem ser evitadas.

Exemplo inadequado:

```text
Implementar funcionalidade.
```

A divisão de tasks não deve introduzir requisitos que não estejam presentes na specification.

---

# 17. Implementation

A implementação deve seguir:

* requirements;
* design aprovado;
* tasks;
* esta Constitution;
* ADRs aplicáveis.

Durante a implementação, decisões já estabelecidas não devem ser alteradas silenciosamente.

Se surgir uma necessidade que contradiga ou amplie a specification, a documentação correspondente deve ser revisada antes que a nova decisão seja tratada como parte oficial da feature.

---

# 18. Validation

A etapa de validation deve verificar se a implementação atende ao que foi especificado.

A validação deve utilizar como referência:

* requirements;
* critérios de aceite;
* design;
* tasks;
* testes aplicáveis.

Uma task concluída não significa automaticamente que a feature foi validada.

A feature deve ser comparada com a specification final.

---

# 19. Rastreabilidade

Sempre que viável, deve ser possível rastrear:

```text
Requirement
    ↓
Design
    ↓
Task
    ↓
Implementation
    ↓
Validation
```

Um requisito não deve desaparecer silenciosamente entre specification e implementação.

Da mesma forma, funcionalidades não especificadas não devem surgir durante a implementação sem que a specification seja atualizada.

---

# 20. Decisões arquiteturais

Decisões arquiteturais relevantes e transversais devem ser registradas através de Architecture Decision Records — ADRs.

Um ADR deve ser utilizado quando uma decisão:

* afetar múltiplas features;
* estabelecer um padrão arquitetural;
* possuir alternativas relevantes;
* precisar registrar por que determinada escolha foi realizada;
* gerar consequências importantes para o projeto.

Exemplos de decisões apropriadas para ADR:

* escolha do framework de backend;
* estratégia arquitetural dos frontends;
* estratégia de autenticação;
* padrão global de APIs;
* estratégia global de testes;
* adoção de um Design System.

Decisões específicas de apenas uma feature devem permanecer na documentação da própria feature quando não justificarem um ADR.

---

# 21. Informações não definidas

Informações desconhecidas não devem ser inventadas.

Quando uma specification, design ou task depender de uma informação ainda não definida, o agente ou desenvolvedor deve:

1. identificar explicitamente a lacuna;
2. verificar se existe uma decisão anterior aplicável;
3. solicitar esclarecimento quando a decisão depender de requisito ou preferência do projeto;
4. registrar a decisão no artefato apropriado depois de definida.

Valores, regras de negócio, comportamentos, permissões, tecnologias e requisitos não devem ser presumidos apenas para permitir que a implementação continue.

---

# 22. Uso de agentes de inteligência artificial

Agentes de IA utilizados no desenvolvimento do OnCoopera devem considerar esta Constitution como uma restrição obrigatória.

Antes de implementar uma funcionalidade, o agente deve consultar:

1. esta Constitution;
2. ADRs relacionados;
3. requirements da feature;
4. design da feature;
5. tasks aprovadas.

O agente deve analisar o código existente antes de criar novas estruturas.

Ele deve procurar:

* implementações equivalentes;
* padrões existentes;
* componentes reutilizáveis;
* contratos existentes;
* regras de domínio relacionadas;
* possíveis impactos da alteração.

O agente não deve substituir padrões existentes por preferências próprias sem justificativa documentada.

---

## 22.1 Proibições para agentes

Um agente não deve:

* inventar requisitos;
* inventar regras de negócio;
* criar novos padrões globais silenciosamente;
* alterar decisões arquiteturais sem registrar a necessidade;
* introduzir novas bibliotecas sem necessidade documentada;
* executar refatorações fora do escopo apenas por preferência;
* mover regras de domínio para controllers ou componentes de interface;
* ignorar ADRs aplicáveis;
* considerar uma task concluída sem verificar os critérios correspondentes.

---

## 22.2 Dúvidas e ambiguidades

Quando houver ambiguidade capaz de alterar:

* regra de negócio;
* arquitetura;
* comportamento do usuário;
* persistência;
* segurança;
* privacidade;
* contrato da API;

a decisão não deve ser inventada pelo agente.

A dúvida deve ser resolvida antes que a suposição seja incorporada como comportamento oficial do sistema.

---

# 23. Evolução da Constitution

Esta Constitution pode evoluir conforme o projeto amadurecer.

Alterações devem ocorrer quando uma nova regra passar a ser considerada global e obrigatória para o projeto.

Detalhes específicos de implementação não devem ser adicionados à Constitution apenas porque são utilizados por uma única feature.

Antes de adicionar uma nova regra, deve-se perguntar:

> Esta regra deve ser obrigatória também para futuras funcionalidades do OnCoopera?

Se a resposta for não, provavelmente a informação pertence a:

* uma specification;
* um design;
* uma decisão da feature;
* ou um ADR.

---

# 24. Hierarquia documental

Em caso de organização das decisões do projeto, deve ser considerada a seguinte separação:

```text
Constitution
    │
    │ regras globais obrigatórias
    ↓
Architecture Decision Records
    │
    │ decisões arquiteturais
    ↓
Feature Requirements
    │
    │ comportamento necessário
    ↓
Feature Design
    │
    │ solução técnica
    ↓
Feature Tasks
    │
    │ trabalho executável
    ↓
Implementation
```

Uma specification não deve contradizer esta Constitution.

Uma decisão específica de feature não deve contradizer um ADR aceito sem que a decisão arquitetural seja revisada.

---

# 25. Princípio final

O objetivo do processo não é produzir documentação por documentação.

Specifications, ADRs e esta Constitution existem para aumentar:

* clareza;
* previsibilidade;
* rastreabilidade;
* qualidade;
* consistência;
* capacidade de evolução do software.

A documentação deve possuir informação suficiente para orientar decisões e implementação, sem criar complexidade desnecessária.

Quando houver conflito entre velocidade imediata e uma decisão não esclarecida que possa afetar o comportamento ou arquitetura do sistema, a decisão deve ser esclarecida antes de ser transformada em código.
