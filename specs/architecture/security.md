# Arquitetura de Segurança

## 1. Objetivo

Este documento define os princípios, responsabilidades e restrições de segurança aplicáveis ao backoffice do OnCoopera e às operações de backend utilizadas por ele.

Seu objetivo é orientar:

* autenticação;
* autorização;
* proteção de credenciais;
* proteção de dados pessoais;
* validação de entrada;
* exposição de dados pela API;
* tratamento de erros;
* sessões e tokens;
* logs;
* integrações;
* testes de segurança;
* análise de novas specifications.

Este documento complementa:

* `constitution.md`;
* `conventions.md`;
* `architecture/backend.md`;
* `architecture/database.md`;
* ADRs aplicáveis.

Este documento não substitui requisitos específicos de segurança de cada funcionalidade.

---

# 2. Escopo

As regras deste documento se aplicam ao desenvolvimento do backoffice do OnCoopera.

O escopo contempla:

```text
Backoffice React
      ↓
REST API
      ↓
Backend
      ↓
Persistência e integrações
```

A aplicação mobile não faz parte do escopo deste SDD.

Entretanto, quando o backoffice utilizar estruturas compartilhadas de autenticação, autorização ou persistência, suas alterações não devem comprometer outros consumidores do backend.

---

# 3. Princípios gerais

O desenvolvimento deve considerar os seguintes princípios:

* menor privilégio;
* acesso somente quando autorizado;
* validação no backend;
* minimização da exposição de dados;
* separação entre autenticação e autorização;
* proteção de credenciais;
* não confiança em dados enviados pelo cliente;
* falha segura;
* rastreabilidade quando necessária;
* não exposição de detalhes internos da aplicação.

Segurança não deve depender exclusivamente da interface.

---

# 4. Modelo de confiança

Dados provenientes do cliente devem ser considerados não confiáveis.

Isso inclui:

* body;
* query parameters;
* path parameters;
* headers;
* identificadores;
* filtros;
* valores de formulário;
* dados mantidos no estado do frontend.

O fato de determinado valor ter sido gerado pelo próprio frontend não elimina a necessidade de validação no backend.

Fluxo esperado:

```text
Client
  ↓
UNTRUSTED INPUT
  ↓
API validation
  ↓
Authorization
  ↓
Application
  ↓
Domain
```

---

# 5. Autenticação

Autenticação responde à pergunta:

> Quem está realizando a operação?

Ela não deve ser confundida com autorização.

---

# 6. Autenticação durante o desenvolvimento atual

Durante a fase atual do projeto, será utilizado um mecanismo simplificado baseado em sessão para validação de acesso.

Esse mecanismo é temporário.

Ele não deve ser tratado como arquitetura definitiva de autenticação.

Specifications não devem introduzir dependências de negócio diretamente ligadas ao mecanismo temporário.

---

# 7. Autenticação prevista para o MVP final

Para a versão final do MVP, a autenticação utilizará JWT.

A definição de JWT como mecanismo de autenticação não estabelece automaticamente:

* tempo de expiração;
* algoritmo de assinatura;
* formato das claims;
* estratégia de refresh;
* armazenamento do token;
* revogação;
* rotação;
* tratamento de múltiplas sessões.

Esses pontos ainda precisam de definição formal antes da implementação definitiva.

---

# 8. Isolamento do mecanismo de autenticação

As regras de domínio não devem depender diretamente de:

* JWT;
* cookie;
* sessão HTTP;
* headers;
* framework de autenticação.

A arquitetura deve transformar o mecanismo técnico em uma identidade autenticada utilizável pela aplicação.

Exemplo conceitual:

```text
HTTP Request
     ↓
Authentication mechanism
     ↓
Authenticated identity
     ↓
Application
```

O domínio não deve receber ou interpretar tokens JWT.

---

# 9. Identidade autenticada

Depois que uma requisição for autenticada, a aplicação deve trabalhar com uma representação da identidade necessária ao caso de uso.

Essa representação pode conter somente as informações necessárias para decisões posteriores.

