SDD — Envio de e-mails transacionais
1. Objetivo

Implementar o envio de e-mails transacionais para:

Recuperação de senha:
Gerar um código no backend.
Enviar o código ao e-mail do usuário.
Validar o código antes de permitir a redefinição da senha.
Cadastro de administrador:
Gerar uma senha temporária segura.
Enviar a senha ao e-mail do administrador cadastrado.
Exigir a alteração da senha no primeiro acesso.

Inicialmente, os e-mails serão capturados pelo Mailtrap Email Sandbox, sem entrega para endereços reais.

2. Escopo
Incluído
Integração SMTP com o Mailtrap.
Serviço centralizado para envio de e-mails.
Template para recuperação de senha.
Template para cadastro de administrador.
Geração e validação do código de recuperação.
Geração de senha temporária.
Obrigatoriedade de troca da senha temporária.
Expiração, limite de tentativas e reenvio do código.
Registro técnico das tentativas de envio.
Testes unitários, de integração e manuais no Mailtrap.
Fora do escopo inicial
Envio de e-mails de marketing.
Anexos.
Webhooks de entrega, abertura ou rejeição.
Recuperação por SMS ou WhatsApp.
Configuração definitiva do provedor de produção.
3. Requisitos funcionais
RF01 — Solicitar recuperação de senha

O usuário deverá informar seu e-mail na opção “Esqueci a senha”.

O backend deverá:

Normalizar o e-mail.
Localizar um usuário ativo correspondente.
Invalidar códigos anteriores ainda ativos.
Gerar um código numérico aleatório de seis dígitos.
Armazenar somente o hash do código.
Definir validade de 10 minutos.
Enviar o código por e-mail.

A resposta da API deve ser genérica, independentemente de o e-mail existir:

Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.

Isso evita a identificação de usuários cadastrados.

RF02 — Validar código de recuperação

O backend deverá validar:

E-mail e código informados.
Código não utilizado.
Prazo de validade.
Quantidade máxima de tentativas.

O limite será de cinco tentativas. Após esse limite, o código deverá ser invalidado.

Após uma validação bem-sucedida, o backend deverá emitir um token de curta duração, válido exclusivamente para redefinição de senha.

RF03 — Redefinir senha

O usuário deverá informar:

Token de redefinição.
Nova senha.
Confirmação da nova senha.

Após a alteração:

A senha será armazenada utilizando o algoritmo de hash definido pelo projeto.
O código e o token de recuperação serão invalidados.
Sessões e refresh tokens anteriores deverão ser revogados, se existirem.
RF04 — Reenviar código

O usuário poderá solicitar um novo código, respeitando:

Intervalo mínimo de 60 segundos.
Limite configurável de solicitações por e-mail e endereço IP.
Invalidação do código anterior.
RF05 — Cadastrar administrador

Ao cadastrar um administrador, o backend deverá:

Validar se o solicitante possui permissão.
Validar a unicidade do e-mail.
Gerar uma senha temporária segura.
Armazenar apenas o hash da senha.
Marcar o administrador como obrigado a alterar a senha.
Enviar a senha temporária ao e-mail cadastrado.

O cadastro não deve ser desfeito caso o envio falhe. Nesse caso, o sistema deverá informar que o administrador foi criado, mas o e-mail não pôde ser enviado, oferecendo uma ação para gerar e enviar uma nova senha temporária.

RF06 — Primeiro acesso

Administradores com senha temporária deverão ser impedidos de acessar as funcionalidades do sistema até definirem uma nova senha.

Depois da alteração:

A senha temporária perde a validade.
A obrigatoriedade de troca é removida.
As demais sessões do usuário são revogadas.
RF07 — Reenviar acesso temporário

Um administrador autorizado poderá solicitar o reenvio do acesso.

Essa operação deverá:

Invalidar a senha temporária anterior.
Gerar uma nova senha temporária.
Atualizar seu hash.
Enviar um novo e-mail.
Registrar a operação na auditoria.
4. Regras de negócio
Código	Regra
RN01	Códigos de recuperação devem ser gerados com fonte criptograficamente segura.
RN02	Somente o hash do código deve ser armazenado.
RN03	O código será válido por 10 minutos.
RN04	O código poderá ser utilizado apenas uma vez.
RN05	Um novo código invalida todos os códigos anteriores do usuário.
RN06	Após cinco tentativas inválidas, o código será bloqueado.
RN07	A senha temporária deverá atender à política de senhas do sistema.
RN08	A senha temporária nunca será armazenada ou registrada em texto puro.
RN09	Administradores com senha temporária deverão alterá-la no primeiro acesso.
RN10	Falhas de envio não devem expor credenciais, tokens ou existência de usuários.
RN11	Código, token e senha não poderão aparecer nos logs.
RN12	Os prazos e limites deverão ser configuráveis por variáveis de ambiente.
5. Fluxos
5.1 Recuperação de senha
5.2 Cadastro de administrador
6. Arquitetura proposta

