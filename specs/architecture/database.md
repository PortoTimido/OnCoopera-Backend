# Arquitetura de Dados

## 1. Objetivo

Este documento define os princípios e regras arquiteturais relacionados à persistência de dados utilizada pelo backoffice do OnCoopera.

Seu objetivo é orientar:

* modelagem de dados;
* alterações no schema;
* uso do Prisma ORM;
* integridade referencial;
* migrations;
* transações;
* concorrência;
* indexação;
* geolocalização;
* tratamento de dados sensíveis;
* testes relacionados à persistência;
* análise de impacto de novas specifications.

Este documento complementa:

* `constitution.md`;
* `architecture/backend.md`;
* ADRs aplicáveis.

O banco de dados é compartilhado pelos componentes do OnCoopera. Entretanto, este documento governa especificamente as decisões e alterações de persistência realizadas no contexto das funcionalidades contempladas pelo SDD do backoffice.

---

# 2. Tecnologias

A persistência utiliza:

* PostgreSQL;
* PostGIS;
* Prisma ORM.

O Prisma é responsável por:

* definição do schema da aplicação;
* geração do Prisma Client;
* gerenciamento das migrations.

O schema atual encontra-se em:

```text
db/prisma/schema.prisma
```

O histórico de migrations encontra-se em:

```text
db/prisma/migrations/
```

O schema Prisma e as migrations versionadas representam a estrutura oficial do banco para desenvolvimento e evolução da aplicação.

Alterações realizadas manualmente diretamente no banco não substituem alterações formalizadas através de migration.

---

# 3. Papel do banco na arquitetura

O banco de dados é um mecanismo de persistência e integridade.

Ele não define sozinho:

* regras completas de domínio;
* permissões;
* autorização;
* comportamento da aplicação;
* fluxos de negócio;
* estados permitidos quando estes dependem de contexto;
* comportamento da interface.

A existência de uma coluna ou relacionamento no schema não deve ser interpretada automaticamente como autorização para determinada operação.

Da mesma forma, a existência de uma tabela não determina quais atores podem consultar ou modificar seus registros.

Essas decisões pertencem às respectivas specifications e regras de domínio.

---

# 4. Domínios persistidos atualmente

O schema atual possui dados relacionados aos seguintes contextos:

| Contexto              | Tabelas principais                                           |
| --------------------- | ------------------------------------------------------------ |
| Identidade            | `usuario`, `paciente`, `administrador`                       |
| Acesso administrativo | `perfil_administrativo`, `administrador_perfil`              |
| Acompanhamento        | `registro_diario`, `registro_sintoma`, `consulta`            |
| Rede de apoio         | `apoio`, `endereco`, `horario_funcionamento`, `apoio_imagem` |
| Conteúdo              | `artigo`, `categoria`, `tag` e tabelas de associação         |

Esta lista representa o estado atual conhecido do modelo e não constitui uma lista fechada de domínios futuros.

Novos contextos persistidos devem surgir a partir de requirements e design aprovados.

---

# 5. Convenções de nomenclatura

## 5.1 Banco de dados

Tabelas e colunas utilizam:

```text
snake_case
```

e nomes em português.

Exemplo conceitual:

```text
perfil_administrativo
data_publicacao
registro_sintoma
```

---

## 5.2 Prisma

Models Prisma utilizam:

```text
PascalCase
```

Campos Prisma utilizam:

```text
camelCase
```

Quando o nome lógico do Prisma diferir do nome físico no PostgreSQL, devem ser utilizados:

```text
@@map
@map
```

conforme aplicável.

A diferença entre nomenclatura do código e nomenclatura física do banco deve permanecer explícita no schema.

---

# 6. Identificadores

Os identificadores das entidades persistidas utilizam UUID.

Novas entidades devem seguir essa convenção, salvo decisão arquitetural formal em contrário.

A geração do identificador deve permanecer consistente com o padrão existente no schema.

Specifications não devem introduzir outro tipo de chave primária silenciosamente.

---

# 7. Datas e horários

## 7.1 Instantes

Instantes que representam um ponto específico no tempo devem ser persistidos considerando UTC.

Conversões para horário local devem ocorrer nas bordas apropriadas da aplicação.

Exemplos conceituais:

* criação;
* atualização;
* publicação;
* eventos temporalmente identificáveis.

---

## 7.2 Datas civis

Informações que representam apenas uma data civil devem utilizar o equivalente PostgreSQL:

```text
DATE
```

Exemplo conceitual:

