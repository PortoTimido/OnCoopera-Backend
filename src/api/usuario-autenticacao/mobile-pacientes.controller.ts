import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreatePacienteUseCase } from '../../application/usuario-autenticacao/use-cases/create-paciente.use-case.js';
import { GetUsuarioDetailsUseCase } from '../../application/usuario-autenticacao/use-cases/get-usuario-details.use-case.js';
import { InactivatePacienteUseCase } from '../../application/usuario-autenticacao/use-cases/inactivate-paciente.use-case.js';
import { UpdatePacienteUseCase } from '../../application/usuario-autenticacao/use-cases/update-paciente.use-case.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { mapAuthError } from './auth-error.mapper.js';
import type {
  AuthenticatedRequest,
  AuthenticatedRequestContext,
} from './auth.request.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import {
  createPacienteSchema,
  updatePacienteSchema,
  type CreatePacienteRequestBody,
  type UpdatePacienteRequestBody,
} from './user-crud.schemas.js';
import {
  CreatePacienteSwaggerRequestDto,
  UpdatePacienteSwaggerRequestDto,
  UsuarioDetailsSwaggerDto,
} from './user-crud.swagger.js';
import { ErrorSwaggerResponseDto } from './auth.swagger.js';

@ApiTags('Mobile - Pacientes')
@Controller('mobile/pacientes')
export class MobilePacientesController {
  constructor(
    private readonly createPaciente: CreatePacienteUseCase,
    private readonly getUsuarioDetails: GetUsuarioDetailsUseCase,
    private readonly updatePaciente: UpdatePacienteUseCase,
    private readonly inactivatePaciente: InactivatePacienteUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastrar paciente pelo aplicativo',
    description:
      'Cria usuário, endereço e paciente sem perfis administrativos.',
  })
  @ApiCreatedResponse({
    description: 'Paciente cadastrado.',
    type: UsuarioDetailsSwaggerDto,
  })
  @ApiBody({ type: CreatePacienteSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async create(
    @Body(new ZodValidationPipe(createPacienteSchema))
    body: CreatePacienteRequestBody,
  ) {
    try {
      return await this.createPaciente.execute(body);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consultar cadastro do paciente autenticado',
    description: 'Retorna os dados sanitizados do próprio paciente.',
  })
  @ApiOkResponse({ type: UsuarioDetailsSwaggerDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async me(@Req() request: AuthenticatedRequest) {
    try {
      const auth = requirePacienteContext(request);
      return await this.getUsuarioDetails.execute(auth.usuarioId);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar cadastro do paciente autenticado',
    description:
      'Permite ao paciente atualizar dados cadastrais e endereço próprios.',
  })
  @ApiOkResponse({ type: UsuarioDetailsSwaggerDto })
  @ApiBody({ type: UpdatePacienteSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async updateMe(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(updatePacienteSchema))
    body: UpdatePacienteRequestBody,
  ) {
    try {
      const auth = requirePacienteContext(request);
      return await this.updatePaciente.execute(auth.usuarioId, body);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Delete('me')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Inativar própria conta de paciente',
    description: 'Inativa o usuário paciente autenticado e revoga sessões.',
  })
  @ApiNoContentResponse({ description: 'Conta inativada.' })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async deleteMe(@Req() request: AuthenticatedRequest): Promise<void> {
    try {
      const auth = requirePacienteContext(request);
      await this.inactivatePaciente.execute(auth.usuarioId);
    } catch (error) {
      throw mapAuthError(error);
    }
  }
}

function requirePacienteContext(
  request: AuthenticatedRequest,
): AuthenticatedRequestContext {
  if (request.auth === undefined) {
    throw new UnauthorizedException('Usuário não autenticado.');
  }

  if (request.auth.tipo !== 'PACIENTE') {
    throw new ForbiddenException('Acesso permitido apenas para pacientes.');
  }

  return request.auth;
}