A integração não deverá ser chamada diretamente pelos módulos de autenticação ou administração.

Auth/Admin → EmailService → EmailProvider → Mailtrap SMTP
Componentes
EmailService
Responsável pelos casos de uso de e-mail.
Seleciona e renderiza os templates.
EmailProvider
Contrato independente do provedor.
Recebe destinatário, assunto, HTML e texto alternativo.
SmtpEmailProvider
Implementação inicial por SMTP.
Utiliza as credenciais do Mailtrap.
EmailTemplateRenderer
Renderiza os templates com dados tipados.
Escapa dados inseridos no HTML.
EmailModule
Centraliza configuração, provider e serviço.

Estrutura sugerida:

src/
├── application/
│   └── email/
│       ├── send-password-recovery-email.use-case.ts
│       └── send-admin-temporary-password-email.use-case.ts
├── domain/
│   └── email/
│       └── email-provider.ts
├── infrastructure/
│   └── email/
│       ├── email.module.ts
│       ├── smtp-email.provider.ts
│       └── templates/
│           ├── password-recovery.template.ts
│           └── admin-temporary-password.template.ts
└── modules/
    ├── auth/
    └── administrators/

O envio poderá ser colocado na fila já existente no projeto, com tentativas automáticas e processamento fora da requisição HTTP. Para o MVP, considerar três tentativas com intervalo progressivo.

7. Modelo de dados
Recuperação de senha

Tabela sugerida: recuperacao_senha

Campo	Tipo	Descrição
id	UUID	Identificador
usuario_id	UUID	Usuário relacionado
codigo_hash	VARCHAR	Hash do código
expira_em	TIMESTAMP	Validade do código
utilizado_em	TIMESTAMP NULL	Data de utilização
tentativas	INTEGER	Tentativas inválidas
bloqueado_em	TIMESTAMP NULL	Bloqueio por excesso de tentativas
criado_em	TIMESTAMP	Data de criação

O código puro não deverá ser persistido.

Administrador

Adicionar ou utilizar campos equivalentes:

Campo	Tipo	Descrição
deve_alterar_senha	BOOLEAN	Obriga a troca no primeiro acesso
senha_temporaria_expira_em	TIMESTAMP NULL	Validade opcional da senha temporária
Registro de envio

Tabela opcional: email_envio

Campo	Tipo	Descrição
id	UUID	Identificador
tipo	ENUM/VARCHAR	Tipo do e-mail
destinatario_mascarado	VARCHAR	E-mail parcialmente oculto
status	VARCHAR	Pendente, enviado ou falhou
tentativas	INTEGER	Número de tentativas
erro_codigo	VARCHAR NULL	Código técnico sanitizado
enviado_em	TIMESTAMP NULL	Data do envio
criado_em	TIMESTAMP	Data de criação

Não armazenar corpo do e-mail, código ou senha temporária nessa tabela.

8. Contratos da API

Os nomes podem ser adaptados às rotas atuais do projeto.

Solicitar recuperação
POST /auth/password-recovery/request
{
  "email": "usuario@exemplo.com"
}

Resposta sempre genérica:

{
  "message": "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha."
}
Validar código
POST /auth/password-recovery/verify
{
  "email": "usuario@exemplo.com",
  "code": "483921"
}
{
  "resetToken": "token-de-curta-duracao"
}
Redefinir senha
POST /auth/password-recovery/reset
{
  "resetToken": "token-de-curta-duracao",
  "newPassword": "NovaSenhaSegura",
  "passwordConfirmation": "NovaSenhaSegura"
}
Reenviar acesso temporário
POST /administrators/:id/resend-temporary-access

Essa rota deverá exigir autenticação e permissão administrativa.

