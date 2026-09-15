import {
  Body,
  BadRequestException,
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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import {
  CreateApoioUseCase,
  DeactivateApoioUseCase,
  GetApoioUseCase,
  ListApoiosUseCase,
  UpdateApoioUseCase,
} from '../../application/radar-apoio/use-cases/apoio.use-cases.js';
import {
  DeleteApoioImagemUseCase,
  ReplaceApoioImagemUseCase,
  UploadApoioImagemUseCase,
} from '../../application/radar-apoio/use-cases/manage-apoio-imagem.use-cases.js';
import type { UploadableImage } from '../../application/armazenamento-imagem/image-storage.port.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { JwtAuthGuard } from '../usuario-autenticacao/jwt-auth.guard.js';
import { PermissaoAdministrativaGuard } from '../usuario-autenticacao/permissao-administrativa.guard.js';
import { RequirePermissaoAdministrativa } from '../usuario-autenticacao/permissao-administrativa.decorator.js';
import { mapApoioError } from './radar-apoio-error.mapper.js';
import {
  createApoioSchema,
  listApoiosQuerySchema,
  updateApoioSchema,
  type CreateApoioRequestBody,
  type ListApoiosQuery,
  type UpdateApoioRequestBody,
} from './radar-apoio.schemas.js';
import {
  ApoioSwaggerDto,
  CreateApoioSwaggerRequestDto,
  ErrorSwaggerResponseDto,
  PaginatedApoiosSwaggerDto,
  UpdateApoioSwaggerRequestDto,
} from './radar-apoio.swagger.js';

@ApiTags('Backoffice - Radar de Apoio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissaoAdministrativaGuard)
@RequirePermissaoAdministrativa('GESTAO_RADAR_APOIO')
@Controller('backoffice/apoios')
export class BackofficeApoiosController {
  constructor(
    private readonly listApoios: ListApoiosUseCase,
    private readonly getApoio: GetApoioUseCase,
    private readonly createApoio: CreateApoioUseCase,
    private readonly updateApoio: UpdateApoioUseCase,
    private readonly deactivateApoio: DeactivateApoioUseCase,
    private readonly uploadImagem: UploadApoioImagemUseCase,
    private readonly replaceImagem: ReplaceApoioImagemUseCase,
    private readonly deleteImagem: DeleteApoioImagemUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar apoios',
    description:
      'Lista apoios para gestao no backoffice com filtros, paginacao e busca por localidade.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'esperança' })
  @ApiQuery({
    name: 'tipoApoio',
    required: false,
    enum: ['ONG', 'CLINICA', 'TRANSPORTE', 'CASA_APOIO', 'PSICOLOGO'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['RASCUNHO', 'ATIVO', 'DESATIVADO'],
  })
  @ApiQuery({ name: 'cidade', required: false, example: 'São Paulo' })
  @ApiQuery({ name: 'latitude', required: false, example: -23.563099 })
  @ApiQuery({ name: 'longitude', required: false, example: -46.654293 })
  @ApiOkResponse({
    description: 'Lista paginada de apoios.',
    type: PaginatedApoiosSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  async list(
    @Query(new ZodValidationPipe(listApoiosQuerySchema))
    query: ListApoiosQuery,
  ) {
    return this.listApoios.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar apoio por ID' })
  @ApiOkResponse({ description: 'Apoio encontrado.', type: ApoioSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    try {
      return await this.getApoio.execute(id);
    } catch (error) {
      throw mapApoioError(error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Criar apoio' })
  @ApiCreatedResponse({ description: 'Apoio criado.', type: ApoioSwaggerDto })
  @ApiBody({ type: CreateApoioSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async create(
    @Body(new ZodValidationPipe(createApoioSchema))
    body: CreateApoioRequestBody,
  ) {
    try {
      return await this.createApoio.execute(body);
    } catch (error) {
      throw mapApoioError(error);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar apoio' })
  @ApiOkResponse({ description: 'Apoio atualizado.', type: ApoioSwaggerDto })
  @ApiBody({ type: UpdateApoioSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateApoioSchema))
    body: UpdateApoioRequestBody,
  ) {
    try {
      return await this.updateApoio.execute(id, body);
    } catch (error) {
      throw mapApoioError(error);
    }
  }

  @Post(':id/imagens')
  @UseInterceptors(FileInterceptor('imagem', { limits: { files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adicionar imagem ao apoio' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagem'],
      properties: { imagem: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ description: 'Imagem adicionada.', type: ApoioSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async uploadImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() image?: UploadableImage,
  ) {
    try {
      return await this.uploadImagem.execute(id, requiredImage(image));
    } catch (error) {
      throw mapApoioError(error);
    }
  }

  @Patch(':id/imagens/:imagemId')
  @UseInterceptors(FileInterceptor('imagem', { limits: { files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Substituir imagem de um apoio' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagem'],
      properties: { imagem: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ description: 'Imagem substituÃ­da.', type: ApoioSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async replaceImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imagemId', new ParseUUIDPipe()) imagemId: string,
    @UploadedFile() image?: UploadableImage,
  ) {
    try {
      return await this.replaceImagem.execute(
        id,
        imagemId,
        requiredImage(image),
      );
    } catch (error) {
      throw mapApoioError(error);
    }
  }

  @Delete(':id/imagens/:imagemId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Excluir imagem de um apoio' })
  @ApiNoContentResponse({ description: 'Imagem excluÃ­da.' })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async deleteImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('imagemId', new ParseUUIDPipe()) imagemId: string,
  ): Promise<void> {
    try {
      await this.deleteImagem.execute(id, imagemId);
    } catch (error) {
      throw mapApoioError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Desativar apoio',
    description: 'Realiza exclusao logica alterando o status para DESATIVADO.',
  })
  @ApiNoContentResponse({ description: 'Apoio desativado.' })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    try {
      await this.deactivateApoio.execute(id);
    } catch (error) {
      throw mapApoioError(error);
    }
  }
}

function requiredImage(image?: UploadableImage): UploadableImage {
  if (image === undefined) throw new BadRequestException('Envie uma imagem.');
  return image;
}
