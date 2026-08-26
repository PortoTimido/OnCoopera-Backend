# Módulo de Usuário e Autenticação — Technical Design

## 1. Referências

- Requirements: `requirements.md`
- Class diagram: `backend/.temp/DiagramaClasse/ModuloUsuarioAutenticacao.png`
- Architecture:
  - `backend/specs/architecture/backend.md`
  - `backend/specs/architecture/security.md`
  - `backend/specs/architecture/database.md`
  - `backend/specs/architecture/conventions.md`
- Constitution: `backend/specs/constitution.md`

## 2. Visão geral

O módulo de usuário e autenticação deve ser implementado como parte do contexto de identidade do backend.

O design segue a divisão arquitetural já definida:

```text
API
  ↓
Application
  ↓
Domain
  ↑
Infrastructure
```

O domínio modela usuário, paciente, administrador e objetos de valor. A aplicação orquestra casos de uso como autenticação e alteração de senha. A infraestrutura fornece persistência, comparação de senhas e emissão ou validação do mecanismo técnico de autenticação.

## 3. Modelo de domínio

Atende:

- REQ-UA-001
- REQ-UA-002
- REQ-UA-004
- REQ-UA-006
- REQ-UA-007

### Entidades

#### Usuario

Entidade raiz do contexto de identidade.

Atributos conceituais:

- `id: UUIDv7`
- `email: Email`
- `senha: SenhaHash`
- `nome: Nome`
- `login: Login`
- `dataCriacao: Date`
- `ultimoAcesso: Date`
- `telefone: List<Telefone>`
- `dataNascimento: DataNascimento`

Comportamentos:

- `alterarSenha(senhaAntiga: string, senhaNova: string): boolean`

#### Paciente

Especialização de usuário para funcionalidades de acompanhamento.

Atributos conceituais:

- `endereco: Endereco`
- `consultasIds: List<UUIDv7>`
- `registrosDiariosIds: List<UUIDv7>`
- `medicamentosIngeridos: List<UUIDv7>`

Comportamentos conceituais:

- `adicionarRegistroDiario(registro: RegistroDiario): void`
- `obterRelatorioSaude(periodo: int): Relatorio`
- `buscarApoiosProximos(dataHora: Date, endereco: Endereco): List<Apoio>`

Esses comportamentos dependem de outros contextos e devem ser detalhados nas specifications próprias de acompanhamento e rede de apoio.

#### Administrador

Especialização de usuário para operação administrativa.

Atributos conceituais:

- `perfisAdministrativos: List<PerfilAdministrativo>`

### Enumerações

#### PerfilAdministrativo

Valores:

- `TOTAL`
- `MODERADOR_DE_CONTEUDO`
- `GERENTE_DE_APOIOS`
- `ANALISTA_DE_INTERACOES`

O significado operacional de cada perfil deve ser aplicado pelos casos de uso protegidos, não pela entidade isoladamente.

`TOTAL` representa o administrador full.

### Objetos de valor

#### Email

Responsável por encapsular o valor textual do email e sua validação.

#### Login

Responsável por encapsular o identificador textual de login e sua validação.

#### SenhaHash

Responsável por representar somente a senha já processada por algoritmo de hash.

Não deve receber senha em texto puro como estado persistível.

#### Nome

Responsável por encapsular o nome e sua validação.

Também pode ser reutilizado por outros contextos que dependam de nomes válidos, como médico, apoio, categoria, medicamento e princípio ativo.

#### Telefone

Responsável por encapsular `ddd` e `numero`, além da formatação para exibição.

#### DataNascimento

Responsável por encapsular dia, mês e ano, validar data e formatar em `DDMMAAAA`.

## 4. Casos de uso de aplicação

Atende:

- REQ-UA-003
- REQ-UA-008
- REQ-UA-010

### Autenticar usuário

Entrada conceitual:

- login ou email;
- senha.

Fluxo:

```text
Receber credenciais
  ↓
Validar formato na borda
  ↓
Buscar usuário por identificador
  ↓
Comparar senha informada com SenhaHash
  ↓
Atualizar último acesso
  ↓
Criar identidade autenticada
  ↓
Retornar resposta sem dados sensíveis
```

