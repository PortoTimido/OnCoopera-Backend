import { z } from 'zod';
import {
  STATUS_APOIO,
  TIPOS_APOIO,
} from '../../domain/radar-apoio/entities/apoio.entity.js';

const optionalQueryString = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  z.string().trim().optional(),
);

const optionalQueryNumber = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  z.coerce.number().optional(),
);

export const tipoApoioSchema = z.enum(TIPOS_APOIO);
export const statusApoioSchema = z.enum(STATUS_APOIO);

const enderecoSchema = z
  .object({
    cep: z.string().trim().min(1).max(20),
    logradouro: z.string().trim().min(1).max(160),
    numero: z.string().trim().min(1).max(20),
    complemento: z.string().trim().max(120).nullable().optional().default(null),
    bairro: z.string().trim().min(1).max(100),
    cidade: z.string().trim().min(1).max(100),
    estado: z.string().trim().min(2).max(2),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  })
  .strict();

const horarioSchema = z
  .object({
    diaSemana: z.coerce.number().int().min(0).max(6),
    horarioInicio: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/),
    horarioFim: z
      .string()
      .trim()
      .regex(/^\d{2}:\d{2}$/),
  })
  .strict();

export const listApoiosQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalQueryString,
    tipoApoio: tipoApoioSchema.optional(),
    status: statusApoioSchema.optional(),
    cidade: optionalQueryString,
    latitude: optionalQueryNumber,
    longitude: optionalQueryNumber,
  })
  .strict();

export const listActiveApoiosQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalQueryString,
    tipoApoio: tipoApoioSchema.optional(),
    cidade: optionalQueryString,
    latitude: optionalQueryNumber,
    longitude: optionalQueryNumber,
  })
  .strict();

export const createApoioSchema = z
  .object({
    nome: z.string().trim().min(1).max(160),
    tipoApoio: tipoApoioSchema,
    telefone: z.string().trim().min(1).max(30),
    descricao: z.string().trim().nullable().optional().default(null),
    status: statusApoioSchema.default('RASCUNHO'),
    endereco: enderecoSchema,
    horarios: z.array(horarioSchema).default([]),
    imagensUrl: z.array(z.string().trim().url()).default([]),
  })
  .strict();

export const updateApoioSchema = createApoioSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

export type ListApoiosQuery = z.infer<typeof listApoiosQuerySchema>;
export type ListActiveApoiosQuery = z.infer<typeof listActiveApoiosQuerySchema>;
export type CreateApoioRequestBody = z.infer<typeof createApoioSchema>;
export type UpdateApoioRequestBody = z.infer<typeof updateApoioSchema>;