```text
data de nascimento
```

quando não houver necessidade de horário associado.

---

## 7.3 Horários locais

Horários que representam apenas horário do dia, sem data associada, devem utilizar:

```text
TIME
```

quando adequado ao significado do dado.

A semântica do campo deve ser definida pela feature correspondente.

---

# 8. Valores numéricos

Valores monetários que venham a ser introduzidos devem utilizar representação decimal exata.

No Prisma, deve-se utilizar:

```text
Decimal
```

Valores monetários não devem utilizar tipos de ponto flutuante.

Essa regra evita erros decorrentes de representação binária de valores decimais.

---

# 9. Enums e taxonomias

Enums persistidos devem ser tratados como parte do contrato de dados.

Alterações em enum existente devem considerar:

* compatibilidade com dados existentes;
* compatibilidade com aplicações consumidoras;
* migration necessária;
* possibilidade de valores históricos;
* impacto em filtros e regras de domínio.

Valores de enum não devem ser removidos ou renomeados sem análise dos registros existentes.

---

# 10. Integridade de dados

Sempre que uma invariável puder ser garantida de maneira inequívoca pelo banco, deve ser avaliado o uso de:

* `NOT NULL`;
* `UNIQUE`;
* foreign keys;
* `CHECK`.

O banco deve impedir estados estruturalmente inválidos quando a regra puder ser expressa sem depender de contexto externo.

Regras contextuais ou comportamentais permanecem no domínio, mesmo quando parte delas também puder ser reforçada pela persistência.

---

# 11. Nullability

A definição de uma coluna como opcional ou obrigatória deve representar uma decisão de domínio.

Uma coluna não deve ser nullable apenas para simplificar a implementação.

Antes de introduzir uma coluna opcional, o design deve avaliar:

* se ausência de valor possui significado válido;
* quando o valor pode estar ausente;
* se registros existentes precisam de compatibilidade;
* se existe um default semanticamente correto.

Defaults não devem ser utilizados apenas para evitar `NULL` quando não representarem um valor real do domínio.

---

# 12. Foreign Keys

Relacionamentos entre entidades persistidas devem utilizar foreign keys quando a relação exigir integridade referencial.

Toda foreign key deve declarar conscientemente sua estratégia de exclusão.

Devem ser analisados, conforme o relacionamento:

* `RESTRICT`;
* `CASCADE`;
* `SET NULL`;
* outras estratégias suportadas quando apropriadas.

`CASCADE` somente deve ser utilizado quando o registro dependente não possuir significado independente do registro pai.

Para relacionamentos ainda não analisados, a estratégia segura é:

```text
RESTRICT
```

A estratégia definitiva deve refletir a regra de ciclo de vida da relação.

---

# 13. Exclusão de registros

A existência de uma operação de exclusão no banco não define automaticamente que a aplicação deve permitir exclusão física.

A estratégia deve ser definida pela feature quando existirem impactos relacionados a:

* histórico;
* auditoria;
* dados pessoais;
* dados clínicos;
* integridade;
* registros dependentes;
* LGPD.

Hard delete de informações de paciente ou registros clínicos não deve ser implementado sem specification específica e revisão das implicações de segurança e privacidade.

---

# 14. Índices

Índices devem ser orientados por padrões reais de consulta.

Devem ser considerados principalmente para campos utilizados frequentemente em:

* foreign keys;
* filtros;
* busca;
* ordenação;
* joins;
* restrições de unicidade.

A criação de índices deve avaliar:

* seletividade;
* volume esperado;
* frequência de leitura;
* frequência de escrita;
* custo de manutenção.

Não devem ser criados índices preventivamente para todos os campos.

---

# 15. Índices compostos

Quando uma consulta depender frequentemente da combinação de múltiplos campos, deve ser avaliada a utilização de índice composto.

A ordem das colunas deve considerar o padrão real das queries.

Uma specification que introduza filtros ou ordenações relevantes deve permitir que o design avalie o impacto sobre indexação.

---

# 16. Unicidade

Regras de unicidade que puderem ser garantidas pelo PostgreSQL devem utilizar constraints adequadas.

Não se deve confiar somente no fluxo:

```text
SELECT
   ↓
registro não existe
   ↓
INSERT
```

para garantir unicidade.

Esse padrão é vulnerável à concorrência.

Quando a regra for realmente única, uma constraint deve proteger o estado persistido.

---

# 17. Pontos do schema que exigem definição

O schema atual possui campos cuja taxonomia ainda não está formalmente documentada.