Saídas:

- sucesso com identidade autenticada e mecanismo técnico de sessão ou token;
- falha de autenticação sem revelar se login, email ou senha estava incorreto.

### Alterar senha

Entrada conceitual:

- identidade autenticada;
- senha antiga;
- senha nova.

Fluxo:

```text
Receber solicitação autenticada
  ↓
Buscar usuário
  ↓
Validar senha antiga
  ↓
Validar política da nova senha
  ↓
Gerar novo hash
  ↓
Persistir alteração
```

Saídas:

- sucesso sem retornar senha ou hash;
- erro de autenticação, erro de validação ou erro de credencial inválida.

### Trocar senha temporária

Entrada:

- email ou login;
- senha temporária;
- nova senha.

Fluxo:

```text
Receber credenciais temporárias
  ↓
Buscar usuário
  ↓
Validar status ATIVO e trocaSenhaObrigatoria
  ↓
Comparar senha temporária com hash
  ↓
Validar política da nova senha
  ↓
Persistir novo hash e trocaSenhaObrigatoria=false
  ↓
Revogar sessões existentes
```

### Gestão de administradores pelo backoffice

Somente usuário autenticado com perfil `TOTAL` pode:

- listar usuários;
- consultar usuário por ID;
- criar administrador com senha temporária;
- atualizar dados, status e perfis de administrador;
- inativar administrador.

Ao remover `TOTAL` ou tornar administrador não ativo, o caso de uso deve validar que outro administrador `ATIVO` com `TOTAL` permanece.

### Gestão de pacientes

O app mobile pode cadastrar paciente publicamente e, depois de autenticado, o paciente pode consultar, atualizar e inativar o próprio cadastro.

O backoffice com `TOTAL` pode atualizar dados cadastrais/endereço e inativar paciente.

## 5. API

Atende:

- REQ-UA-003
- REQ-UA-008
- REQ-UA-009
- REQ-UA-011
- REQ-UA-012
- REQ-UA-013

Contratos definidos para esta entrega:

```text
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/change-password
POST   /api/auth/change-temporary-password
GET    /api/auth/me

GET    /api/backoffice/usuarios
GET    /api/backoffice/usuarios/:id
POST   /api/backoffice/administradores
PATCH  /api/backoffice/administradores/:id
DELETE /api/backoffice/administradores/:id
PATCH  /api/backoffice/pacientes/:id
DELETE /api/backoffice/pacientes/:id

POST   /api/mobile/pacientes
GET    /api/mobile/pacientes/me
PATCH  /api/mobile/pacientes/me
DELETE /api/mobile/pacientes/me
```

Esses contratos não devem expor:

- `senha`;
- `senhaHash`;
- detalhes internos do mecanismo de autenticação;
- refresh token, CSRF hash ou hash HMAC;
- dados de paciente sem finalidade explícita.

Validação de entrada deve ocorrer na borda da API com Zod, conforme arquitetura do backend.

Documentação Swagger deve declarar Bearer auth, cookies/CSRF quando aplicável, schemas de request/response e respostas `400`, `401`, `403`, `404` e `409`.

## 6. Persistência

Atende:

- REQ-UA-001
- REQ-UA-004
- REQ-UA-006
- REQ-UA-007
- REQ-UA-010

O modelo persistido deve preservar a separação conceitual entre:

- `usuario`;
- `paciente`;
- `administrador`.

Estruturas já reconhecidas pela arquitetura de banco:

```text
usuario
paciente
administrador
perfil_administrativo
administrador_perfil
sessao_autenticacao
```

O schema Prisma atual contém as entidades principais de identidade.

Entregas deste módulo:

- `sessao_autenticacao` para refresh token rotativo, proteção CSRF e revogação de sessão;
- `usuario.troca_senha_obrigatoria` para bloquear login normal até troca de senha temporária;
- seed idempotente dos perfis administrativos `TOTAL`, `MODERADOR_DE_CONTEUDO`, `GERENTE_DE_APOIOS` e `ANALISTA_DE_INTERACOES`.

