# Modulo de Artigo - Review

## 1. Checklist de revisao

- [ ] Dominio nao depende de HTTP, Prisma ou Nest.
- [ ] API valida entrada com Zod.
- [ ] Swagger documenta requests, responses e erros.
- [ ] Backoffice exige autenticacao e perfil de conteudo.
- [ ] Mobile retorna apenas artigos publicados.
- [ ] Testes cobrem dominio, aplicacao e API.

## 2. Riscos

- Divergencia entre o diagrama de classes e o schema Prisma atual foi resolvida adotando o Prisma como fonte canonica desta entrega.
- Remocao de categoria/tag precisa bloquear itens em uso para preservar integridade dos artigos.
