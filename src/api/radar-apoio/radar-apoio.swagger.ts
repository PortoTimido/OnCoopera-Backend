import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorSwaggerResponseDto {
  @ApiProperty({ example: 'Mensagem de erro.' })
  message!: string;
}

export class EnderecoApoioSwaggerDto {
  @ApiPropertyOptional({ format: 'uuid' })
  id?: string;

  @ApiProperty({ example: '01310-100' })
  cep!: string;

  @ApiProperty({ example: 'Avenida Paulista' })
  logradouro!: string;

  @ApiProperty({ example: '1000' })
  numero!: string;

  @ApiProperty({ nullable: true, example: 'Conjunto 12' })
  complemento!: string | null;

  @ApiProperty({ example: 'Bela Vista' })
  bairro!: string;

  @ApiProperty({ example: 'São Paulo' })
  cidade!: string;

  @ApiProperty({ example: 'SP' })
  estado!: string;

  @ApiProperty({ example: -23.563099 })
  latitude!: number;

  @ApiProperty({ example: -46.654293 })
  longitude!: number;
}

export class HorarioApoioSwaggerDto {
  @ApiProperty({ example: 1, description: '0=domingo, 6=sábado.' })
  diaSemana!: number;

  @ApiProperty({ example: '08:00' })
  horarioInicio!: string;

  @ApiProperty({ example: '18:00' })
  horarioFim!: string;
}

export class ApoioSwaggerDto {
  @ApiProperty({
    format: 'uuid',
    example: '018f5f18-1a2b-7c3d-9e4f-123456789abc',
  })
  id!: string;

  @ApiProperty({ example: 'Casa de Apoio Esperança' })
  nome!: string;

  @ApiProperty({
    enum: ['ONG', 'CLINICA', 'TRANSPORTE', 'CASA_APOIO', 'PSICOLOGO'],
    example: 'CASA_APOIO',
  })
  tipoApoio!: string;

  @ApiProperty({ example: '+55 11 99999-9999' })
  telefone!: string;

  @ApiProperty({ example: 'Atendimento e acolhimento para pacientes.' })
  descricao!: string;

  @ApiProperty({
    enum: ['RASCUNHO', 'ATIVO', 'DESATIVADO'],
    example: 'ATIVO',
  })
  status!: string;

  @ApiProperty({ type: EnderecoApoioSwaggerDto })
  endereco!: EnderecoApoioSwaggerDto;

  @ApiProperty({ type: HorarioApoioSwaggerDto, isArray: true })
  horarios!: HorarioApoioSwaggerDto[];

  @ApiProperty({
    isArray: true,
    example: ['https://cdn.example.com/apoios/casa-esperanca.jpg'],
  })
  imagensUrl!: string[];

  @ApiProperty({ format: 'date-time' })
  dataCriacao!: Date;

  @ApiProperty({ format: 'date-time' })
  dataAtualizacao!: Date;

  @ApiProperty({ example: true })
  estaAbertoAgora!: boolean;

  @ApiPropertyOptional({ example: 3.4 })
  distanciaKm?: number;
}

export class PaginatedApoiosSwaggerDto {
  @ApiProperty({ type: ApoioSwaggerDto, isArray: true })
  data!: ApoioSwaggerDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class CreateApoioSwaggerRequestDto {
  @ApiProperty({ example: 'Casa de Apoio Esperança' })
  nome!: string;

  @ApiProperty({
    enum: ['ONG', 'CLINICA', 'TRANSPORTE', 'CASA_APOIO', 'PSICOLOGO'],
    example: 'CASA_APOIO',
  })
  tipoApoio!: string;

  @ApiProperty({ example: '+55 11 99999-9999' })
  telefone!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Atendimento e acolhimento para pacientes.',
  })
  descricao?: string | null;

  @ApiPropertyOptional({
    enum: ['RASCUNHO', 'ATIVO', 'DESATIVADO'],
    example: 'RASCUNHO',
  })
  status?: string;

  @ApiProperty({ type: EnderecoApoioSwaggerDto })
  endereco!: EnderecoApoioSwaggerDto;

  @ApiProperty({ type: HorarioApoioSwaggerDto, isArray: true })
  horarios!: HorarioApoioSwaggerDto[];

  @ApiPropertyOptional({
    isArray: true,
    example: ['https://cdn.example.com/apoios/casa-esperanca.jpg'],
  })
  imagensUrl?: string[];
}

export class UpdateApoioSwaggerRequestDto {
  @ApiPropertyOptional({ example: 'Casa de Apoio Esperança' })
  nome?: string;

  @ApiPropertyOptional({
    enum: ['ONG', 'CLINICA', 'TRANSPORTE', 'CASA_APOIO', 'PSICOLOGO'],
    example: 'PSICOLOGO',
  })
  tipoApoio?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  telefone?: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Atendimento e acolhimento para pacientes.',
  })
  descricao?: string | null;

  @ApiPropertyOptional({
    enum: ['RASCUNHO', 'ATIVO', 'DESATIVADO'],
    example: 'ATIVO',
  })
  status?: string;

  @ApiPropertyOptional({ type: EnderecoApoioSwaggerDto })
  endereco?: EnderecoApoioSwaggerDto;

  @ApiPropertyOptional({ type: HorarioApoioSwaggerDto, isArray: true })
  horarios?: HorarioApoioSwaggerDto[];

  @ApiPropertyOptional({
    isArray: true,
    example: ['https://cdn.example.com/apoios/casa-esperanca.jpg'],
  })
  imagensUrl?: string[];
}
