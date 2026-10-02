# Dashboard — Crescimento mensal

**Status:** APPROVED

## Objetivo

Disponibilizar ao backoffice uma série histórica mensal para o gráfico de crescimento.

## Requirements

### REQ-001 — Consulta autenticada

O endpoint `GET /api/v1/backoffice/dashboard/crescimento-mensal` deve exigir autenticação administrativa e aceitar obrigatoriamente `periodMonths=6|12`.

### REQ-002 — Série mensal acumulada

A resposta deve conter os últimos 6 ou 12 meses completos em UTC, ordenados do mais antigo ao mais recente. Cada mês usa `YYYY-MM` e permanece presente mesmo sem eventos.

### REQ-003 — Critérios das séries

`articlesPublished` considera artigos atualmente `PUBLICADO` pela `dataPublicacao`; `supportLocations` considera apoios atualmente `ATIVO` pela `dataCriacao`; `activeUsers` considera todos os usuários atualmente `ATIVO` pela `dataCriacao`.

### REQ-004 — Autorização parcial

Uma série é disponibilizada somente à permissão correspondente: conteúdos, radar de apoio ou usuários. `TOTAL` disponibiliza todas. Sem acesso a uma série, seu valor é `null`; sem qualquer uma das permissões, a rota retorna `403`.

## Critérios de aceite

- Valores autorizados são acumulados até cada mês; sem registros retornam zero.
- `periodMonths` ausente ou diferente de 6/12 retorna o erro de validação padrão.
- O endpoint não consulta séries não autorizadas.

## Limitação conhecida

Não há histórico de transições de status. Logo, a elegibilidade é avaliada pelo status atual do registro; não se afirma que o status era o mesmo no mês histórico.
