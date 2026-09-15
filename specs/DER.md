# Diagrama Entidade-Relacionamento

O diagrama abaixo representa o modelo físico definido em `src/prisma/schema.prisma`.

```mermaid
erDiagram
    USUARIO ||--o| PACIENTE : possui
    USUARIO ||--o| ADMINISTRADOR : possui
    USUARIO ||--o{ SESSAO_AUTENTICACAO : inicia
    USUARIO ||--o{ RECUPERACAO_SENHA : solicita
    ENDERECO ||--o{ PACIENTE : atende
    PACIENTE ||--o{ REGISTRO_DIARIO : registra
    REGISTRO_DIARIO ||--o{ REGISTRO_SINTOMA : detalha
    PACIENTE ||--o{ CONSULTA : agenda

    ENDERECO ||--o{ APOIO : localiza
    APOIO ||--o{ HORARIO_FUNCIONAMENTO : funciona
    APOIO ||--o{ APOIO_IMAGEM : possui

    ADMINISTRADOR ||--o{ ADMINISTRADOR_PERMISSAO : recebe

    ADMINISTRADOR ||--o{ ARTIGO : escreve
    ARTIGO ||--o{ ARTIGO_CATEGORIA : classifica
    CATEGORIA ||--o{ ARTIGO_CATEGORIA : agrupa
    ARTIGO ||--o{ ARTIGO_TAG : rotula
    TAG ||--o{ ARTIGO_TAG : identifica

    USUARIO {
        uuid id PK
        string nome
        string email UK
        string login UK
        string senha_hash
        string telefone
        date data_nascimento
        StatusUsuario status
        boolean troca_senha_obrigatoria
        datetime data_criacao
        datetime data_atualizacao
        datetime ultimo_acesso
        datetime senha_temporaria_expira_em
    }

    RECUPERACAO_SENHA {
        uuid id PK
        uuid usuario_id FK
        string codigo_hash
        datetime expira_em
        int tentativas
        datetime bloqueado_em
        datetime codigo_validado_em
        string reset_token_hash
        datetime reset_token_expira_em
        datetime token_utilizado_em
        datetime criado_em
    }

    LIMITE_RECUPERACAO_SENHA {
        uuid id PK
        string email_hash
        string ip_hash
        datetime criado_em
    }

    EMAIL_ENVIO {
        uuid id PK
        string tipo
        string destinatario_mascarado
        StatusEmailEnvio status
        int tentativas
        string erro_codigo
        datetime enviado_em
        datetime criado_em
    }

    SESSAO_AUTENTICACAO {
        uuid id PK
        uuid usuario_id FK
        string refresh_token_hash UK
        string csrf_token_hash
        datetime expires_at
        datetime revoked_at
        datetime last_used_at
        datetime created_at
        datetime updated_at
    }

    PACIENTE {
        uuid usuario_id PK, FK
        uuid endereco_id FK
    }

    ADMINISTRADOR {
        uuid usuario_id PK, FK
    }

    ADMINISTRADOR_PERMISSAO {
        uuid administrador_id PK, FK
        PermissaoAdministrativa permissao PK
    }

    ENDERECO {
        uuid id PK
        string cep
        string logradouro
        string numero
        string complemento
        string bairro
        string cidade
        string estado
        geometry localizacao_postgis
    }

    REGISTRO_DIARIO {
        uuid id PK
        uuid paciente_id FK
        date data_registro
        datetime data_hora
        string humor
        string nota_voz_url
    }

    REGISTRO_SINTOMA {
        uuid id PK
        uuid registro_diario_id FK
        string sintoma_tipo
        int intensidade
        string descricao_outro
    }

    CONSULTA {
        uuid id PK
        uuid paciente_id FK
        string medico_nome
        datetime data_hora
        string status_consulta
        string observacao
        datetime data_criacao
        datetime data_atualizacao
    }

    APOIO {
        uuid id PK
        uuid endereco_id FK
        string nome
        TipoApoio tipo_apoio
        string telefone
        text descricao
        StatusApoio status_administrativo
        datetime data_criacao
        datetime data_atualizacao
    }

    HORARIO_FUNCIONAMENTO {
        uuid id PK
        uuid apoio_id FK
        int dia_semana
        time horario_inicio
        time horario_fim
    }

    APOIO_IMAGEM {
        uuid id PK
        uuid apoio_id FK
        string object_key
        int ordem
    }

    ARTIGO {
        uuid id PK
        uuid autor_id FK
        string titulo
        text conteudo
        int tempo_leitura_minutos
        string imagem_object_key
        StatusArtigo status
        datetime data_criacao
        datetime data_atualizacao
        datetime data_publicacao
    }

    CATEGORIA {
        uuid id PK
        string nome UK
    }

    ARTIGO_CATEGORIA {
        uuid artigo_id PK, FK
        uuid categoria_id PK, FK
    }

    TAG {
        uuid id PK
        string nome UK
    }

    ARTIGO_TAG {
        uuid artigo_id PK, FK
        uuid tag_id PK, FK
    }
```

## Restrições e enumerações

- `registro_diario` possui unicidade composta em `(paciente_id, data_registro)`.
- `horario_funcionamento` possui unicidade composta em `(apoio_id, dia_semana, horario_inicio, horario_fim)`.
- `apoio_imagem` possui unicidade composta em `(apoio_id, ordem)`.
- `recuperacao_senha` possui índice em `(usuario_id, criado_em)`.
- `limite_recuperacao_senha` possui índices em `(email_hash, criado_em)` e `(ip_hash, criado_em)`.
- `email_envio` possui índice em `(tipo, criado_em)`.
- `artigo_categoria`, `artigo_tag` e `administrador_permissao` usam chaves primárias compostas pelas colunas indicadas no diagrama.
- Exclusões em cascata: `usuario → sessao_autenticacao`, `usuario → recuperacao_senha`, `usuario → paciente`, `usuario → administrador`, `administrador → administrador_permissao`, `paciente → registro_diario`, `registro_diario → registro_sintoma`, `apoio → horario_funcionamento`, `apoio → apoio_imagem`, `artigo → artigo_categoria/artigo_tag` e `categoria/tag →` suas respectivas tabelas associativas.

| Enum | Valores |
| --- | --- |
| `StatusUsuario` | `ATIVO`, `INATIVO`, `BLOQUEADO` |
| `StatusEmailEnvio` | `PENDENTE`, `ENVIADO`, `FALHOU` |
| `TipoApoio` | `ONG`, `CLINICA`, `TRANSPORTE`, `CASA_APOIO`, `PSICOLOGO` |
| `StatusApoio` | `RASCUNHO`, `ATIVO`, `DESATIVADO` |
| `StatusArtigo` | `RASCUNHO`, `PUBLICADO`, `DESATIVADO` |
| `PermissaoAdministrativa` | `TOTAL`, `GERENCIAR_USUARIOS`, `GESTAO_CONTEUDOS`, `GESTAO_RADAR_APOIO` |