Entre eles:

* `humor`;
* `sintomaTipo`;
* `statusConsulta`;
* `statusAdministrativo`.

A primeira feature que manipular cada um desses campos deve definir explicitamente os valores aceitos e avaliar a forma adequada de representação:

```text
enum
```

ou:

```text
tabela de domínio
```

ou:

```text
texto validado
```

Essa decisão não deve ser inferida apenas a partir do tipo físico existente.

---

# 18. Outras regras ainda não formalizadas

As respectivas specifications devem definir, antes que o comportamento seja considerado oficial:

* faixa válida de `intensidade`;
* faixa permitida de `diaSemana`;
* comportamento de horários que cruzam meia-noite;
* normalização e unicidade de email;
* normalização e unicidade de login;
* unicidade e normalização de categoria;
* unicidade e normalização de tag;
* obrigatoriedade e formato de telefone;
* formato de CEP;
* formato de UF;
* ciclo de publicação;
* coerência entre `status` e `dataPublicacao`;
* política de ciclo de vida das imagens;
* política de ciclo de vida das notas de voz.

Esses itens são bloqueantes somente para as funcionalidades que dependam dessas definições.

Eles não impedem o scaffold ou o desenvolvimento de partes independentes do projeto.

---

# 19. Geolocalização

O campo:

```text
endereco.localizacao_postgis
```

utiliza:

```text
geometry(Point, 4326)
```

No sistema de coordenadas utilizado:

```text
X = longitude
Y = latitude
```

A ordem não deve ser invertida.

---

# 20. Operações geoespaciais

Features que realizem operações geográficas devem definir explicitamente, quando aplicável:

* finalidade da busca;
* raio;
* unidade;
* precisão esperada;
* comportamento nos limites;
* necessidade de ordenação por distância;
* índice espacial necessário.

Operações de distância devem utilizar função e tipo adequados à unidade e à precisão exigidas pela feature.

A presença de uma coordenada não define automaticamente a semântica de distância utilizada pelo produto.

---

# 21. PostGIS e Prisma

O campo geoespacial atualmente é representado como `Unsupported` no Prisma.

Quando uma operação não puder ser expressa adequadamente através do Prisma Client, pode ser necessário utilizar SQL específico.

Esse SQL deve permanecer isolado na camada de infraestrutura, preferencialmente dentro do repositório responsável pela operação.

Fluxo esperado:

```text
Application
     ↓
Repository Contract
     ↑
Infrastructure Repository
     ↓
Prisma / SQL parametrizado
     ↓
PostgreSQL + PostGIS
```

Detalhes de PostGIS não devem vazar para o domínio.

---

# 22. SQL manual

Quando SQL manual for necessário:

* deve utilizar parâmetros;
* deve permanecer na infraestrutura;
* deve possuir escopo limitado;
* deve ser revisado quanto a segurança;
* deve ser testado.

Concatenação de valores externos para construção de SQL é proibida.

Exemplo proibido:

```text
"SELECT ... WHERE campo = '" + valor + "'"
```

O uso de SQL manual não elimina a necessidade de respeitar contracts e abstrações da arquitetura.

---

# 23. Prisma e Domain

Models Prisma e entidades de domínio possuem responsabilidades diferentes.

Um model Prisma representa persistência.

Uma entidade de domínio representa comportamento e conceitos de negócio.

Não se deve assumir automaticamente:

```text
Prisma Model = Domain Entity
```

Quando as duas representações diferirem, a infraestrutura deve realizar a transformação necessária.

Mappers podem ser introduzidos quando houver diferença concreta entre os modelos.

Não é obrigatório criar mappers quando eles não trouxerem benefício arquitetural.

---

# 24. Repositories

A camada de domínio ou aplicação não deve depender diretamente do Prisma Client.

O acesso à persistência deve respeitar os contratos definidos pela arquitetura do backend.

Fluxo conceitual:

```text
Use Case
    ↓
Repository Contract
    ↑
Repository Implementation
    ↓
Prisma
    ↓
PostgreSQL
```

Repositories devem representar operações necessárias ao domínio ou caso de uso.

Não devem ser criados repositories genéricos apenas para replicar operações CRUD do Prisma sem necessidade arquitetural.

---

# 25. Queries

Queries devem buscar somente os dados necessários para o caso de uso.

Deve-se evitar:

* carregar relações sem necessidade;
* selecionar colunas desnecessárias;
* consultas repetidas dentro de loops;
* padrões N+1;
* consultas excessivamente amplas por conveniência.

