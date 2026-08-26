import { z } from 'zod';

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

export type LoginRequestBody = z.infer<typeof loginSchema>;
export type ChangePasswordRequestBody = z.infer<typeof changePasswordSchema>;
export type ChangeTemporaryPasswordRequestBody = z.infer<
  typeof changeTemporaryPasswordSchema
>;
