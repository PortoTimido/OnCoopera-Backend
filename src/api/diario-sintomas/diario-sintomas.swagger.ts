import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SintomaDiarioSwaggerDto {
  @ApiProperty({
    enum: [
      'NAUSEA',
      'FATIGA',
      'DOR',
      'TONTURA',
      'FEBRE',
      'SONO',
      'APETITE',
      'OUTRO',
    ],
  })
  tipo!: string;
  @ApiProperty({ minimum: 0, maximum: 10 }) intensidade!: number;
  @ApiPropertyOptional({ nullable: true, maxLength: 120 }) descricaoOutro?:
    string | null;
}
export class RegistroDiarioSwaggerDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'date' }) dataRegistro!: string;
  @ApiProperty({ format: 'date-time' }) dataHora!: string;
  @ApiProperty({ enum: ['MUITO_BEM', 'BEM', 'NEUTRO', 'MAL', 'MUITO_MAL'] })
  humor!: string;
  @ApiProperty({ type: SintomaDiarioSwaggerDto, isArray: true })
  sintomas!: SintomaDiarioSwaggerDto[];
  @ApiPropertyOptional({ nullable: true }) notaVozUrl?: string | null;
}
export class PaginatedRegistrosDiariosSwaggerDto {
  @ApiProperty({ type: RegistroDiarioSwaggerDto, isArray: true })
  data!: RegistroDiarioSwaggerDto[];
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}
export class ErrorSwaggerResponseDto {
  @ApiProperty() message!: string;
}
