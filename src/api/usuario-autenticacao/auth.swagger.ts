import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginSwaggerRequestDto {
  @ApiProperty({
    description: 'Email ou login do usuário.',
    example: 'usuario.teste',
  })
  identificador!: string;

  @ApiProperty({
    description: 'Senha em texto puro enviada somente para autenticação.',
    example: 'SenhaAtual!123',
    writeOnly: true,
  })
  senha!: string;
}

export class ChangePasswordSwaggerRequestDto {
  @ApiProperty({
    description: 'Senha atual do usuário autenticado.',
    example: 'SenhaAtual!123',
    writeOnly: true,
  })
  senhaAtual!: string;

  @ApiProperty({
    description:
      'Nova senha com 6 a 72 bytes, contendo maiúscula, minúscula, número e símbolo.',
    example: 'SenhaNova!1234',
    writeOnly: true,
  })
  novaSenha!: string;
}

export class ChangeTemporaryPasswordSwaggerRequestDto {
  @ApiProperty({
    description: 'Email ou login do usuário com senha temporária.',
    example: 'admin.novo',
  })
  identificador!: string;

  @ApiProperty({
    description: 'Senha temporária recebida no cadastro de backoffice.',
    example: 'A7!kP2vQ9#mN4xRz',
    writeOnly: true,
  })
  senhaTemporaria!: string;

  @ApiProperty({
    description:
      'Nova senha com 6 a 72 bytes, contendo maiúscula, minúscula, número e símbolo.',
    example: 'SenhaDefinitiva!123',
    writeOnly: true,
  })
  novaSenha!: string;
}

export class PasswordRecoveryRequestSwaggerDto {
  @ApiProperty({ format: 'email', example: 'usuario@example.com' })
  email!: string;
}

export class PasswordRecoveryVerifySwaggerDto {
  @ApiProperty({ format: 'email', example: 'usuario@example.com' })
  email!: string;
  @ApiProperty({ example: '483921' })
  code!: string;
}

export class PasswordRecoveryResetSwaggerDto {
  @ApiProperty({ writeOnly: true })
  resetToken!: string;
  @ApiProperty({ writeOnly: true, example: 'SenhaNova!123' })
  newPassword!: string;
  @ApiProperty({ writeOnly: true, example: 'SenhaNova!123' })
  passwordConfirmation!: string;
}

export class UpdateOwnProfileSwaggerRequestDto {
  @ApiPropertyOptional({
    description: 'Novo nome completo do usuário autenticado.',
    example: 'Ana Silva',
  })
  nome?: string;

  @ApiPropertyOptional({
    description: 'Novo email do usuário autenticado.',
    example: 'ana.silva@example.com',
    format: 'email',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Novo telefone do usuário autenticado.',
    example: '11999998888',
  })
  telefone?: string;

  @ApiPropertyOptional({
    description: 'Nova data de nascimento do usuário autenticado.',
    example: '1990-05-20',
    format: 'date',
  })
  dataNascimento?: string;
}

export class AuthenticatedUserSwaggerDto {
  @ApiProperty({
    description: 'Identificador UUID do usuário.',
    example: '018f5f18-1a2b-7c3d-9e4f-123456789abc',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome sanitizado do usuário.',
    example: 'Usuário Teste',
  })
  nome!: string;

  @ApiProperty({
    description: 'Email normalizado do usuário.',
    example: 'user@example.com',
    format: 'email',
  })
  email!: string;

  @ApiProperty({
    description: 'Login do usuário.',
    example: 'usuario.teste',
  })
  login!: string;

  @ApiProperty({
    description: 'Telefone normalizado apenas com dígitos.',
    example: '11999998888',
  })
  telefone!: string;

  @ApiProperty({
    description: 'Data de nascimento do usuário.',
    example: '1990-05-20',
    format: 'date',
  })
  dataNascimento!: string;

  @ApiProperty({
    description: 'Status atual do usuário.',
    enum: ['ATIVO', 'INATIVO', 'BLOQUEADO'],
    example: 'ATIVO',
  })
  status!: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';

  @ApiProperty({
    description: 'Tipo derivado dos vínculos de identidade do usuário.',
    enum: ['USUARIO', 'PACIENTE', 'ADMINISTRADOR'],
    example: 'ADMINISTRADOR',
  })
  tipo!: 'USUARIO' | 'PACIENTE' | 'ADMINISTRADOR';

  @ApiProperty({
    description:
      'Permissões administrativas do usuário. TOTAL concede acesso irrestrito.',
    enum: [
      'TOTAL',
      'GERENCIAR_USUARIOS',
      'GESTAO_CONTEUDOS',
      'GESTAO_RADAR_APOIO',
    ],
    example: ['TOTAL'],
    isArray: true,
  })
  permissoesAdministrativas!: string[];

  @ApiPropertyOptional({
    description:
      'Campo legado mantido apenas para compatibilidade de resposta durante a transição do modelo de perfis; não é utilizado para autorização e sempre espelha permissoesAdministrativas.',
    example: ['TOTAL'],
    isArray: true,
    type: String,
    deprecated: true,
  })
  perfisAdministrativos?: string[];

  @ApiProperty({
    description: 'Indica se o usuário deve trocar senha antes de autenticar.',
    example: false,
  })
  trocaSenhaObrigatoria!: boolean;

  @ApiProperty({
    description: 'Data e hora do último acesso, quando existir.',
    example: '2026-08-25T22:30:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  ultimoAcesso!: string | null;
}

export class AuthSwaggerResponseDto {
  @ApiProperty({
    description: 'Access token JWT HS256 com expiração curta.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Usuário autenticado sem dados sensíveis.',
    type: AuthenticatedUserSwaggerDto,
  })
  usuario!: AuthenticatedUserSwaggerDto;
}

export class ErrorSwaggerResponseDto {
  @ApiProperty({
    description: 'Código HTTP retornado.',
    example: 401,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Mensagem sanitizada de erro.',
    example: 'Credenciais inválidas.',
  })
  message!: string;

  @ApiProperty({
    description: 'Descrição curta do erro HTTP.',
    example: 'Unauthorized',
    required: false,
  })
  error?: string;
}