O desenho da query deve considerar o contrato que o caso de uso realmente necessita.

---

# 26. Paginação

Listagens que possam crescer significativamente devem avaliar paginação.

A estratégia global de paginação ainda não está definida neste documento.

Quando uma feature necessitar de paginação, seu design deve especificar o comportamento esperado e respeitar qualquer convenção de API vigente.

Alterações relevantes na estratégia global devem ser registradas no artefato arquitetural apropriado.

---

# 27. Migrations

Toda alteração estrutural persistente deve ser representada por migration.

Fluxo esperado:

1. alterar `schema.prisma`;
2. gerar migration com nome descritivo;
3. revisar o SQL gerado;
4. analisar impacto sobre dados existentes;
5. validar a migration;
6. validar o Prisma Client;
7. executar testes aplicáveis;
8. versionar schema e migration conjuntamente.

---

# 28. Revisão de migrations

Antes de uma migration ser aceita, deve ser analisado:

* risco de perda de dados;
* alteração destrutiva;
* constraints;
* defaults;
* nullability;
* índices;
* foreign keys;
* locks;
* alterações de tipo;
* extensões PostgreSQL/PostGIS;
* necessidade de backfill;
* compatibilidade com código existente.

Migrations geradas automaticamente não devem ser aceitas sem revisão do SQL resultante.

---

# 29. Imutabilidade de migrations aplicadas

Uma migration que já tenha sido aplicada em ambiente compartilhado deve ser considerada imutável.

Correções devem ser realizadas através de uma nova migration.

Não se deve editar silenciosamente o conteúdo de uma migration já utilizada para alterar o histórico.

---

# 30. Aplicação de migrations

Em ambientes de produção ou equivalentes deve ser utilizado o mecanismo de deploy de migrations apropriado do Prisma.

Comandos interativos voltados ao fluxo de desenvolvimento não devem ser utilizados como mecanismo de atualização de produção.

---

# 31. Mudanças destrutivas

Mudanças destrutivas devem ser evitadas quando existirem dados ou consumidores ativos.

Quando necessário, deve ser considerada a estratégia:

```text
Expand
   ↓
Migrate
   ↓
Switch
   ↓
Contract
```

Exemplo conceitual:

```text
1. adicionar nova estrutura compatível
2. manter estrutura antiga temporariamente
3. migrar/backfill dos dados
4. alterar consumidores
5. validar nova estrutura
6. remover estrutura antiga
```

A remoção não deve ocorrer antes que dependências e dados tenham sido tratados.

---

# 32. Backfill

Uma migration estrutural não deve assumir automaticamente que registros existentes possuirão valores válidos para novas regras.

Quando uma mudança exigir preenchimento de dados históricos, deve ser definida estratégia de backfill.

O design deve identificar:

* origem dos valores;
* comportamento para registros incompletos;
* momento de execução;
* risco operacional;
* possibilidade de rollback.

Valores fictícios não devem ser adicionados apenas para satisfazer uma nova constraint.

---

# 33. Transações

O caso de uso define a necessidade de atomicidade.

A camada de infraestrutura controla a transação concreta.

Uma transação deve ser utilizada quando múltiplas operações precisarem possuir comportamento:

```text
todas são concluídas
```

ou:

```text
nenhuma é concluída
```

---

# 34. Limites de transação

Transações devem ser mantidas curtas.

Chamadas externas de rede não devem permanecer abertas dentro de uma transação de banco quando puderem ser evitadas.

Isso inclui integrações externas que possam:

* possuir latência;
* falhar independentemente;
* permanecer indisponíveis.

O design da feature deve separar adequadamente persistência e comunicação externa quando necessário.

---

# 35. Concorrência

Operações sujeitas a concorrência devem possuir estratégia explícita.

Conforme a necessidade, podem ser considerados:

* constraint única;
* update condicional;
* isolamento transacional;
* controle otimista;
* outra estratégia suportada pela arquitetura.

Não deve ser assumido que:

```text
ler
 ↓
validar
 ↓
gravar
```

é suficiente para garantir invariantes quando duas requisições puderem executar simultaneamente.

---

# 36. Dados pessoais e sensíveis

A persistência deve respeitar as decisões de privacidade e segurança do projeto.

Queries, exceptions e logs não devem expor desnecessariamente:

* credenciais;
* tokens;
* dados pessoais completos;
* conteúdo clínico;
* informações sensíveis.

Dados retornados pelo banco não devem ser propagados automaticamente até a API.

