import { z } from 'zod';
import { dateSchema } from './user-crud.schemas.js';

export const loginSchema = z
  .object({
    identificador: z.string().trim().min(3).max(254),
    senha: z.string().min(1).max(200),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1).max(200),
    novaSenha: z.string().min(1).max(200),
  })
  .strict();

export const changeTemporaryPasswordSchema = z
  .object({
    identificador: z.string().trim().min(3).max(254),
    senhaTemporaria: z.string().min(1).max(200),
    novaSenha: z.string().min(1).max(200),
  })
  .strict();

export const passwordRecoveryRequestSchema = z
  .object({ email: z.string().trim().email().max(254) })
  .strict();
export const passwordRecoveryVerifySchema = z
  .object({
    email: z.string().trim().email().max(254),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();
export const passwordRecoveryResetSchema = z
  .object({
    resetToken: z.string().min(20).max(200),
    newPassword: z.string().min(1).max(200),
    passwordConfirmation: z.string().min(1).max(200),
  })
  .strict()
  .refine((value) => value.newPassword === value.passwordConfirmation, {
    message: 'A confirmação da senha não confere.',
    path: ['passwordConfirmation'],
  });

export const updateOwnProfileSchema = z
  .object({
    nome: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().max(254).optional(),
    telefone: z.string().trim().min(10).max(20).optional(),
    dataNascimento: dateSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualização.',
  });

export type LoginRequestBody = z.infer<typeof loginSchema>;
export type ChangePasswordRequestBody = z.infer<typeof changePasswordSchema>;
export type ChangeTemporaryPasswordRequestBody = z.infer<
  typeof changeTemporaryPasswordSchema
>;
export type PasswordRecoveryRequestBody = z.infer<
  typeof passwordRecoveryRequestSchema
>;
export type PasswordRecoveryVerifyBody = z.infer<
  typeof passwordRecoveryVerifySchema
>;
export type PasswordRecoveryResetBody = z.infer<
  typeof passwordRecoveryResetSchema
>;
export type UpdateOwnProfileRequestBody = z.infer<
  typeof updateOwnProfileSchema
>;
