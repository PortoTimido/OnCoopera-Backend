# Módulo de Usuário e Autenticação — Decisions

## DEC-UA-001 — Usuário como raiz conceitual de identidade

Status: Aceita.

`Usuario` será tratado como entidade raiz conceitual do contexto de identidade, com `Paciente` e `Administrador` representando papéis ou especializações vinculadas.

Justificativa:

- O diagrama de classes apresenta `Usuario` como estrutura central.
- A arquitetura atual reconhece `usuario`, `paciente` e `administrador` como estruturas do contexto de identidade.

## DEC-UA-002 — Autenticação desacoplada do domínio

Status: Aceita.

O domínio não conhecerá JWT, cookies, sessão HTTP, headers ou framework.

Justificativa:

- A Constitution e a arquitetura de segurança exigem isolamento do mecanismo de autenticação.
- A aplicação deve receber uma identidade autenticada, não detalhes técnicos da requisição.

## DEC-UA-003 — Senha armazenada somente como hash

Status: Aceita.

Senha não será armazenada em texto puro e será processada com bcrypt, custo padrão 12.

Justificativa:

- O diagrama define `senha: SenhaHash`.
- A arquitetura de segurança proíbe exposição de credenciais.

## DEC-UA-004 — Níveis administrativos não substituem autorização por caso de uso

Status: Aceita.

`NivelAcesso` será utilizado como insumo para autorização, mas cada caso de uso protegido deve declarar sua própria regra de acesso.

Justificativa:

- Autenticação não implica autorização.
- O backoffice não deve assumir que todo administrador possui acesso irrestrito.

## DEC-UA-005 — Mecanismo de autenticação do MVP

Status: Aceita.

A implementação desta entrega utilizará access token JWT HS256 com TTL de 15 minutos e refresh token opaco rotativo em cookie HttpOnly com TTL de 7 dias.

Justificativa:

- A arquitetura do backend cita esse mecanismo como alvo do MVP.
- Refresh token opaco permite revogação no servidor.
- O domínio permanece desacoplado de JWT, cookies e sessão HTTP.

## DEC-UA-006 — Proteção CSRF para refresh e logout

Status: Aceita.

Operações baseadas no refresh cookie devem exigir header `x-csrf-token`.

Justificativa:

- Refresh token é transportado por cookie.
- A proteção CSRF evita que o cookie seja usado isoladamente por requisições forjadas.

## DEC-UA-007 — Cadastro por canal

Status: Aceita.

Administrador será cadastrado pelo backoffice. Paciente será cadastrado pelo aplicativo mobile.

Justificativa:

- O administrador depende de perfis administrativos e operação controlada.
- O paciente não possui níveis de permissão e deve iniciar pelo canal mobile.

## DEC-UA-008 — Perfil full como TOTAL

Status: Aceita.

O nível administrativo `full` será representado por `PerfilAdministrativo.nome = TOTAL`.

Justificativa:

- O schema Prisma já modela perfis administrativos persistidos.
- A autorização do backoffice precisa de um valor canônico.

## DEC-UA-009 — Exclusão por inativação

Status: Aceita.

Exclusões de administradores e pacientes serão realizadas por `Usuario.status = INATIVO`, revogando sessões ativas.

Justificativa:

- Preserva histórico de dados pessoais e relacionamentos do domínio.
- Evita perda acidental de rastreabilidade.

## DEC-UA-010 — Garantia de pelo menos um administrador TOTAL

Status: Aceita.

Operações que inativem o último administrador `ATIVO` com perfil `TOTAL`, ou removam esse perfil dele, devem falhar com `409`.

Mensagem:

`Deve existir ao menos um administrador ativo com permissão TOTAL.`