9. Templates
Recuperação de senha
Assunto: Código para redefinição de senha — OnCoopera
Nome do usuário, quando disponível.
Código em destaque.
Tempo de validade.
Aviso para ignorar a mensagem caso não tenha solicitado.
Nenhum link externo obrigatório.
Cadastro de administrador
Assunto: Seu acesso administrativo ao OnCoopera
Nome do administrador.
E-mail utilizado para acesso.
Senha temporária.
Orientação de troca obrigatória no primeiro acesso.
Aviso para não compartilhar a credencial.

Os templates deverão possuir:

Versão HTML.
Versão em texto puro.
Layout responsivo.
Linguagem clara e acessível.
Identidade visual do OnCoopera.

Embora seja possível enviar a senha temporária por e-mail, a alternativa mais segura para uma evolução futura é enviar um link ou código de ativação de uso único para que o próprio administrador defina sua primeira senha.

10. Configuração
EMAIL_PROVIDER=smtp
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=false
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_FROM_NAME=OnCoopera
EMAIL_FROM_ADDRESS=no-reply@oncoopera.com.br

PASSWORD_RECOVERY_CODE_TTL_MINUTES=10
PASSWORD_RECOVERY_MAX_ATTEMPTS=5
PASSWORD_RECOVERY_RESEND_INTERVAL_SECONDS=60
TEMPORARY_PASSWORD_TTL_HOURS=24

As credenciais deverão ser obtidas na área de integração do inbox do Mailtrap e nunca poderão ser commitadas. A documentação recomenda copiar as credenciais SMTP disponibilizadas na aba de integração. Integração SMTP do Mailtrap

11. Segurança
Validar todas as entradas com Zod ou o padrão de validação adotado pelo backend.
Aplicar rate limiting por IP e e-mail.
Não revelar se determinado e-mail está cadastrado.
Utilizar comparação segura para códigos e tokens.
Não armazenar códigos, tokens ou senhas em texto puro.
Não incluir dados sensíveis nos logs.
Mascarar o destinatário em logs e auditorias.
Restringir o reenvio de acesso a usuários autorizados.
Revogar sessões após redefinição de senha.
Auditar criação de administrador e reenvio de acesso.
Manter credenciais SMTP somente nas variáveis de ambiente.
12. Tratamento de falhas
O serviço deverá distinguir falha temporária de configuração inválida.
Envios assíncronos deverão possuir até três tentativas.
Falhas não poderão retornar detalhes do SMTP ao frontend.
O erro técnico deverá ser registrado de maneira sanitizada.
O cadastro do administrador não deverá ser duplicado ao repetir uma operação.
O reprocessamento de uma mensagem deverá ser idempotente.
Ao gerar uma nova senha temporária, a anterior deverá ser imediatamente invalidada.
13. Critérios de aceite
O Mailtrap recebe o e-mail de recuperação com o código correto.
O Mailtrap recebe o e-mail de cadastro com a senha temporária correta.
O código expira após o período configurado.
O código só pode ser utilizado uma vez.
O código anterior deixa de funcionar após reenvio.
Após cinco erros, o código é bloqueado.
A recuperação retorna a mesma resposta para e-mails existentes e inexistentes.
A senha temporária é salva apenas como hash.
O administrador é obrigado a trocar a senha no primeiro acesso.
Usuários sem permissão não conseguem reenviar acesso temporário.
Falhas no SMTP não expõem credenciais nem informações internas.
Nenhum código, token ou senha aparece nos logs.
Os templates são exibidos corretamente no Mailtrap.
Os endpoints estão documentados no Swagger.
14. Testes necessários
Testes unitários
Geração do código.
Geração da senha temporária.
Expiração do código.
Limite de tentativas.
Invalidação após uso.
Renderização dos templates.
Mascaramento do destinatário.
Obrigatoriedade de troca da senha.
Testes de integração
Solicitação e validação da recuperação.
Redefinição completa da senha.
Cadastro de administrador.
Reenvio de acesso temporário.
Comportamento quando o SMTP falhar.
Autorização das rotas administrativas.
Testes manuais no Mailtrap
Conteúdo HTML e texto.
Assunto e remetente.
Responsividade.
Ausência de links incorretos.
Cabeçalhos e destinatários.
Compatibilidade do HTML.
15. Ordem de implementação
Criar o contrato EmailProvider.
Implementar o provider SMTP.
Configurar as variáveis de ambiente.
Criar os templates.
Implementar a recuperação de senha.
Implementar a senha temporária do administrador.
Adicionar troca obrigatória no primeiro acesso.
Integrar o envio à fila.
Documentar os endpoints no Swagger.
Implementar testes e validar as mensagens no Mailtrap.