A estrutura definitiva ainda não está formalizada.

Não devem ser adicionadas informações à identidade autenticada apenas por conveniência.

---

# 10. Autorização

Autorização responde à pergunta:

> Este usuário pode executar esta operação?

A autenticação bem-sucedida não implica autorização para qualquer funcionalidade.

---

# 11. Autorização no backend

Toda regra real de acesso deve ser validada no backend.

O frontend pode:

* esconder opções;
* desabilitar ações;
* ajustar navegação;
* melhorar experiência do usuário.

Entretanto, essas ações não constituem proteção de segurança.

Exemplo proibido:

```text
Frontend esconde botão "Excluir"
        ↓
Backend aceita DELETE sem validar autorização
```

O backend deve verificar a autorização independentemente da interface.

---

# 12. Perfis administrativos

O modelo de dados atual possui estruturas relacionadas a acesso administrativo:

```text
perfil_administrativo
administrador_perfil
```

A existência dessas tabelas indica persistência relacionada a perfis administrativos.

Entretanto, este documento não presume:

* quais perfis existem;
* quais permissões cada perfil possui;
* se haverá RBAC formal;
* se permissões serão por recurso;
* se permissões serão por ação;
* existência de hierarquia entre perfis.

Essas regras ainda precisam ser definidas antes da implementação de autorização dependente delas.

---

# 13. Requisitos de autorização em Specifications

Toda feature que possua restrição de acesso deve declarar explicitamente no `requirements.md`:

* ator autorizado;
* operações permitidas;
* operações proibidas quando relevante;
* condições adicionais de acesso.

O `design.md` deve então definir como essa regra será validada tecnicamente.

Exemplo estrutural:

```markdown
## Segurança e autorização

### Operações protegidas

- Visualizar:
- Criar:
- Alterar:
- Excluir:

### Regra de autorização

...
```

Nenhum agente deve inferir autorização apenas pelo nome da tela.

---

# 14. Princípio do menor privilégio

Um usuário deve possuir somente os acessos necessários ao papel que desempenha.

Não deve ser concedido acesso ampliado apenas para simplificar a implementação.

Quando uma feature permitir operações distintas, como:

```text
visualizar
criar
editar
excluir
publicar
```

deve ser avaliado se todas elas possuem necessariamente a mesma regra de autorização.

Essa decisão pertence à specification.

---

# 15. Controle de acesso por objeto

A autorização não deve validar somente o tipo de operação.

Quando aplicável, também deve considerar se o usuário pode acessar o registro solicitado.

Alterar um identificador na URL, body ou request não deve permitir acesso indevido a dados.

Exemplo:

```text
GET /recurso/A
```

não implica que o usuário possa executar:

```text
GET /recurso/B
```

apenas porque conhece o identificador.

Quando existir restrição por objeto, ela deve ser declarada na feature correspondente.

---

# 16. Credenciais

Credenciais devem ser tratadas como dados sensíveis.

Senhas não devem:

* ser persistidas em texto puro;
* aparecer em logs;
* aparecer em mensagens de erro;
* ser retornadas pela API;
* ser expostas ao frontend depois de recebidas para autenticação ou cadastro.

---

# 17. Hash de senha

O banco deve armazenar somente hash de senha.

O algoritmo, parâmetros e biblioteca utilizados para geração do hash ainda não foram formalmente definidos.

Esses valores não devem ser inventados por uma feature ou agente.

Antes da implementação definitiva de credenciais, deve ser tomada uma decisão específica sobre:

* algoritmo;
* parâmetros;
* biblioteca;
* atualização futura dos hashes.

---

# 18. Recuperação e alteração de senha

O fluxo definitivo de:

* esquecimento de senha;
* redefinição;
* alteração;
* invalidação de credenciais;

ainda não foi definido.

Nenhuma feature deve criar um fluxo permanente sem specification específica.

Tokens de recuperação, caso sejam adotados, devem ser tratados como credenciais temporárias.

---

# 19. JWT

Quando o JWT definitivo for implementado, sua estratégia deve ser formalizada antes da implementação.

