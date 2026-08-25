# Módulo de Usuário e Autenticação — Tasks

## 1. Status

Não iniciado.

As tarefas abaixo são preliminares e dependem da revisão da feature.

## 2. Preparação

- [ ] Revisar `requirements.md`.
- [ ] Revisar `design.md`.
- [ ] Resolver pendências bloqueantes de autenticação.
- [ ] Definir contratos finais de API.
- [ ] Definir modelo de persistência no Prisma.

## 3. Domain

- [ ] Criar entidade `Usuario`.
- [ ] Criar especialização ou representação de `Paciente`.
- [ ] Criar especialização ou representação de `Administrador`.
- [ ] Criar enum `NivelAcesso`.
- [ ] Criar value object `Email`.
- [ ] Criar value object `Login`.
- [ ] Criar value object `SenhaHash`.
- [ ] Criar value object `Nome`.
- [ ] Criar value object `Telefone`.
- [ ] Criar value object `DataNascimento`.
- [ ] Implementar regra de alteração de senha.

## 4. Application

- [ ] Criar caso de uso de autenticação.
- [ ] Criar caso de uso de alteração de senha.
- [ ] Criar representação de identidade autenticada.
- [ ] Definir portas de repositório para usuário.
- [ ] Definir porta para hash e comparação de senha.

## 5. Infrastructure

- [ ] Modelar tabelas no Prisma.
- [ ] Criar implementação Prisma do repositório de usuário.
- [ ] Criar implementação do serviço de hash.
- [ ] Criar adaptação do mecanismo de autenticação definido.

## 6. API

- [ ] Criar schemas Zod para entrada.
- [ ] Criar endpoint de login.
- [ ] Criar endpoint de logout, se aplicável ao mecanismo escolhido.
- [ ] Criar endpoint de alteração de senha.
- [ ] Criar endpoint de usuário autenticado, se aprovado.
- [ ] Garantir que respostas não exponham dados sensíveis.

## 7. Testes

- [ ] Testar validações dos objetos de valor.
- [ ] Testar autenticação com sucesso.
- [ ] Testar autenticação com falha genérica.
- [ ] Testar alteração de senha.
- [ ] Testar ausência de hash de senha nas respostas.
- [ ] Testar isolamento entre domínio e mecanismo técnico de autenticação.

## 8. Validação

- [ ] Executar testes automatizados.
- [ ] Revisar aderência à Constitution.
- [ ] Revisar aderência à arquitetura de segurança.
- [ ] Revisar tratamento de dados pessoais.
