import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CreateDocumentoLegalUseCase,
  GetDocumentoLegalUseCase,
  UpdateDocumentoLegalUseCase,
} from '../../application/documento-legal/use-cases/documento-legal.use-cases.js';
import type { TipoDocumentoLegal } from '../../domain/documento-legal/documento-legal.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { JwtAuthGuard } from '../usuario-autenticacao/jwt-auth.guard.js';
import { RequirePermissaoAdministrativa } from '../usuario-autenticacao/permissao-administrativa.decorator.js';
import { PermissaoAdministrativaGuard } from '../usuario-autenticacao/permissao-administrativa.guard.js';
import { mapDocumentoLegalError } from './documento-legal-error.mapper.js';
import {
  createDocumentoLegalSchema,
  tipoDocumentoLegalSchema,
  updateDocumentoLegalSchema,
  type CreateDocumentoLegalRequestBody,
  type UpdateDocumentoLegalRequestBody,
} from './documento-legal.schemas.js';
import {
  CreateDocumentoLegalSwaggerRequestDto,
  DocumentoLegalSwaggerDto,
  ErrorSwaggerResponseDto,
  UpdateDocumentoLegalSwaggerRequestDto,
} from './documento-legal.swagger.js';

@ApiTags('Backoffice - Documentos legais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissaoAdministrativaGuard)
@RequirePermissaoAdministrativa('TOTAL')
@Controller('backoffice/documentos-legais')
export class BackofficeDocumentosLegaisController {
  constructor(
    private readonly getDocumento: GetDocumentoLegalUseCase,
    private readonly createDocumento: CreateDocumentoLegalUseCase,
    private readonly updateDocumento: UpdateDocumentoLegalUseCase,
  ) {}

  @Get(':tipo')
  @ApiOperation({ summary: 'Consultar documento legal por tipo' })
  @ApiOkResponse({ type: DocumentoLegalSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async getByTipo(
    @Param('tipo', new ZodValidationPipe(tipoDocumentoLegalSchema))
    tipo: TipoDocumentoLegal,
  ) {
    try {
      return await this.getDocumento.execute(tipo);
    } catch (error) {
      throw mapDocumentoLegalError(error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Criar documento legal' })
  @ApiCreatedResponse({ type: DocumentoLegalSwaggerDto })
  @ApiBody({ type: CreateDocumentoLegalSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async create(
    @Body(new ZodValidationPipe(createDocumentoLegalSchema))
    body: CreateDocumentoLegalRequestBody,
  ) {
    try {
      return await this.createDocumento.execute(body);
    } catch (error) {
      throw mapDocumentoLegalError(error);
    }
  }

  @Put(':tipo')
  @ApiOperation({ summary: 'Atualizar conteúdo de documento legal' })
  @ApiOkResponse({ type: DocumentoLegalSwaggerDto })
  @ApiBody({ type: UpdateDocumentoLegalSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async update(
    @Param('tipo', new ZodValidationPipe(tipoDocumentoLegalSchema))
    tipo: TipoDocumentoLegal,
    @Body(new ZodValidationPipe(updateDocumentoLegalSchema))
    body: UpdateDocumentoLegalRequestBody,
  ) {
    try {
      return await this.updateDocumento.execute({ tipo, ...body });
    } catch (error) {
      throw mapDocumentoLegalError(error);
    }
  }
}