Devem ser definidos, no mínimo:

* finalidade do token;
* claims necessárias;
* expiração;
* mecanismo de assinatura;
* validação;
* estratégia de renovação, se existente;
* estratégia de revogação, se necessária;
* comportamento em logout;
* armazenamento no cliente.

Essas decisões devem ser documentadas no artefato apropriado antes de se tornarem padrão.

---

# 20. Dados dentro do token

Tokens não devem receber informações apenas para evitar consultas ao backend.

Claims devem possuir finalidade clara.

Dados sensíveis ou informações desnecessárias não devem ser incluídos em JWT.

A presença de informação dentro de um token não significa que ela esteja protegida contra leitura pelo cliente.

---

# 21. Sessões

Enquanto a autenticação temporária baseada em sessão estiver sendo utilizada, seu comportamento deve permanecer isolado da lógica de negócio.

A utilização atual de sessão não define:

* política definitiva de expiração;
* persistência definitiva de sessão;
* comportamento de múltiplos dispositivos;
* estratégia futura de autenticação.

Essas decisões não devem ser inferidas a partir da implementação temporária.

---

# 22. Validação de entrada

Toda entrada externa deve ser validada antes de ser utilizada em operações sensíveis.

Devem ser consideradas, quando aplicável:

* presença;
* tipo;
* formato;
* tamanho;
* faixa;
* estrutura;
* valores permitidos.

A biblioteca padrão de validação ainda não está definida.

---

# 23. Validação estrutural e regra de negócio

Validação de entrada e regra de negócio devem permanecer separadas conceitualmente.

Exemplo:

```text
"campo deve ser uma UUID válida"
→ validação da entrada

"usuário informado precisa estar ativo"
→ regra de aplicação/domínio
```

A validação estrutural não deve substituir invariantes de domínio.

---

# 24. Mass Assignment

A API não deve persistir automaticamente todos os campos enviados pelo cliente.

O backend deve controlar explicitamente quais propriedades podem ser utilizadas em cada operação.

Exemplo proibido conceitualmente:

```text
request.body
     ↓
UPDATE direto de todos os campos
```

Campos internos, administrativos ou de segurança não devem se tornar editáveis apenas porque foram enviados no request.

---

# 25. Identificadores enviados pelo cliente

Identificadores recebidos através do cliente devem ser validados.

Sua validade estrutural não garante:

* existência;
* autorização;
* pertencimento ao contexto;
* possibilidade de alteração.

Essas verificações devem ocorrer nas camadas correspondentes.

---

# 26. Injeção e consultas

O acesso ao banco deve utilizar mecanismos parametrizados.

O Prisma deve ser utilizado conforme a arquitetura definida em `database.md`.

Quando SQL manual for necessário, valores externos não devem ser concatenados diretamente na query.

Concatenação de SQL com entrada do usuário é proibida.

---

# 27. Exposição de dados pela API

A API deve retornar somente os dados necessários para o caso de uso.

Não se deve retornar um model inteiro apenas porque ele já foi carregado do banco.

Exemplo conceitual:

```text
Database model
    ≠
API response
```

Campos internos devem ser excluídos quando não fizerem parte do contrato.

---

# 28. Campos que nunca devem ser expostos indevidamente

A API não deve retornar indevidamente:

* senha;
* hash de senha;
* secrets;
* tokens;
* informações internas de autenticação;
* dados não necessários à operação.

Dados pessoais e clínicos devem ter sua exposição avaliada pela specification correspondente.

---

# 29. Minimização de dados

O backoffice deve solicitar, consultar e retornar apenas os dados necessários à funcionalidade.

Quando uma operação precisar somente de:

```text
id
nome
status
```

não deve automaticamente recuperar ou expor todos os campos disponíveis.

Essa regra deve ser aplicada principalmente a dados pessoais ou sensíveis.

---

# 30. LGPD

O projeto deve considerar adequação à Lei Geral de Proteção de Dados.

As políticas definitivas ainda não foram formalizadas.

Portanto, este documento não inventa:

* bases legais;
* prazos de retenção;
* políticas de anonimização;
* fluxos de consentimento;
* processos de atendimento ao titular.

Essas decisões precisam ser formalizadas separadamente.

---

# 31. Dados pessoais em novas features

Toda feature que introduza ou amplie tratamento de dados pessoais deve identificar no design:

* dado tratado;
* finalidade;
* origem;
* armazenamento;
* atores que podem acessá-lo;
* operações permitidas;
* exposição através da API;
* riscos relevantes.

Quando a informação não for necessária ao backoffice, sua exposição deve ser evitada.

---

# 32. Dados clínicos

Informações relacionadas ao acompanhamento do paciente devem ser tratadas como informações que exigem atenção elevada de privacidade.

O acesso administrativo a informações clínicas não deve ser presumido pela simples existência dos dados no banco.

Cada funcionalidade do backoffice que necessite visualizar ou manipular esses registros deve possuir requisito explícito de acesso.

---

# 33. Logs

Logs técnicos não devem registrar indiscriminadamente:

* senhas;
* tokens;
* secrets;
* conteúdo clínico;
* dados pessoais completos;
* body completo de requisições sensíveis.

Antes de registrar uma informação, deve-se avaliar se ela é realmente necessária para diagnóstico ou auditoria.

---

# 34. Logging de erros

Erros podem precisar de informações técnicas para diagnóstico.

Entretanto, logs de erro não devem copiar automaticamente toda a entrada do usuário.

Quando dados sensíveis estiverem envolvidos, deve-se preferir informações suficientes para rastrear o problema sem registrar o conteúdo protegido.

---

# 35. Mensagens de erro para o cliente

Respostas de erro não devem expor detalhes internos desnecessários.

A API não deve retornar diretamente ao cliente:

* stack trace;
* SQL;
* credenciais;
* caminhos internos do servidor;
* detalhes de configuração;
* informações internas sem utilidade funcional.

A estratégia global de formato de erros ainda não está definida.

---

# 36. Falha segura

Em caso de dúvida na validação de acesso, o comportamento deve ser negar a operação em vez de conceder acesso.

Exemplo conceitual:

```text
autorização não pôde ser confirmada
        ↓
operação não deve ser liberada
```

Falhas internas não devem transformar uma operação protegida em operação pública.

---

# 37. Segurança no frontend

O frontend é responsável por experiência e interação, não pela aplicação final das regras de segurança.

O frontend pode utilizar informações de autorização para:

* ocultar ações indisponíveis;
* evitar navegação inválida;
* informar restrições;
* melhorar a experiência.

Mas o frontend não é uma fronteira confiável.

---

# 38. Informações sensíveis no frontend

O frontend não deve armazenar dados sensíveis além do necessário para executar a funcionalidade.

Não devem ser colocados em código-fonte:

* senhas;
* tokens privados de serviços;
* secrets;
* credenciais de banco;
* chaves privadas.

Configurações que precisem permanecer secretas devem permanecer no ambiente apropriado do backend.

---

# 39. Variáveis de ambiente

Segredos e credenciais de infraestrutura devem ser obtidos através do mecanismo de configuração do ambiente adotado pelo projeto.

Arquivos contendo segredos reais não devem ser versionados.

A lista definitiva de variáveis necessárias dependerá das integrações efetivamente adotadas.

---

# 40. Integrações externas

Toda integração externa deve possuir um limite claro de confiança.

A aplicação não deve assumir que uma resposta externa é válida apenas porque veio de um serviço conhecido.

Quando aplicável, devem ser avaliados:

* autenticação da integração;
* validação da resposta;
* timeout;
* erro;
* disponibilidade;
* conteúdo recebido.

Credenciais de integrações devem permanecer na infraestrutura.

---

# 41. Uploads

Caso funcionalidades do backoffice permitam upload de arquivos, a respectiva specification deve definir requisitos de segurança antes da implementação.

Devem ser avaliados, quando aplicável:

* tipos permitidos;
* tamanho máximo;
* armazenamento;
* nome do arquivo;
* autorização de leitura;
* autorização de exclusão;
* comportamento de arquivos inválidos.

Este documento não define limites ou formatos porque essas regras ainda não foram estabelecidas.

---

# 42. Conteúdo fornecido por usuários

Conteúdo textual fornecido por usuários deve ser tratado como entrada não confiável.

Caso algum conteúdo seja posteriormente renderizado em contexto capaz de interpretar HTML ou equivalente, a feature deve avaliar riscos de execução de conteúdo não confiável.

Nenhuma specification deve presumir que conteúdo persistido é seguro apenas porque veio do próprio sistema.

---

# 43. Proteção contra abuso

As estratégias definitivas para:

* rate limiting;
* bloqueio após tentativas;
* CAPTCHA;
* detecção de abuso;
* throttling;

ainda não foram definidas.

Esses mecanismos não devem ser adicionados arbitrariamente.

Features expostas a risco relevante de abuso devem levantar essa necessidade durante o design.

---

# 44. Transporte

O tráfego de produção entre clientes e backend deve utilizar canal seguro.

Detalhes de infraestrutura, certificados e terminação TLS ainda não fazem parte deste documento.

Credenciais ou tokens não devem ser enviados de forma deliberadamente desprotegida em ambientes reais.

---

# 45. CORS

A política de CORS ainda não foi formalmente definida.

Ela deve ser configurada de acordo com os consumidores autorizados da API.

Não deve ser utilizada configuração excessivamente permissiva por conveniência em ambiente de produção.

A configuração definitiva deve ser documentada quando o ambiente de deploy estiver definido.

---

# 46. CSRF

A necessidade e estratégia de proteção contra CSRF dependem do mecanismo concreto de autenticação e transporte de credenciais.

Como o projeto utiliza temporariamente sessão e futuramente prevê JWT, a estratégia definitiva ainda não está definida.

Nenhum mecanismo deve ser declarado obrigatório sem considerar a forma real de armazenamento e envio das credenciais.

---

# 47. Segurança de dependências

Novas dependências devem possuir finalidade clara.

Bibliotecas não devem ser adicionadas apenas para simplificar pequenas tarefas quando aumentarem desnecessariamente a superfície de dependências.

Dependências relacionadas a:

* autenticação;
* criptografia;
* tokens;
* validação;
* uploads;

merecem atenção especial durante revisão.

---

# 48. Criptografia

Este documento não define algoritmos criptográficos específicos ainda não aprovados.

Criptografia não deve ser implementada manualmente para substituir bibliotecas apropriadas.

Quando uma funcionalidade necessitar de criptografia, assinatura ou hashing além das credenciais já mencionadas, a decisão deve ser formalizada antes da implementação.

---

# 49. Secrets

Secrets não devem:

* ser hardcoded;
* ser registrados em logs;
* ser retornados pela API;
* ser incluídos em fixtures públicas;
* ser enviados para o frontend quando não forem necessários no cliente.

A gestão operacional definitiva de secrets ainda não foi definida.

---

# 50. Ambiente de desenvolvimento

Ambientes de desenvolvimento e teste devem evitar o uso de:

* credenciais reais de produção;
* tokens reais;
* dados pessoais reais;
* dados clínicos reais.

Quando uma integração permitir credenciais específicas de sandbox ou desenvolvimento, elas devem ser preferidas.

---

# 51. Produção e desenvolvimento

Configurações de desenvolvimento não devem ser automaticamente consideradas apropriadas para produção.

Principalmente em relação a:

* autenticação simplificada;
* logs detalhados;
* CORS;
* mensagens de erro;
* credenciais;
* dados de teste.

O processo de preparação para produção deve revisar esses pontos.

---

# 52. Testes de segurança

Features com requisitos de segurança devem possuir cenários de teste correspondentes quando forem automatizáveis.

Devem ser considerados, quando aplicável:

* acesso sem autenticação;
* acesso autenticado sem permissão;
* acesso autorizado;
* identificador de recurso não permitido;
* entrada inválida;
* campos não editáveis enviados pelo cliente;
* ausência de exposição de campos sensíveis.