Cada caso de uso deve retornar somente as informações necessárias.

---

# 37. Senhas

Senhas não devem ser armazenadas em texto puro.

Somente o hash produzido pelo mecanismo aprovado pelo projeto pode ser persistido.

A definição do algoritmo e demais regras de credenciais pertence ao documento de segurança correspondente.

O banco não deve armazenar a senha original.

---

# 38. Segredos e tokens

Segredos de infraestrutura não devem ser persistidos em tabelas da aplicação sem necessidade formalmente definida.

Tokens sensíveis não devem ser armazenados em texto puro quando a natureza do token e o fluxo permitirem tratamento mais seguro.

As regras concretas dependem da estratégia definida em segurança.

---

# 39. Exclusão, anonimização e retenção

As políticas definitivas relacionadas a:

* retenção;
* anonimização;
* exclusão;
* direitos do titular;
* ciclo de vida de dados;

ainda dependem de definição de produto e LGPD.

Até que essas regras existam, não deve ser criada uma política de exclusão permanente de dados sensíveis ou clínicos por suposição técnica.

---

# 40. Seed

Seeds devem ser:

* idempotentes;
* previsíveis;
* seguros para o ambiente a que se destinam.

Seeds de desenvolvimento devem utilizar apenas dados fictícios.

Devem ser diferenciados, quando aplicável:

```text
dados mínimos necessários ao ambiente
```

de:

```text
fixtures utilizadas por testes
```

Dados reais não devem ser incorporados ao repositório como seed.

---

# 41. Testes de integração

Testes que validem persistência devem utilizar banco isolado do ambiente normal de desenvolvimento.

O schema utilizado pelos testes deve ser construído utilizando migrations reais.

Isso ajuda a validar simultaneamente:

* schema;
* migrations;
* constraints;
* repositories;
* queries.

A estratégia completa de testes permanece definida pelos documentos específicos de testes.

---

# 42. Dados de produção em outros ambientes

Dados de produção não devem ser copiados diretamente para:

* desenvolvimento;
* testes;
* demonstração;

sem processo de anonimização previamente aprovado.

A necessidade de reproduzir um problema não justifica exposição indiscriminada de dados reais.

---

# 43. Backup e recuperação

Antes da utilização em produção, devem ser definidos formalmente:

* RPO;
* RTO;
* retenção de backups;
* proteção e criptografia;
* responsabilidades operacionais;
* procedimento de restauração.

Esses valores ainda não estão definidos por este documento.

Não devem ser inventados por specifications individuais.

---

# 44. Teste de restauração

A existência de arquivos de backup não é suficiente para considerar a estratégia de recuperação validada.

O processo de restauração deve ser exercitado.

A validação deve comprovar que os dados podem ser recuperados dentro das condições operacionais definidas quando os requisitos de produção forem formalizados.

---

# 45. Alterações de banco em Specifications

Toda feature que altere persistência deve declarar esse impacto no `design.md`.

Quando aplicável, utilizar uma seção como:

```markdown
## Database Impact

### Entidades afetadas

- ...

### Alterações de schema

- ...

### Migration

- ...

### Dados existentes

- ...

### Constraints

- ...

### Índices

- ...

### Relacionamentos

- ...

### Backfill

- ...

### Privacidade

- ...

### Concorrência

- ...

### Testes

- ...
```

Somente itens aplicáveis precisam permanecer.

---

# 46. Mudanças que exigem atenção explícita

O design deve destacar principalmente alterações que:

* removam colunas;
* renomeiem colunas;
* alterem tipos;
* tornem coluna nullable em obrigatória;
* adicionem `UNIQUE`;
* alterem foreign keys;
* alterem comportamento de exclusão;
* modifiquem enums;
* introduzam dados sensíveis;
* exijam backfill;
* alterem estruturas geoespaciais;
* possam bloquear tabelas relevantes;
* tenham impacto sobre registros existentes.

Essas alterações não devem permanecer ocultas dentro de uma migration gerada.

---

# 47. Compatibilidade

Alterações persistentes devem considerar simultaneamente:

```text
schema atual
    ↓
dados existentes
    ↓
backend existente
    ↓
novo backend
```

Quando houver consumidores ativos, deve ser avaliada compatibilidade durante a transição.

Uma migration tecnicamente válida não é necessariamente uma mudança operacionalmente segura.

---

# 48. Rollback operacional

Toda alteração persistente deve avaliar a possibilidade de rollback.

