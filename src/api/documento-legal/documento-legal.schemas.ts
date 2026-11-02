import { z } from 'zod';
import { TIPOS_DOCUMENTO_LEGAL } from '../../domain/documento-legal/documento-legal.js';

export const tipoDocumentoLegalSchema = z.enum(TIPOS_DOCUMENTO_LEGAL);

const conteudoSchema = z.string().trim().min(1);

export const createDocumentoLegalSchema = z
  .object({
    tipo: tipoDocumentoLegalSchema,
    conteudo: conteudoSchema,
  })
  .strict();

export const updateDocumentoLegalSchema = z
  .object({
    conteudo: conteudoSchema,
  })
  .strict();

export type CreateDocumentoLegalRequestBody = z.infer<
  typeof createDocumentoLegalSchema
>;
export type UpdateDocumentoLegalRequestBody = z.infer<
  typeof updateDocumentoLegalSchema
>;
