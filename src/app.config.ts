import { z } from 'zod';

const booleanFromEnv = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const environmentSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().int().positive().default(3000),
    MINIO_ENDPOINT: z.string().trim().min(1),
    MINIO_PORT: z.coerce.number().int().min(1).max(65535),
    MINIO_USE_SSL: booleanFromEnv,
    MINIO_ACCESS_KEY: z.string().min(1),
    MINIO_SECRET_KEY: z.string().min(1),
    MINIO_BUCKET: z.string().trim().min(3).max(63),
    MINIO_URL_EXPIRATION_SECONDS: z.coerce.number().int().positive(),
    IMAGE_MAX_SIZE_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024),
  })
  .passthrough();

export function validateEnvironment(config: Record<string, unknown>) {
  const parsed = environmentSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `ConfiguraÃ§Ã£o de ambiente invÃ¡lida: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
