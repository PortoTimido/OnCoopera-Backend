# Software Design Documentation — OnCoopera Backoffice

Este diretório é a porta de entrada para decisões e specifications do projeto.

## Ordem de leitura

1. [Constitution](constitution.md) — regras normativas de maior nível;
2. [Visão geral](architecture/system-overview.md) — contexto, componentes e prontidão;
3. arquiteturas de [backend](architecture/backend.md), [frontend](architecture/frontend.md), [banco](architecture/database.md), [segurança](architecture/security.md) e [convenções](architecture/conventions.md);
4. [ADRs](adr/README.md) — decisões e justificativas;
5. specification da feature em `features/<feature>/`.

## Fluxo de uma feature

```text
requirements → design → review → tasks → implementation → validation
```

Copie os arquivos de `templates/feature/` para `features/<nome-em-kebab-case>/`, remova seções não aplicáveis e mantenha os identificadores rastreáveis. Uma feature não entra em implementação enquanto `review.md` registrar pendência bloqueante.

## Estado da fundação

As decisões mínimas para scaffold e desenvolvimento local estão aceitas nos ADRs 001–006. Pendências listadas nas arquiteturas são gates da feature correspondente ou da produção, e não autorização para inventar requisitos.
