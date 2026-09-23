import { z } from 'zod';
import { STATUS_ARTIGO } from '../../domain/artigo/entities/artigo.entity.js';

const optionalQueryString = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  z.string().trim().optional(),
);

const optionalQueryUuid = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  z.string().uuid().optional(),
);

export const statusArtigoSchema = z.enum(STATUS_ARTIGO);

export const listArtigosQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalQueryString,
    status: statusArtigoSchema.optional(),
    categoriaId: optionalQueryUuid,
    tagId: optionalQueryUuid,
    autorId: optionalQueryUuid,
  })
  .strict();

export const listPublishedArtigosQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalQueryString,
    categoriaId: optionalQueryUuid,
    tagId: optionalQueryUuid,
  })
  .strict();

export const createArtigoSchema = z
  .object({
    titulo: z.string().trim().min(1).max(160),
    resumo: z.string().trim().max(250).nullable().optional().default(null),
    conteudo: z.string().trim().min(1),
    tempoLeituraMinutos: z.coerce.number().int().min(1),
    imagemUrl: z.string().trim().url().nullable().optional().default(null),
    status: statusArtigoSchema.default('RASCUNHO'),
    categoriaIds: z.array(z.string().uuid()).min(1),
    tagIds: z.array(z.string().uuid()).optional().default([]),
  })
  .strict();

export const updateArtigoSchema = z
  .object({
    titulo: z.string().trim().min(1).max(160).optional(),
    resumo: z.string().trim().max(250).nullable().optional(),
    conteudo: z.string().trim().min(1).optional(),
    tempoLeituraMinutos: z.coerce.number().int().min(1).optional(),
    imagemUrl: z.string().trim().url().nullable().optional(),
    status: statusArtigoSchema.optional(),
    categoriaIds: z.array(z.string().uuid()).min(1).optional(),
    tagIds: z.array(z.string().uuid()).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

export const taxonomiaQuerySchema = z
  .object({
    search: optionalQueryString,
  })
  .strict();

export const taxonomiaSchema = z
  .object({
    nome: z.string().trim().min(1).max(80),
  })
  .strict();

export type ListArtigosQuery = z.infer<typeof listArtigosQuerySchema>;
export type ListPublishedArtigosQuery = z.infer<
  typeof listPublishedArtigosQuerySchema
>;
export type CreateArtigoRequestBody = z.infer<typeof createArtigoSchema>;
export type UpdateArtigoRequestBody = z.infer<typeof updateArtigoSchema>;
export type TaxonomiaQuery = z.infer<typeof taxonomiaQuerySchema>;
export type TaxonomiaRequestBody = z.infer<typeof taxonomiaSchema>;
