# Feature Decisions — Diário de Sintomas

## DEC-001 — Uma entrada por dia

O dia corrente do servidor identifica a entrada e a chave composta no banco impede duplicidade.

## DEC-002 — Áudio local protegido

O armazenamento local foi escolhido para esta fase. Arquivos recebem nomes opacos e são servidos por rota autenticada; futura troca por object storage preservará a porta `VoiceNoteStorage`.

## DEC-003 — Histórico imutável

Somente a entrada do dia atual pode ser atualizada. O histórico não possui exclusão.
