# Dashboard — Technical Design

## Referências

- `../../constitution.md`
- `../../architecture/backend.md`
- `../../architecture/database.md`
- `../../architecture/security.md`
- `../../architecture/conventions.md`

Não há ADR aceita aplicável.

## Backend

`BackofficeDashboardController` valida a query com Zod, aplica os guards existentes e deriva quais séries a identidade autenticada pode consultar. `GetMonthlyGrowthUseCase` recebe essa decisão, calcula os meses completos em UTC e monta os acumulados. O domínio não recebe detalhes HTTP ou Prisma.

`PrismaDashboardRepository` usa no máximo três queries SQL parametrizadas, agrupadas por mês, e só executa as séries autorizadas. As queries abrangem dados anteriores à janela para formar o saldo inicial corretamente.

## API

```json
{
  "points": [
    {
      "month": "2026-04",
      "articlesPublished": 24,
      "supportLocations": null,
      "activeUsers": 1247
    }
  ]
}
```

Os campos de série são `number | null`: `null` representa falta de autorização, nunca ausência de dados. Zero representa série autorizada sem registros elegíveis.

## Segurança e privacidade

O endpoint requer JWT e ao menos uma permissão administrativa existente. Nenhum dado pessoal individual é retornado, somente contagens agregadas. O Backoffice deve ocultar as séries `null`.
