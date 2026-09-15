import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthenticatedUserSwaggerDto } from './auth.swagger.js';

export class EnderecoSwaggerDto {
  @ApiProperty({
    format: 'uuid',
    example: '018f5f18-1a2b-7c3d-9e4f-123456789abc',
  })
  id!: string;

  @ApiProperty({ example: '01310930' })
  cep!: string;

  @ApiProperty({ example: 'Avenida Paulista' })
  logradouro!: string;

  @ApiProperty({ example: '1000' })
  numero!: string;

  @ApiProperty({ nullable: true, example: 'Conjunto 101' })
  complemento!: string | null;

  @ApiProperty({ example: 'Bela Vista' })
  bairro!: string;

  @ApiProperty({ example: 'São Paulo' })
  cidade!: string;

  @ApiProperty({ example: 'SP' })
  estado!: string;

  @ApiProperty({ example: -23.561684 })
  latitude!: number;

  @ApiProperty({ example: -46.655981 })
  longitude!: number;
}

export class EnderecoRequestSwaggerDto {
  @ApiProperty({ example: '01310-930' })
  cep!: string;

  @ApiProperty({ example: 'Avenida Paulista' })
  logradouro!: string;

  @ApiProperty({ example: '1000' })
  numero!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Conjunto 101' })
  complemento?: string | null;

  @ApiProperty({ example: 'Bela Vista' })
  bairro!: string;

  @ApiProperty({ example: 'São Paulo' })
  cidade!: string;

  @ApiProperty({ example: 'SP' })
  estado!: string;

  @ApiProperty({ example: -23.561684 })
  latitude!: number;

  @ApiProperty({ example: -46.655981 })
  longitude!: number;
}

export class UsuarioDetailsSwaggerDto {
  @ApiProperty({ type: AuthenticatedUserSwaggerDto })
  usuario!: AuthenticatedUserSwaggerDto;

  @ApiProperty({ type: EnderecoSwaggerDto, nullable: true })
  endereco!: EnderecoSwaggerDto | null;
}

export class PaginatedUsuariosSwaggerDto {
  @ApiProperty({ type: AuthenticatedUserSwaggerDto, isArray: true })
  data!: AuthenticatedUserSwaggerDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class CreateAdministradorSwaggerRequestDto {
  @ApiProperty({ example: 'Administrador Novo' })
  nome!: string;

  @ApiProperty({ format: 'email', example: 'admin.novo@example.com' })
  email!: string;

  @ApiProperty({ example: 'admin.novo' })
  login!: string;

  @ApiProperty({ example: '11999998888' })
  telefone!: string;

  @ApiProperty({ format: 'date', example: '1990-05-20' })
  dataNascimento!: string;

  @ApiPropertyOptional({
    description:
      'Permissões administrativas do novo usuário. TOTAL é exclusiva e concede acesso irrestrito. Padrão: [].',
    enum: [
      'TOTAL',
      'GERENCIAR_USUARIOS',
      'GESTAO_CONTEUDOS',
      'GESTAO_RADAR_APOIO',
    ],
    isArray: true,
    example: ['TOTAL'],
  })
  permissoesAdministrativas?: string[];
}

export class UpdateAdministradorSwaggerRequestDto {
  @ApiPropertyOptional({ example: 'Administrador Atualizado' })
  nome?: string;

  @ApiPropertyOptional({
    format: 'email',
    example: 'admin.atualizado@example.com',
  })
  email?: string;

  @ApiPropertyOptional({ example: 'admin.atualizado' })
  login?: string;

  @ApiPropertyOptional({ example: '11999998888' })
  telefone?: string;

  @ApiPropertyOptional({ format: 'date', example: '1990-05-20' })
  dataNascimento?: string;

  @ApiPropertyOptional({
    enum: ['ATIVO', 'INATIVO', 'BLOQUEADO'],
    example: 'ATIVO',
  })
  status?: string;

  @ApiPropertyOptional({
    description:
      'Permissões administrativas do usuário. TOTAL é exclusiva e concede acesso irrestrito.',
    enum: [
      'TOTAL',
      'GERENCIAR_USUARIOS',
      'GESTAO_CONTEUDOS',
      'GESTAO_RADAR_APOIO',
    ],
    isArray: true,
    example: ['GESTAO_CONTEUDOS'],
  })
  permissoesAdministrativas?: string[];
}

export class CreateAdministradorSwaggerResponseDto extends UsuarioDetailsSwaggerDto {
  @ApiProperty({
    description: 'Senha temporária retornada somente nesta resposta.',
    example: 'A7!kP2vQ9#mN4xRz',
  })
  senhaTemporaria!: string;
}

export class CreatePacienteSwaggerRequestDto {
  @ApiProperty({ example: 'Paciente Novo' })
  nome!: string;

  @ApiProperty({ format: 'email', example: 'paciente@example.com' })
  email!: string;

  @ApiProperty({ example: 'paciente.novo' })
  login!: string;

  @ApiProperty({ example: '11999998888' })
  telefone!: string;

  @ApiProperty({ format: 'date', example: '1990-05-20' })
  dataNascimento!: string;

  @ApiProperty({
    description:
      'Senha com 6 a 72 bytes, contendo maiúscula, minúscula, número e símbolo.',
    example: 'SenhaPaciente!123',
    writeOnly: true,
  })
  senha!: string;

  @ApiProperty({ type: EnderecoRequestSwaggerDto })
  endereco!: EnderecoRequestSwaggerDto;
}

export class UpdatePacienteSwaggerRequestDto {
  @ApiPropertyOptional({ example: 'Paciente Atualizado' })
  nome?: string;

  @ApiPropertyOptional({ format: 'email', example: 'paciente@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'paciente.novo' })
  login?: string;

  @ApiPropertyOptional({ example: '11999998888' })
  telefone?: string;

  @ApiPropertyOptional({ format: 'date', example: '1990-05-20' })
  dataNascimento?: string;

  @ApiPropertyOptional({ type: EnderecoRequestSwaggerDto })
  endereco?: EnderecoRequestSwaggerDto;
}
