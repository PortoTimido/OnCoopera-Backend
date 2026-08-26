# Módulo de Usuário e Autenticação — Tasks

## 1. Status

Implementado para a segunda entrega.

## 2. Preparação

- [x] Revisar `requirements.md`.
- [x] Revisar `design.md`.
- [x] Resolver pendências bloqueantes de autenticação.
- [x] Definir contratos finais de API.
- [x] Definir modelo de persistência no Prisma.

## 3. Domain

- [x] Criar entidade `Usuario`.
- [x] Criar representação de `Paciente`.
- [x] Criar representação de `Administrador`.
- [x] Preservar níveis administrativos via perfis persistidos.
- [x] Criar value object `Email`.
- [x] Criar value object `Login`.
- [x] Criar value object `SenhaHash`.
- [x] Criar value object `Nome`.
- [x] Criar value object `Telefone`.
- [x] Criar value object `DataNascimento`.
- [x] Implementar regra de alteração de senha.

## 4. Application

- [x] Criar caso de uso de autenticação.
- [x] Criar caso de uso de renovação de sessão.
- [x] Criar caso de uso de logout.
- [x] Criar caso de uso de alteração de senha.
- [x] Criar representação de identidade autenticada.
- [x] Definir portas de repositório para usuário.
- [x] Definir portas de repositório para sessão.
- [x] Definir porta para hash e comparação de senha.
- [x] Definir portas para JWT, HMAC e geração de segredo.

## 5. Infrastructure

- [x] Modelar tabela de sessão no Prisma.
- [x] Criar implementação Prisma do repositório de usuário.
- [x] Criar implementação Prisma do repositório de sessão.
- [x] Criar implementação do serviço de hash.
- [x] Criar adaptação do mecanismo de autenticação definido.

## 6. API

- [x] Criar schemas Zod para entrada.
- [x] Criar endpoint de login.
- [x] Criar endpoint de refresh.
- [x] Criar endpoint de logout.
- [x] Criar endpoint de alteração de senha.
- [x] Criar endpoint de usuário autenticado.
- [x] Garantir que respostas não exponham dados sensíveis.

## 7. Testes

- [x] Testar validações dos objetos de valor.
- [x] Testar autenticação com sucesso.
- [x] Testar autenticação com falha genérica.
- [x] Testar refresh com rotação.
- [x] Testar logout e CSRF.
- [x] Testar alteração de senha.
- [x] Testar ausência de hash de senha nas respostas.
- [x] Testar isolamento entre domínio e mecanismo técnico de autenticação.

## 8. Validação

- [x] Executar testes automatizados.
- [x] Revisar aderência à Constitution.
- [x] Revisar aderência à arquitetura de segurança.
- [x] Revisar tratamento de dados pessoais.

## 9. Segunda entrega — CRUD de usuários

### SDD

- [x] Registrar administrador cadastrado pelo backoffice.
- [x] Registrar paciente cadastrado pelo mobile.
- [x] Registrar `full` como `PerfilAdministrativo.nome = TOTAL`.
- [x] Registrar regra de ao menos um administrador `ATIVO` com `TOTAL`.

### Prisma

- [x] Adicionar `Usuario.trocaSenhaObrigatoria`.
- [x] Criar migration `add-user-crud`.
- [x] Seed/migration idempotente dos perfis administrativos.
- [x] Gerar Prisma Client.

### Application

- [x] Estender contexto autenticado com `tipo` e `perfisAdministrativos`.
- [x] Criar guard/decorator de perfil administrativo.
- [x] Criar fluxo de senha temporária e troca obrigatória.
- [x] Criar casos de uso de CRUD de administradores.
- [x] Criar casos de uso de cadastro/autogestão de pacientes.
- [x] Revogar sessões ao inativar usuário.
- [x] Bloquear remoção/inativação do último administrador `TOTAL`.

### API e Swagger

- [x] Documentar `POST /api/auth/change-temporary-password`.
- [x] Documentar CRUD de backoffice.
- [x] Documentar cadastro/autogestão mobile de paciente.
- [x] Criar DTOs Swagger de request/response.
- [x] Marcar senhas como `writeOnly`.

### Testes

- [x] Cobrir senha temporária contra política.
- [x] Cobrir regra de último administrador `TOTAL`.
- [x] Cobrir paciente sem perfis administrativos.
- [x] Cobrir login bloqueado por troca obrigatória.
- [x] Cobrir criação de administrador com senha temporária.
- [x] Cobrir criação de paciente com endereço.
- [x] Cobrir inativação com revogação de sessão.
- [x] Cobrir autorização de backoffice sem `TOTAL` como `403`.
