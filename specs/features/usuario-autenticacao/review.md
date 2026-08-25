# Módulo de Usuário e Autenticação — Review

## 1. Status

Pendente.

Esta feature ainda não deve avançar para implementação sem revisão, pois envolve autenticação, credenciais e dados pessoais.

## 2. Requirements

Pontos a revisar:

- Os requisitos foram derivados do diagrama de classes informado.
- Algumas regras essenciais ainda estão pendentes, especialmente política de senha, unicidade de email/login e fluxo de cadastro.
- Operações de paciente aparecem no diagrama, mas dependem de outros contextos e não devem ser implementadas integralmente por esta feature sem specifications próprias.

## 3. Architecture

Pontos a revisar:

- O design respeita a divisão `API → Application → Domain → Infrastructure`.
- O domínio permanece desacoplado de JWT, cookies, sessão HTTP e framework.
- O schema Prisma atual ainda não contém as entidades citadas; a persistência precisa de design detalhado antes da implementação.

## 4. Security

Pontos a revisar:

- Senha deve ser armazenada somente como hash.
- Erros de autenticação não devem revelar se login, email ou senha falhou.
- Identidade autenticada não deve implicar autorização irrestrita.
- O mecanismo definitivo de autenticação ainda precisa ser confirmado.

## 5. Privacy

Pontos a revisar:

- O módulo manipula dados pessoais.
- Dados de paciente exigem finalidade explícita e restrição de acesso.
- Hash de senha e credenciais não devem aparecer em respostas, logs ou telemetria.

## 6. Pendências bloqueantes

- Definir mecanismo de autenticação vigente para implementação.
- Definir política de senha.
- Definir regras de unicidade de email e login.
- Definir contratos finais de API.
- Definir modelo de persistência no Prisma.

## 7. Decisão de review

Não revisado.
