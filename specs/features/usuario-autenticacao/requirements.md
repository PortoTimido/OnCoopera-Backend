# Módulo de Usuário e Autenticação — Requirements

## 1. Objetivo

Definir o comportamento esperado para o módulo responsável por identidade de usuário e autenticação no backend do OnCoopera.

Esta specification cobre a estrutura conceitual indicada pelo diagrama de classes do módulo de usuário e autenticação, respeitando as regras gerais de SDD, DDD, segurança e privacidade já definidas para o projeto.

## 2. Referências

- Diagrama de classes: `backend/.temp/DiagramaClasse/ModuloUsuarioAutenticacao.png`
- Constitution: `backend/specs/constitution.md`
- Backend Architecture: `backend/specs/architecture/backend.md`
- Security Architecture: `backend/specs/architecture/security.md`
- Database Architecture: `backend/specs/architecture/database.md`
- SDD Conventions: `backend/specs/architecture/conventions.md`

## 3. Escopo

O módulo deve representar:

- usuário base;
- paciente;
- administrador;
- dados de identificação pessoal;
- credenciais;
- nível de acesso administrativo;
- operações mínimas de autenticação e alteração de senha;
- CRUD de usuários administrativos pelo backoffice;
- cadastro e autogestão de paciente pelo aplicativo mobile.

O módulo não define, por si só, permissões de acesso a outras funcionalidades do sistema.

## 4. Atores

### Usuário

Pessoa autenticável no sistema, identificada por email, login e senha.

### Paciente

Usuário associado ao acompanhamento de saúde, registros diários, consultas, medicamentos ingeridos e rede de apoio.

### Administrador

Usuário com perfis administrativos para operação do backoffice.

## 5. Requisitos funcionais

### REQ-UA-001 — Cadastro conceitual de usuário

O sistema deve representar um usuário com:

- identificador único;
- email;
- login;
- senha armazenada como hash;
- nome;
- data de criação;
- data do último acesso;
- um ou mais telefones;
- data de nascimento.

### REQ-UA-002 — Validação de objetos de valor

O sistema deve validar os objetos de valor associados ao usuário:

- email;
- login;
- senha hash;
- nome;
- telefone;
- data de nascimento.

### REQ-UA-003 — Alteração de senha

O usuário deve poder alterar sua senha informando a senha antiga e a nova senha.

A alteração deve ocorrer somente quando a senha antiga for validada com sucesso.

### REQ-UA-004 — Representação de paciente

O sistema deve representar paciente como especialização de usuário, contendo:

- endereço;
- lista de consultas;
- lista de registros diários;
- lista de medicamentos ingeridos.

### REQ-UA-005 — Operações de paciente

O paciente deve poder:

- adicionar registro diário;
- obter relatório de saúde por período;
- buscar apoios próximos a partir de data, hora e endereço.

### REQ-UA-006 — Representação de administrador

O sistema deve representar administrador como especialização de usuário, contendo perfis administrativos.

### REQ-UA-007 — Níveis de acesso administrativo

O sistema deve reconhecer os níveis administrativos:

- `TOTAL`;
- `MODERADOR_DE_CONTEUDO`;
- `GERENTE_DE_APOIOS`;
- `ANALISTA_DE_INTERACOES`.

### REQ-UA-008 — Autenticação

O sistema deve autenticar usuários a partir de credenciais válidas.

A autenticação deve produzir uma identidade autenticada utilizável pela camada de aplicação.

### REQ-UA-009 — Isolamento do mecanismo de autenticação

Regras de domínio não devem depender diretamente do mecanismo técnico de autenticação.

O domínio não deve conhecer JWT, cookies, sessão HTTP, headers ou detalhes do framework.

### REQ-UA-010 — Registro de último acesso

Quando uma autenticação for concluída com sucesso, o sistema deve poder atualizar a data do último acesso do usuário.

### REQ-UA-011 — Renovação de sessão

O sistema deve permitir renovar a autenticação por meio de refresh token válido e proteção CSRF.

Refresh token inválido, expirado ou revogado não deve gerar novo access token.

### REQ-UA-012 — Logout

O sistema deve permitir encerrar a sessão autenticada.

Logout deve revogar a sessão quando o refresh token informado corresponder a uma sessão existente.

### REQ-UA-013 — Usuário autenticado

O sistema deve permitir consultar a identidade sanitizada do usuário autenticado.

Essa resposta não deve incluir senha, hash de senha, refresh token ou segredos internos.

### REQ-UA-014 — Status do usuário

Apenas usuários com status `ATIVO` devem autenticar ou manter sessão válida.

Usuários `INATIVO` ou `BLOQUEADO` devem receber falha genérica de autenticação.

### REQ-UA-015 — CRUD de administradores pelo backoffice