Diretrizes:

- senha deve ser persistida apenas como hash;
- email e login devem ter índices compatíveis com a regra de unicidade definida;
- telefone permanece como campo único nesta entrega;
- relacionamentos com acompanhamento, consultas, medicamentos e apoios devem respeitar as specifications dos respectivos contextos;
- dados administrativos não devem ser usados como atalho para autorização irrestrita.
- `Endereco.localizacaoPostgis` deve ser gravado por SQL parametrizado com `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)` porque o campo é `Unsupported` no Prisma Client.

## 7. Segurança e autorização

Atende:

- REQ-UA-008
- REQ-UA-009
- RN-UA-001
- RN-UA-008
- RN-UA-009

O domínio não deve depender de JWT, cookies, sessão HTTP ou headers.

A camada de API e infraestrutura deve transformar o mecanismo técnico em uma identidade autenticada para a aplicação:

```text
HTTP Request
  ↓
Authentication mechanism
  ↓
Authenticated identity
  ↓
Application use case
```

Autorização deve ser aplicada nos casos de uso protegidos. A existência de `Administrador` e `NivelAcesso` não autoriza automaticamente acesso a qualquer recurso.

Decisões técnicas desta entrega:

- senha com bcrypt custo 12;
- access token JWT HS256 com TTL de 15 minutos;
- refresh token opaco rotativo com TTL de 7 dias;
- refresh token em cookie HttpOnly;
- CSRF token legível pelo cliente e validado por header `x-csrf-token`;
- refresh token e CSRF token persistidos somente como HMAC SHA-256.
- backoffice protegido por Bearer token e perfil administrativo `TOTAL`;
- sessão autenticada carrega `tipo` e `perfisAdministrativos`;
- paciente autenticado só pode operar o próprio cadastro nas rotas mobile.

## 8. Tratamento de erros

Erros esperados:

- credenciais inválidas;
- usuário não encontrado durante autenticação;
- senha antiga inválida;
- nova senha inválida;
- email inválido;
- login inválido;
- nome inválido;
- telefone inválido;
- data de nascimento inválida;
- acesso não autenticado;
- acesso autenticado sem autorização.
- tentativa de duplicar email ou login;
- tentativa de inativar/remover `TOTAL` do último administrador full;
- login com troca de senha obrigatória.

Respostas de autenticação não devem revelar qual parte da credencial falhou.

## 9. Privacidade

Dados pessoais manipulados:

- nome;
- email;
- telefone;
- data de nascimento;
- dados vinculados ao paciente.

Respostas de API devem retornar somente os dados necessários ao caso de uso.

Logs, erros e telemetria não devem registrar senha, hash de senha ou credenciais recebidas.

## 10. Estratégia de testes

Testes de domínio:

- validação de `Email`;
- validação de `Login`;
- validação de `Nome`;
- validação de `Telefone`;
- validação de `DataNascimento`;
- alteração de senha com senha antiga correta e incorreta.

Testes de aplicação:

- autenticação com credenciais válidas;
- autenticação com credenciais inválidas;
- atualização de último acesso;
- alteração de senha;
- bloqueio de resposta contendo hash de senha.

Testes de API:

- validação de payloads inválidos;
- respostas sem dados sensíveis;
- autenticação exigida para alteração de senha.

Testes de segurança:

- senha não persistida em texto puro;
- falhas de autenticação com mensagem genérica;
- domínio sem dependência de mecanismo técnico de autenticação.

## 11. Impactos

- Introduz o primeiro design formal do contexto de identidade no SDD da feature.
- Adiciona persistência de sessões autenticadas ao Prisma.
- Afeta a estratégia de segurança do backend por estabelecer a fronteira entre autenticação técnica e identidade autenticada.
- Deve ser revisado antes de implementação por envolver dados pessoais e credenciais.

## 12. Pendências

- Confirmar existência ou criação formal do ADR de autenticação citado pela arquitetura.
- Definir evolução do modelo persistido de telefone para cardinalidade `1..*`, se necessário.
- Definir vínculo entre `NivelAcesso` e perfis administrativos já citados na arquitetura de banco.