A ferramenta e cobertura específica dependem da estratégia de testes do projeto.

---

# 53. Testes de autorização

Quando uma feature depender de autorização, não deve ser testado somente o caminho permitido.

Quando aplicável, devem existir cenários equivalentes a:

```text
usuário autorizado
→ operação permitida
```

e:

```text
usuário não autorizado
→ operação negada
```

A ausência do botão no frontend não substitui esses testes.

---

# 54. Specifications e segurança

Toda nova feature deve avaliar se possui impacto de segurança.

Quando houver impacto, o `design.md` deve possuir seção semelhante a:

```markdown
## Segurança

### Autenticação

- A operação exige autenticação?
- Qual identidade é necessária?

### Autorização

- Quem pode executar?
- Existe restrição por registro?

### Dados

- Quais dados pessoais ou sensíveis são manipulados?
- Quais são retornados pela API?

### Entrada

- Quais campos precisam ser validados?
- Existem campos que nunca podem ser alterados pelo cliente?

### Logs

- Existe informação que não deve ser registrada?

### Riscos

- Existem riscos específicos desta funcionalidade?
```

Somente itens aplicáveis precisam permanecer.

---

# 55. Checklist de segurança para nova feature

Antes da implementação, deve-se avaliar:

### Autenticação

* [ ] A operação exige usuário autenticado?
* [ ] A autenticação necessária está explícita?

### Autorização

* [ ] Está definido quem pode executar a operação?
* [ ] Existe restrição por registro ou contexto?
* [ ] A validação será realizada no backend?

### Entrada

* [ ] Todos os dados externos relevantes serão validados?
* [ ] Campos modificáveis estão explicitamente controlados?
* [ ] Identificadores serão validados?

### Dados

* [ ] A feature acessa dados pessoais?
* [ ] A feature acessa conteúdo clínico?
* [ ] Todos os dados retornados são realmente necessários?
* [ ] Existe campo interno que não deve chegar ao cliente?

### Persistência

* [ ] Existe risco de alteração indevida por mass assignment?
* [ ] Queries utilizam mecanismos parametrizados?
* [ ] Constraints relevantes foram avaliadas?

### Logs

* [ ] Algum dado sensível pode aparecer em log?
* [ ] Erros podem revelar informação interna?

### Frontend

* [ ] Alguma regra de segurança existe somente na interface?
* [ ] Algum secret foi colocado no cliente?

### Testes

* [ ] Cenário sem autenticação foi considerado?
* [ ] Cenário sem autorização foi considerado?
* [ ] Cenário autorizado foi considerado?
* [ ] Exposição indevida de campos foi avaliada?

---

# 56. Pontos de segurança ainda não definidos

As seguintes decisões permanecem abertas:

## Password hashing

Ainda não estão definidos:

* algoritmo;
* parâmetros;
* biblioteca.

---

## JWT

Ainda não estão definidos:

* algoritmo de assinatura;
* expiração;
* claims;
* refresh token;
* revogação;
* logout;
* armazenamento no cliente.

---

## Autorização

Ainda não está definido:

* modelo formal de permissões;
* relação exata entre perfil e permissão;
* granularidade das operações;
* eventual hierarquia entre perfis.

---

## Sessão temporária

Ainda não está formalizada uma política definitiva para:

* expiração;
* persistência;
* múltiplas sessões.

O mecanismo continua sendo temporário.

---

## Rate limiting

Ainda não existe estratégia global definida.

---

## CORS

A política definitiva depende dos ambientes e origens autorizadas.

---

## CSRF

A estratégia depende da forma definitiva de transporte e armazenamento das credenciais.

---

## Recuperação de senha

O fluxo e a estratégia de tokens ainda não foram definidos.

---

## Logs de segurança

Ainda não foi definido quais eventos deverão possuir registro específico de auditoria de segurança.

---

## Gestão de secrets

O mecanismo operacional definitivo ainda não foi escolhido.

---

## Política LGPD

Ainda não foram definidos:

