import { z } from 'zod';
import { HUMORES, TIPOS_SINTOMA } from '../../domain/diario-sintomas/entities/registro-diario.entity.js';

const sintomasSchema = z.array(z.object({ tipo: z.enum(TIPOS_SINTOMA), intensidade: z.coerce.number().int().min(0).max(10), descricaoOutro: z.string().trim().min(1).max(120).optional().nullable() })).min(1).max(TIPOS_SINTOMA.length).superRefine((items, context) => {
  const tipos = new Set<string>();
  for (const [index, item] of items.entries()) {
    if (tipos.has(item.tipo)) context.addIssue({ code: 'custom', path: [index, 'tipo'], message: 'Sintoma duplicado.' });
    tipos.add(item.tipo);
    if (item.tipo === 'OUTRO' && (item.descricaoOutro?.trim().length ?? 0) === 0) context.addIssue({ code: 'custom', path: [index, 'descricaoOutro'], message: 'Descrição obrigatória para OUTRO.' });
    if (item.tipo !== 'OUTRO' && item.descricaoOutro !== undefined && item.descricaoOutro !== null) context.addIssue({ code: 'custom', path: [index, 'descricaoOutro'], message: 'Descrição permitida somente para OUTRO.' });
  }
});
function parseJson(value: unknown): unknown { if (typeof value !== 'string') return value; try { return JSON.parse(value); } catch { return value; } }
const booleanFromForm = z.preprocess((value) => {
  if (value === undefined) return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}, z.boolean().optional().default(false));
export const saveDiarioSchema = z.object({ humor: z.enum(HUMORES), sintomas: z.preprocess(parseJson, sintomasSchema), removerNotaVoz: booleanFromForm });
export const listDiarioQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }).strict();
export type SaveDiarioRequestBody = z.infer<typeof saveDiarioSchema>;
export type ListDiarioQuery = z.infer<typeof listDiarioQuerySchema>;
