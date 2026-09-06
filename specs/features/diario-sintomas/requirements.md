# Diário de Sintomas — Requirements

**Status:** APPROVED

## Objetivo

Permitir que cada paciente registre e consulte seus sintomas diários, sem acesso administrativo ou entre pacientes.

## Requirements

### REQ-DS-001 — Registro diário

O paciente deve criar ou atualizar uma única entrada para o dia corrente, contendo humor e ao menos um sintoma com intensidade de 0 a 10.

### REQ-DS-002 — Histórico próprio

O paciente deve consultar seu histórico paginado e o detalhe de suas próprias entradas. Registros de dias anteriores são imutáveis.

### REQ-DS-003 — Sintomas catalogados

Os sintomas aceitos são náusea, fadiga, dor, tontura, febre, sono, apetite e outro. `OUTRO` exige descrição de até 120 caracteres.

### REQ-DS-004 — Nota de voz

O paciente pode anexar MP3, M4A ou WAV de até 10 MB. O áudio deve ser lido somente pelo respectivo paciente.

## Critérios de aceite

- AC-001: reenviar o registro no mesmo dia atualiza a mesma entrada.
- AC-002: paciente não acessa registros nem áudios de outro paciente.
- AC-003: administrador não acessa o módulo.
- AC-004: áudio inválido ou maior que 10 MB é rejeitado.
