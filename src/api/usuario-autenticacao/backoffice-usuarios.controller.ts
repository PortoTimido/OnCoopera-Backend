import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CreateAdministradorUseCase } from '../../application/usuario-autenticacao/use-cases/create-administrador.use-case.js';
import { GetUsuarioDetailsUseCase } from '../../application/usuario-autenticacao/use-cases/get-usuario-details.use-case.js';
import { InactivateAdministradorUseCase } from '../../application/usuario-autenticacao/use-cases/inactivate-administrador.use-case.js';
import { InactivatePacienteUseCase } from '../../application/usuario-autenticacao/use-cases/inactivate-paciente.use-case.js';
import { ListUsuariosUseCase } from '../../application/usuario-autenticacao/use-cases/list-usuarios.use-case.js';
import { UpdateAdministradorUseCase } from '../../application/usuario-autenticacao/use-cases/update-administrador.use-case.js';
import { UpdatePacienteUseCase } from '../../application/usuario-autenticacao/use-cases/update-paciente.use-case.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { RequirePermissaoAdministrativa } from './permissao-administrativa.decorator.js';
import { PermissaoAdministrativaGuard } from './permissao-administrativa.guard.js';
import { mapAuthError } from './auth-error.mapper.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import {
  createAdministradorSchema,
  listUsuariosQuerySchema,
  updateAdministradorSchema,
  updatePacienteSchema,
  type CreateAdministradorRequestBody,
  type ListUsuariosQuery,
  type UpdateAdministradorRequestBody,
  type UpdatePacienteRequestBody,
} from './user-crud.schemas.js';
import {
  CreateAdministradorSwaggerRequestDto,
  CreateAdministradorSwaggerResponseDto,
  PaginatedUsuariosSwaggerDto,
  UpdateAdministradorSwaggerRequestDto,
  UpdatePacienteSwaggerRequestDto,
  UsuarioDetailsSwaggerDto,
} from './user-crud.swagger.js';
import { ErrorSwaggerResponseDto } from './auth.swagger.js';

@ApiTags('Backoffice - Usuários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissaoAdministrativaGuard)
@RequirePermissaoAdministrativa('GERENCIAR_USUARIOS')
@Controller('backoffice')
export class BackofficeUsuariosController {
  constructor(
    private readonly listUsuarios: ListUsuariosUseCase,
    private readonly getUsuarioDetails: GetUsuarioDetailsUseCase,
    private readonly createAdministrador: CreateAdministradorUseCase,
    private readonly updateAdministrador: UpdateAdministradorUseCase,
    private readonly inactivateAdministrador: InactivateAdministradorUseCase,
    private readonly updatePaciente: UpdatePacienteUseCase,
    private readonly inactivatePaciente: InactivatePacienteUseCase,
  ) {}

  @Get('usuarios')
  @ApiOperation({
    summary: 'Listar usuários',
    description:
      'Lista usuários do sistema para o backoffice, com filtros e payload sanitizado.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'maria' })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: ['USUARIO', 'PACIENTE', 'ADMINISTRADOR'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ATIVO', 'INATIVO', 'BLOQUEADO'],
  })
  @ApiQuery({
    name: 'permissao',
    required: false,
    enum: [
      'TOTAL',
      'GERENCIAR_USUARIOS',
      'GESTAO_CONTEUDOS',
      'GESTAO_RADAR_APOIO',
    ],
  })
  @ApiOkResponse({
    description: 'Lista paginada de usuários.',
    type: PaginatedUsuariosSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  async list(
    @Query(new ZodValidationPipe(listUsuariosQuerySchema))
    query: ListUsuariosQuery,
  ) {
    return this.listUsuarios.execute(query);
  }

  @Get('usuarios/:id')
  @ApiOperation({
    summary: 'Consultar usuário por ID',
    description:
      'Retorna usuário sanitizado com dados específicos de administrador ou paciente.',
  })
  @ApiOkResponse({
    description: 'Usuário encontrado.',
    type: UsuarioDetailsSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    try {
      return await this.getUsuarioDetails.execute(id);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Post('administradores')
  @ApiOperation({
    summary: 'Criar administrador',
    description:
      'Cria usuário administrador pelo backoffice, associa permissões administrativas e retorna senha temporária uma única vez.',
  })
  @ApiCreatedResponse({
    description: 'Administrador criado com senha temporária.',
    type: CreateAdministradorSwaggerResponseDto,
  })
  @ApiBody({ type: CreateAdministradorSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async createAdmin(
    @Body(new ZodValidationPipe(createAdministradorSchema))
    body: CreateAdministradorRequestBody,
  ) {
    try {
      return await this.createAdministrador.execute(body);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Patch('administradores/:id')
  @ApiOperation({
    summary: 'Atualizar administrador',
    description:
      'Atualiza dados cadastrais, status e permissões administrativas, preservando ao menos um administrador ativo com TOTAL.',
  })
  @ApiOkResponse({
    description: 'Administrador atualizado.',
    type: UsuarioDetailsSwaggerDto,
  })
  @ApiBody({ type: UpdateAdministradorSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async updateAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateAdministradorSchema))
    body: UpdateAdministradorRequestBody,
  ) {
    try {
      return await this.updateAdministrador.execute(id, body);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Delete('administradores/:id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Inativar administrador',
    description:
      'Inativa o administrador, revoga sessões e bloqueia a operação se ele for o último TOTAL ativo.',
  })
  @ApiNoContentResponse({ description: 'Administrador inativado.' })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async deleteAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    try {
      await this.inactivateAdministrador.execute(id);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Patch('pacientes/:id')
  @ApiOperation({
    summary: 'Atualizar paciente pelo backoffice',
    description: 'Atualiza dados cadastrais e endereço do paciente.',
  })
  @ApiOkResponse({
    description: 'Paciente atualizado.',
    type: UsuarioDetailsSwaggerDto,
  })
  @ApiBody({ type: UpdatePacienteSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async updatePatient(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updatePacienteSchema))
    body: UpdatePacienteRequestBody,
  ) {
    try {
      return await this.updatePaciente.execute(id, body);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Delete('pacientes/:id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Inativar paciente pelo backoffice',
    description: 'Inativa o usuário paciente e revoga suas sessões.',
  })
  @ApiNoContentResponse({ description: 'Paciente inativado.' })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async deletePatient(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    try {
      await this.inactivatePaciente.execute(id);
    } catch (error) {
      throw mapAuthError(error);
    }
  }
}
