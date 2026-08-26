import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe<TInput, TOutput> implements PipeTransform<
  TInput,
  TOutput
> {
  private readonly schema: ZodType<TOutput, TInput>;

  constructor(schema: ZodType<TOutput, TInput>) {
    this.schema = schema;
  }

  transform(value: TInput): TOutput {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Payload inválido.',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}