* retenção;
* anonimização;
* exclusão;
* bases e fluxos específicos aplicáveis ao produto.

---

# 57. Decisões que podem exigir ADR

Devem ser avaliadas como Architecture Decision Record quando formalizadas decisões como:

* arquitetura definitiva de autenticação;
* estratégia JWT;
* modelo global de autorização;
* estratégia de armazenamento de token no backoffice;
* estratégia global de sessão;
* mecanismo de gestão de secrets.

Nem toda configuração de segurança exige ADR.

A decisão deve possuir impacto arquitetural ou transversal suficiente para justificar o registro.

---

# 58. Relação com o banco de dados

As regras deste documento devem ser aplicadas em conjunto com `architecture/database.md`.

Em particular:

```text
Security
   ↓
define quem pode acessar

Domain/Application
   ↓
define o que a operação permite

Repository
   ↓
acessa somente os dados necessários

Database
   ↓
protege integridade estrutural
```

O banco não deve ser tratado como mecanismo único de autorização da aplicação.

---

# 59. Relação com a arquitetura do backend

A segurança deve respeitar as responsabilidades arquiteturais definidas em `backend.md`.

Como princípio:

```text
API
├── autenticação
├── validação de entrada
└── adaptação HTTP

Application
├── contexto do usuário
├── autorização aplicável
└── orquestração

Domain
└── regras de negócio

Infrastructure
├── persistência
├── implementação de mecanismos externos
└── detalhes técnicos
```

Essa divisão pode variar conforme a responsabilidade específica, mas regras de negócio não devem ser transferidas para middleware apenas por envolverem usuário autenticado.

---

# 60. Uso por agentes de IA

Antes de implementar funcionalidade com impacto de segurança, um agente deve consultar:

1. `constitution.md`;
2. `conventions.md`;
3. `architecture/backend.md`;
4. `architecture/database.md`;
5. este documento;
6. ADRs relacionados;
7. requirements da feature;
8. design da feature;
9. implementação existente relacionada à autenticação e autorização.

---

# 61. Agentes não devem

Agentes não devem:

* inventar permissões;
* inventar perfis administrativos;
* inventar regras de autorização;
* inventar claims JWT;
* inventar tempo de expiração de tokens;
* escolher algoritmo de hash sem decisão;
* armazenar senha em texto puro;
* retornar hash de senha pela API;
* confiar em autorização realizada apenas no frontend;
* expor campos internos por conveniência;
* registrar tokens ou senhas em logs;
* adicionar secrets ao código-fonte;
* criar SQL por concatenação;
* permitir mass assignment;
* transformar autenticação temporária em padrão definitivo;
* criar hard delete de dados sensíveis sem specification adequada;
* definir política LGPD por suposição.

Quando uma decisão necessária não estiver documentada, ela deve ser tratada como pendência.

---

# 62. Comportamento diante de dúvida

Quando houver dúvida relacionada a:

* quem pode acessar determinado dado;
* quem pode realizar determinada operação;
* quais informações podem ser expostas;
* como uma credencial deve ser armazenada;
* qual mecanismo de autenticação deve ser utilizado;
* política de retenção ou exclusão;

a implementação não deve escolher arbitrariamente a opção mais permissiva.

A decisão deve ser esclarecida antes de ser tratada como comportamento oficial.

---

# 63. Princípio final

Segurança deve fazer parte do design da funcionalidade e não ser adicionada apenas depois da implementação.

O fluxo esperado é:

```text
Requirements
     ↓
Identificar necessidade de segurança
     ↓
Design
     ↓
Definir autenticação, autorização,
dados expostos e riscos aplicáveis
     ↓
Tasks
     ↓
Implementation
     ↓
Security validation
```

A aplicação deve conceder somente os acessos explicitamente definidos.

A ausência de uma regra de autorização não deve ser interpretada como autorização implícita.

Dados devem ser expostos somente quando necessários ao caso de uso.

Decisões de segurança ainda não definidas devem permanecer explícitas como pendências em vez de serem resolvidas por suposição.
