# Módulo de Usuário e Autenticação — Review

## 1. Status

Aprovado para a segunda entrega.

Esta revisão aprova o escopo de autenticação e CRUD de usuários: administradores pelo backoffice, pacientes pelo mobile, documentação Swagger e testes automatizados.

## 2. Requirements

Pontos a revisar:

- Os requisitos foram derivados do diagrama de classes informado.
- Política de senha, hash, JWT, refresh token e CSRF foram definidos para esta entrega.
- Administrador é cadastrado pelo backoffice e paciente pelo mobile.
- `TOTAL` foi definido como perfil full.
- A regra de manter ao menos um administrador ativo com `TOTAL` foi definida.
- Operações de paciente aparecem no diagrama, mas dependem de outros contextos e não devem ser implementadas integralmente por esta feature sem specifications próprias.

## 3. Architecture

Pontos a revisar:

- O design respeita a divisão `API → Application → Domain → Infrastructure`.
- O domínio permanece desacoplado de JWT, cookies, sessão HTTP e framework.
- O schema Prisma atual contém as entidades principais de identidade, sessões autenticadas, `troca_senha_obrigatoria` e seed idempotente de perfis administrativos.

## 4. Security

Pontos a revisar:

- Senha deve ser armazenada somente como hash.
- Erros de autenticação não devem revelar se login, email ou senha falhou.
- Identidade autenticada não deve implicar autorização irrestrita.
- O mecanismo desta entrega é JWT HS256 com refresh token opaco rotativo em cookie HttpOnly e CSRF.
- CRUD de backoffice exige Bearer token e perfil `TOTAL`.
- Senha temporária é retornada somente na criação do administrador.
- Login com `trocaSenhaObrigatoria=true` retorna `409` sem criar sessão/token.

## 5. Privacy

Pontos a revisar:

- O módulo manipula dados pessoais.
- Dados de paciente exigem finalidade explícita e restrição de acesso.
- Hash de senha e credenciais não devem aparecer em respostas, logs ou telemetria.

## 6. Validação

- Testes automatizados Japa cobrem domínio, aplicação e contratos de API.
- Swagger documenta rotas de autenticação, backoffice e mobile.
- Respostas sanitizadas não incluem `senhaHash`, refresh token hash ou CSRF hash.

## 7. Pendências não bloqueantes

- Definir evolução de telefone para cardinalidade `1..*`.
- Definir política de retenção e auditoria de sessões antigas.

## 8. Decisão de review

Aprovado.
