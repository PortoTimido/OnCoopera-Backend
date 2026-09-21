# Imagem de Perfil do Usuário — Review

## 1. Pontos verificados

- **Duplicação de funcionalidade existente**: verificado que não há mecanismo prévio de imagem de usuário; o padrão de armazenamento (`ImageStorage`/MinIO) já existe e é reutilizado sem duplicação (artigo, apoio).
- **Impacto em funcionalidades existentes**: `PublicUsuario` ganha um campo novo (`imagemUrl`); nenhum campo existente é removido ou renomeado. Endpoints existentes (`/auth/me`, listagem/detalhe de usuários no backoffice) apenas passam a incluir o novo campo.
- **Impacto no banco de dados**: nova coluna opcional em `usuario`, sem necessidade de backfill.
- **Riscos de segurança**: operação restrita ao próprio usuário autenticado (BR-001); nenhum identificador de usuário alvo é aceito no payload ou na rota, eliminando risco de um usuário alterar a imagem de outro.
- **Riscos de privacidade (LGPD)**: avaliados na seção 9 de `requirements.md`; imagem tratada como dado pessoal, acesso somente via URL assinada temporária, bucket privado.
- **Decisões não justificadas**: decisões de escopo (autogestão exclusiva, campo único em `Usuario`) foram explicitamente confirmadas com o responsável pelo produto antes da elaboração deste design, para não presumir regra de negócio não definida.
- **Reuso de componentes existentes**: `ImageStorage`, `MinioImageStorageService`, `ArmazenamentoImagemModule` e o padrão de casos de uso de upload/remoção de imagem (`manage-artigo-imagem.use-cases.ts`) são reutilizados sem alteração de contrato.

## 2. Inconsistências encontradas

Nenhuma inconsistência entre requirements e design foi identificada nesta revisão.

## 3. Conclusão

Design aprovado para avançar para tasks e implementação.
