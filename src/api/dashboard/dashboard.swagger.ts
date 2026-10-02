import { ApiProperty } from '@nestjs/swagger';

export class MonthlyGrowthPointSwaggerDto {
  @ApiProperty({ example: '2026-04', pattern: '^\\d{4}-\\d{2}$' })
  month!: string;

  @ApiProperty({ example: 24, nullable: true })
  articlesPublished!: number | null;

  @ApiProperty({ example: 43, nullable: true })
  supportLocations!: number | null;

  @ApiProperty({ example: 1247, nullable: true })
  activeUsers!: number | null;
}

export class MonthlyGrowthSwaggerDto {
  @ApiProperty({ type: MonthlyGrowthPointSwaggerDto, isArray: true })
  points!: MonthlyGrowthPointSwaggerDto[];
}
