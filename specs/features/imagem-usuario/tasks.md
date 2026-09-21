# Imagem de Perfil do Usuário — Tasks

```text
REQ-001, REQ-004, BR-002, BR-003
  T001 — Adicionar coluna imagem_object_key em usuario (schema + migration)
  T002 — Expor imagemUrl em Usuario/PublicUsuario (domínio)
  T003 — Adicionar findImagemObjectKey/setImagemObjectKey na porta UsuarioRepository
  T004 — Implementar UploadUsuarioImagemUseCase e DeleteUsuarioImagemUseCase
  T005 — Implementar resolução de imagemUrl e métodos de objectKey em PrismaUsuarioRepository
  T006 — Expor POST/DELETE /auth/me/imagem no AuthController com Swagger
  T007 — Registrar providers/módulos (AuthModule + ArmazenamentoImagemModule)

REQ-002
  T004 (DeleteUsuarioImagemUseCase), T006 (DELETE /auth/me/imagem)

REQ-003
  T002, T005, T006 (AuthenticatedUserSwaggerDto.imagemUrl)

AC-001..AC-006
  T008 — Testes unitários dos casos de uso (upload/substituição/remoção/idempotência)
  T009 — Teste de domínio garantindo imagemUrl em toPublic()
```

## Status

Todas as tasks acima foram concluídas nesta implementação.