Isso não significa obrigatoriamente que toda migration destrutiva possa ser revertida automaticamente.

O design deve identificar quando:

* rollback é simples;
* rollback exige restauração de dados;
* rollback é parcialmente possível;
* a alteração exige estratégia expand/contract.

Não deve ser prometida reversibilidade quando dados puderem ser perdidos de forma irreversível.

---

# 49. Checklist para alteração persistente

Antes da implementação de qualquer alteração relevante no banco, verificar:

### Modelagem

* [ ] A alteração representa uma necessidade definida nos requirements?
* [ ] O tipo escolhido representa corretamente o dado?
* [ ] Nullability está correta?
* [ ] Existe default? Ele possui significado real?
* [ ] Existem constraints aplicáveis?

### Relacionamentos

* [ ] As foreign keys necessárias estão definidas?
* [ ] O comportamento de exclusão foi analisado?
* [ ] Existe risco de relacionamento inconsistente?

### Compatibilidade

* [ ] Existem registros anteriores afetados?
* [ ] É necessário backfill?
* [ ] Existe consumidor que dependa da estrutura antiga?
* [ ] A alteração é destrutiva?

### Performance

* [ ] Existem novas queries relevantes?
* [ ] Algum índice é necessário?
* [ ] Algum índice existente tornou-se inadequado?
* [ ] Existe risco de N+1?

### Concorrência

* [ ] A operação pode ocorrer simultaneamente?
* [ ] Existe invariant que precise ser protegida pelo banco?
* [ ] Constraint ou transação é necessária?

### Segurança e privacidade

* [ ] A alteração introduz dado pessoal?
* [ ] A alteração introduz dado sensível?
* [ ] O acesso está limitado ao necessário?
* [ ] Existe risco de exposição em logs?

### Migration

* [ ] O SQL gerado foi revisado?
* [ ] Existe risco de perda de dados?
* [ ] Existe risco de lock relevante?
* [ ] Schema e migration serão versionados juntos?

### Validação

* [ ] A migration foi aplicada em banco limpo?
* [ ] Foram considerados dados existentes quando aplicável?
* [ ] O Prisma Client foi validado?
* [ ] Existem testes de integração aplicáveis?

---

# 50. Pontos ainda pendentes de definição global

Este documento não define, neste momento:

* estratégia global de paginação;
* política definitiva de retenção;
* política definitiva de anonimização;
* estratégia definitiva de exclusão lógica ou física;
* RPO;
* RTO;
* retenção de backups;
* regras definitivas de normalização dos campos identificados como pendentes;
* regras definitivas de ciclo de vida de mídia.

Esses pontos não devem ser preenchidos por suposição.

Quando uma feature depender de um deles, a decisão deve ser tomada no artefato apropriado antes da implementação.

---

# 51. Uso por agentes de IA

Antes de modificar a persistência, um agente deve consultar:

1. `constitution.md`;
2. `conventions.md`;
3. `architecture/backend.md`;
4. este documento;
5. ADRs aplicáveis;
6. requirements da feature;
7. design da feature;
8. schema Prisma atual;
9. migrations existentes relacionadas.

O agente deve analisar o modelo existente antes de propor nova estrutura.

---

# 52. Agentes não devem

Agentes não devem:

* inventar colunas;
* inventar relacionamentos;
* inventar enums;
* inferir obrigatoriedade de campo sem requisito;
* alterar tipo de dado sem avaliar dados existentes;
* modificar migrations já aplicadas;
* criar `CASCADE` por conveniência;
* utilizar SQL concatenado;
* utilizar Prisma diretamente no domínio;
* criar índices sem justificativa;
* introduzir hard delete de dados sensíveis sem specification;
* assumir políticas de retenção;
* assumir comportamento de concorrência;
* tratar schema físico como definição completa da regra de negócio.

Quando uma decisão necessária não estiver definida, ela deve ser registrada como pendência.

---

# 53. Princípio final

A persistência deve proteger a integridade dos dados sem assumir responsabilidades que pertencem ao domínio.

Como princípio:

```text
Requirements
     ↓
Domain rules
     ↓
Application
     ↓
Repository Contract
     ↓
Infrastructure
     ↓
Prisma
     ↓
PostgreSQL / PostGIS
```

O banco deve garantir aquilo que consegue garantir de forma inequívoca.

O domínio deve definir aquilo que depende do comportamento e contexto do negócio.

Alterações de persistência devem ser deliberadas, rastreáveis e compatíveis com a evolução do sistema.
