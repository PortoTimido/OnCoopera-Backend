import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorSwaggerResponseDto {
  @ApiProperty({ example: 'Mensagem de erro.' })
  message!: string;
}

export class TaxonomiaSwaggerDto {
  @ApiProperty({
    format: 'uuid',
    example: '018f5f18-1a2b-7c3d-9e4f-123456789abc',
  })
  id!: string;

  @ApiProperty({ example: 'Tratamento' })
  nome!: string;
}

export class TaxonomiaListSwaggerDto {
  @ApiProperty({ type: TaxonomiaSwaggerDto, isArray: true })
  data!: TaxonomiaSwaggerDto[];
}

export class TaxonomiaRequestSwaggerDto {
  @ApiProperty({ example: 'Tratamento' })
  nome!: string;
}

export class ArtigoSwaggerDto {
  @ApiProperty({
    format: 'uuid',
    example: '018f5f18-1a2b-7c3d-9e4f-123456789abc',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '018f5f18-1a2b-7c3d-9e4f-abcdefabcdef',
  })
  autorId!: string;

  @ApiProperty({ example: 'Como se preparar para uma consulta' })
  titulo!: string;

  @ApiProperty({
    nullable: true,
    example: 'Um breve resumo do artigo.',
  })
  resumo!: string | null;

  @ApiProperty({ example: 'Conteúdo completo do artigo.' })
  conteudo!: string;

  @ApiProperty({ example: 4 })
  tempoLeituraMinutos!: number;

  @ApiProperty({
    nullable: true,
    example: 'https://minio.example.com/oncoopera-images/...?...',
  })
  imagemUrl!: string | null;

  @ApiProperty({
    enum: ['RASCUNHO', 'PUBLICADO', 'DESATIVADO'],
    example: 'PUBLICADO',
  })
  status!: string;

  @ApiProperty({ type: TaxonomiaSwaggerDto, isArray: true })
  categorias!: TaxonomiaSwaggerDto[];

  @ApiProperty({ type: TaxonomiaSwaggerDto, isArray: true })
  tags!: TaxonomiaSwaggerDto[];

  @ApiProperty({ format: 'date-time' })
  dataCriacao!: Date;

  @ApiProperty({ format: 'date-time' })
  dataAtualizacao!: Date;

  @ApiProperty({ format: 'date-time', nullable: true })
  dataPublicacao!: Date | null;
}

export class PaginatedArtigosSwaggerDto {
  @ApiProperty({ type: ArtigoSwaggerDto, isArray: true })
  data!: ArtigoSwaggerDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class CreateArtigoSwaggerRequestDto {
  @ApiProperty({ example: 'Como se preparar para uma consulta' })
  titulo!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Um breve resumo do artigo.',
  })
  resumo?: string | null;

  @ApiProperty({ example: 'Conteúdo completo do artigo.' })
  conteudo!: string;

  @ApiProperty({ example: 4 })
  tempoLeituraMinutos!: number;

  @ApiPropertyOptional({
    enum: ['RASCUNHO', 'PUBLICADO', 'DESATIVADO'],
    example: 'RASCUNHO',
  })
  status?: string;

  @ApiProperty({
    format: 'uuid',
    isArray: true,
    example: ['018f5f18-1a2b-7c3d-9e4f-123456789abc'],
  })
  categoriaIds!: string[];

  @ApiPropertyOptional({
    format: 'uuid',
    isArray: true,
    example: ['018f5f18-1a2b-7c3d-9e4f-abcdefabcdef'],
  })
  tagIds?: string[];
}

export class UpdateArtigoSwaggerRequestDto {
  @ApiPropertyOptional({ example: 'Como se preparar para uma consulta' })
  titulo?: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Um breve resumo do artigo.',
  })
  resumo?: string | null;

  @ApiPropertyOptional({ example: 'Conteúdo completo do artigo.' })
  conteudo?: string;

  @ApiPropertyOptional({ example: 4 })
  tempoLeituraMinutos?: number;

  @ApiPropertyOptional({
    enum: ['RASCUNHO', 'PUBLICADO', 'DESATIVADO'],
    example: 'PUBLICADO',
  })
  status?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    isArray: true,
    example: ['018f5f18-1a2b-7c3d-9e4f-123456789abc'],
  })
  categoriaIds?: string[];

  @ApiPropertyOptional({
    format: 'uuid',
    isArray: true,
    example: ['018f5f18-1a2b-7c3d-9e4f-abcdefabcdef'],
  })
  tagIds?: string[];
}
