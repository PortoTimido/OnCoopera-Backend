import { z } from 'zod';
import {
  PERMISSAO_ADMINISTRATIVA_TOTAL,
  PERMISSOES_ADMINISTRATIVAS_CONHECIDAS,
} from '../../domain/usuario-autenticacao/entities/usuario.entity.js';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const optionalQueryString = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  z.string().trim().optional(),
);

export const statusUsuarioSchema = z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']);
export const tipoUsuarioSchema = z.enum([
  'USUARIO',
  'PACIENTE',
  'ADMINISTRADOR',
]);
export const permissaoAdministrativaSchema = z.enum(
  PERMISSOES_ADMINISTRATIVAS_CONHECIDAS,
);

export const permissoesAdministrativasSchema = z
  .array(permissaoAdministrativaSchema)
  .default([])
  .refine(
    (permissoes) =>
      !permissoes.includes(PERMISSAO_ADMINISTRATIVA_TOTAL) ||
      permissoes.length === 1,
    {
      message:
        'A permissão TOTAL é exclusiva: não pode ser combinada com outras permissões.',
    },
  );

export const listUsuariosQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalQueryString,
    tipo: tipoUsuarioSchema.optional(),
    status: statusUsuarioSchema.optional(),
    permissao: permissaoAdministrativaSchema.optional(),
  })
  .strict();

const usuarioBaseSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  login: z.string().trim().min(3).max(40),
  telefone: z.string().trim().min(10).max(20),
  dataNascimento: dateSchema,
});

export const enderecoSchema = z
  .object({
    cep: z.string().trim().min(8).max(10),
    logradouro: z.string().trim().min(1).max(160),
    numero: z.string().trim().min(1).max(20),
    complemento: z.string().trim().max(80).nullable().optional().default(null),
    bairro: z.string().trim().min(1).max(100),
    cidade: z.string().trim().min(1).max(100),
    estado: z.string().trim().length(2),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
  })
  .strict();

export const createAdministradorSchema = usuarioBaseSchema
  .extend({
    permissoesAdministrativas: permissoesAdministrativasSchema,
  })
  .strict();

export const updateAdministradorSchema = usuarioBaseSchema
  .partial()
  .extend({
    status: statusUsuarioSchema.optional(),
    permissoesAdministrativas: permissoesAdministrativasSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

export const createPacienteSchema = usuarioBaseSchema
  .extend({
    senha: z.string().min(1).max(200),
    endereco: enderecoSchema,
  })
  .strict();

export const updatePacienteSchema = usuarioBaseSchema
  .partial()
  .extend({
    endereco: enderecoSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

export type ListUsuariosQuery = z.infer<typeof listUsuariosQuerySchema>;
export type CreateAdministradorRequestBody = z.infer<
  typeof createAdministradorSchema
>;
export type UpdateAdministradorRequestBody = z.infer<
  typeof updateAdministradorSchema
>;
export type CreatePacienteRequestBody = z.infer<typeof createPacienteSchema>;
export type UpdatePacienteRequestBody = z.infer<typeof updatePacienteSchema>;
