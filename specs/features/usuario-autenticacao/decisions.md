# Módulo de Usuário e Autenticação — Decisions

## DEC-UA-001 — Usuário como raiz conceitual de identidade

Status: Proposta.

`Usuario` será tratado como entidade raiz conceitual do contexto de identidade, com `Paciente` e `Administrador` representando papéis ou especializações vinculadas.

Justificativa:

- O diagrama de classes apresenta `Usuario` como estrutura central.
- A arquitetura atual reconhece `usuario`, `paciente` e `administrador` como estruturas do contexto de identidade.

## DEC-UA-002 — Autenticação desacoplada do domínio

Status: Proposta.

O domínio não conhecerá JWT, cookies, sessão HTTP, headers ou framework.

Justificativa:

- A Constitution e a arquitetura de segurança exigem isolamento do mecanismo de autenticação.
- A aplicação deve receber uma identidade autenticada, não detalhes técnicos da requisição.

## DEC-UA-003 — Senha armazenada somente como hash

Status: Proposta.

Senha não será armazenada em texto puro.

Justificativa:

- O diagrama define `senha: SenhaHash`.
- A arquitetura de segurança proíbe exposição de credenciais.

## DEC-UA-004 — Níveis administrativos não substituem autorização por caso de uso

Status: Proposta.

`NivelAcesso` será utilizado como insumo para autorização, mas cada caso de uso protegido deve declarar sua própria regra de acesso.

Justificativa:

- Autenticação não implica autorização.
- O backoffice não deve assumir que todo administrador possui acesso irrestrito.

## DEC-UA-005 — Pendência sobre mecanismo final de autenticação

Status: Aberta.

A implementação concreta precisa confirmar se usará o mecanismo temporário de sessão ou o fluxo JWT previsto para o MVP.

Justificativa:

- A documentação existente registra autenticação temporária durante a fase atual.
- A arquitetura do backend também cita um mecanismo de MVP com access token JWT curto, refresh token rotativo em cookies HttpOnly, sessão revogável e CSRF.
- A feature deve evitar acoplar regras de domínio a qualquer mecanismo enquanto essa decisão não estiver revisada.
