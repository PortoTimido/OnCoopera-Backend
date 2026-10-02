# Feature Decisions

## DEC-001 — Meses completos em UTC

O período é composto pelos últimos meses calendários já encerrados, em UTC. O mês corrente não é exibido parcialmente.

## DEC-002 — Séries sem autorização são nulas

Para não revelar ou simular métricas indisponíveis, cada série não autorizada retorna `null`; o cliente a oculta.

## DEC-003 — Status atual para histórico

Sem auditoria de status, as queries filtram pela situação atual e usam a data de criação/publicação existente. Não será criada migration fora do escopo.
