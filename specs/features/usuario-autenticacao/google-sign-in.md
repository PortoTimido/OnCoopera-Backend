# Autenticação de pacientes com Google

## Contrato HTTP

`POST /api/auth/google`

```json
{
  "idToken": "<Google ID Token>"
}
```

O endpoint recebe somente o ID Token. Client ID, access token Google, código de
autorização e dados de perfil enviados separadamente não são aceitos como prova
de identidade.

Em caso de sucesso, a resposta e os cookies são os mesmos de
`POST /api/auth/login`:

```json
{
  "accessToken": "<OnCoopera access token>",
  "usuario": {
    "id": "<uuid>",
    "nome": "Paciente",
    "email": "paciente@example.com",
    "login": "paciente",
    "telefone": "11999999999",
    "dataNascimento": "1990-01-01",
    "status": "ATIVO",
    "tipo": "PACIENTE",
    "permissoesAdministrativas": [],
    "perfisAdministrativos": [],
    "trocaSenhaObrigatoria": false,
    "ultimoAcesso": "2026-11-02T12:00:00.000Z",
    "imagemUrl": null
  }
}
```

O access token é emitido pelo OnCoopera. O refresh token opaco permanece em
cookie HttpOnly, o CSRF token permanece no cookie legível e os endpoints de
refresh e logout continuam sendo `/api/auth/refresh` e `/api/auth/logout`.

## Validação e vínculo

- O backend valida assinatura, expiração, emissor e audiência com a biblioteca
  oficial `google-auth-library`.
- A única audiência aceita é `GOOGLE_WEB_CLIENT_ID`.
- O token deve conter `sub`, e-mail e `email_verified=true`.
- Um vínculo existente é localizado exclusivamente por `GOOGLE + sub`; mudanças
  futuras no e-mail Google não alteram a identidade vinculada.
- No primeiro acesso, um paciente já cadastrado pode ser vinculado quando seu
  e-mail normalizado coincide com o e-mail verificado do token.
- O vínculo é único por identidade Google e por provedor em cada usuário.
- Contas administrativas, pacientes inativos/bloqueados e usuários sem cadastro
  de paciente não podem usar esse fluxo.
- O endpoint não cria pacientes e não altera as regras do cadastro tradicional.

## Erros

| Status | Situação                                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| `400`  | Corpo ausente, malformado ou com campos não permitidos                                                     |
| `401`  | Token inválido, expirado, assinatura/emissor/audiência inválidos ou e-mail não verificado                  |
| `403`  | Conta não elegível para autenticação de paciente                                                           |
| `409`  | Cadastro inexistente (`GOOGLE_ACCOUNT_NOT_REGISTERED`) ou vínculo conflitante (`GOOGLE_IDENTITY_CONFLICT`) |
| `503`  | Validação Google temporariamente indisponível                                                              |

As respostas não incluem o ID Token nem detalhes internos da validação.

## Configuração

```dotenv
GOOGLE_WEB_CLIENT_ID=000000000000-example.apps.googleusercontent.com
```

Não é necessário nem permitido configurar Client Secret para este fluxo. Os
Client IDs nativos permanecem apenas no aplicativo mobile.
