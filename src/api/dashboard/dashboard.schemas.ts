import { z } from 'zod';

export const monthlyGrowthQuerySchema = z
  .object({
    periodMonths: z
      .enum(['6', '12'])
      .transform((value) => Number(value) as 6 | 12),
  })
  .strict();

export type MonthlyGrowthQuery = z.infer<typeof monthlyGrowthQuerySchema>;