O sistema deve permitir que administradores com perfil `TOTAL` criem, consultem, atualizem e inativem administradores pelo backoffice.

Administrador criado pelo backoffice deve receber senha temporária forte retornada uma única vez.

### REQ-UA-016 — Cadastro e autogestão de paciente pelo mobile

O sistema deve permitir cadastro público de paciente pelo aplicativo mobile.

Paciente não deve possuir perfis administrativos.

Paciente autenticado deve poder consultar, atualizar e inativar o próprio cadastro.

### REQ-UA-017 — Troca obrigatória de senha temporária

Usuário criado com senha temporária deve possuir `trocaSenhaObrigatoria = true`.

Login normal desse usuário não deve gerar sessão ou token e deve retornar `409` com código `TROCA_SENHA_OBRIGATORIA`.

### REQ-UA-018 — Garantia de administrador full

O sistema deve impedir que a última conta de administrador `ATIVO` com perfil `TOTAL` seja inativada ou perca esse perfil.

### REQ-UA-019 — Exclusão lógica

Exclusão de usuário deve ser realizada por inativação, preservando histórico e revogando sessões ativas.

## 6. Regras de negócio

### RN-UA-001 — Senha não deve ser armazenada em texto puro

Senha deve ser persistida somente como hash.

### RN-UA-002 — Email deve ser válido

Email inválido não deve gerar usuário válido.

### RN-UA-003 — Login deve ser válido

Login inválido não deve gerar usuário válido.

### RN-UA-004 — Nome deve ser válido

Nome inválido não deve gerar usuário válido.

### RN-UA-005 — Data de nascimento deve ser válida

Data de nascimento inválida não deve gerar usuário válido.

### RN-UA-006 — Telefone deve ser válido

Telefone inválido não deve gerar usuário válido.

### RN-UA-007 — Usuário deve ter pelo menos um telefone

De acordo com o diagrama de classes, usuário deve possuir associação com `Telefone` na cardinalidade `1..*`.

### RN-UA-008 — Autenticação não implica autorização irrestrita

Usuário autenticado não deve receber acesso automático a operações administrativas ou dados de pacientes.

### RN-UA-009 — Nível administrativo limita atuação do administrador

Um administrador deve possuir somente o nível de acesso necessário ao seu papel.

O significado operacional de cada nível deve ser definido nas specifications das funcionalidades protegidas por autorização.

### RN-UA-010 — Perfil full administrativo

O nível `full` do domínio de negócio é representado por `PerfilAdministrativo.nome = TOTAL`.

### RN-UA-011 — Administrador mínimo

Deve existir ao menos um administrador `ATIVO` com perfil `TOTAL`.

Ao violar essa regra, o sistema deve retornar a mensagem:

`Deve existir ao menos um administrador ativo com permissão TOTAL.`

### RN-UA-012 — Paciente sem perfis administrativos

Paciente cadastrado pelo mobile ou atualizado pelo backoffice não deve receber perfis administrativos.

## 7. Segurança

- Senhas recebidas em operações de cadastro, login ou alteração de senha devem ser tratadas como dado sensível.
- Senhas devem utilizar bcrypt com custo padrão 12 nesta entrega.
- Access token deve utilizar JWT HS256 com expiração padrão de 15 minutos.
- Refresh token deve ser opaco, rotativo, armazenado em cookie HttpOnly e persistido somente como hash HMAC.
- Proteção CSRF deve ser exigida para operações baseadas no refresh cookie.
- Hashes de senha não devem ser retornados em respostas da API.
- Dados de autenticação não devem ser registrados em logs.
- Regras de negócio devem permanecer desacopladas de JWT, cookies e sessão HTTP.
- Autorização deve ser validada no backend.
- Rotas de backoffice devem exigir Bearer token e perfil administrativo `TOTAL`.
- Senha temporária deve ser retornada somente na resposta de criação de administrador.

## 8. Privacidade e LGPD

O módulo manipula dados pessoais, incluindo nome, email, telefone e data de nascimento.

Operações que consultem ou alterem dados de usuário devem explicitar:

- finalidade;
- ator autorizado;
- dados utilizados;
- dados retornados;
- necessidade de acesso.

Dados de paciente possuem maior sensibilidade e não devem ser expostos a administradores apenas pela existência de vínculo no banco.

## 9. Fora do escopo

Esta specification não define:

- telas do frontend;
- recuperação de senha;
- confirmação de email;
- autenticação multifator;
- regras detalhadas de cada funcionalidade de paciente;
- permissões concretas de cada nível administrativo sobre outros módulos.

## 10. Pendências

- Definir se telefone deve evoluir de campo único para cardinalidade persistida `1..*`.
- Definir retenção e auditoria de histórico de acessos.
