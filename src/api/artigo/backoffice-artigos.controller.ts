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
  Req,
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
import { CreateArtigoUseCase } from '../../application/artigo/use-cases/create-artigo.use-case.js';
import { DeleteArtigoUseCase } from '../../application/artigo/use-cases/delete-artigo.use-case.js';
import { GetArtigoDetailsUseCase } from '../../application/artigo/use-cases/get-artigo-details.use-case.js';
import { ListArtigosUseCase } from '../../application/artigo/use-cases/list-artigos.use-case.js';
import { UpdateArtigoUseCase } from '../../application/artigo/use-cases/update-artigo.use-case.js';
import {
  DeleteArtigoImagemUseCase,
  UploadArtigoImagemUseCase,
} from '../../application/artigo/use-cases/manage-artigo-imagem.use-cases.js';
import type { UploadableImage } from '../../application/armazenamento-imagem/image-storage.port.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import type { AuthenticatedRequest } from '../usuario-autenticacao/auth.request.js';
import { JwtAuthGuard } from '../usuario-autenticacao/jwt-auth.guard.js';
import { PermissaoAdministrativaGuard } from '../usuario-autenticacao/permissao-administrativa.guard.js';
import { RequirePermissaoAdministrativa } from '../usuario-autenticacao/permissao-administrativa.decorator.js';
import { mapArtigoError } from './artigo-error.mapper.js';
import {
  createArtigoSchema,
  listArtigosQuerySchema,
  updateArtigoSchema,
  type CreateArtigoRequestBody,
  type ListArtigosQuery,
  type UpdateArtigoRequestBody,
} from './artigo.schemas.js';
import {
  ArtigoSwaggerDto,
  CreateArtigoSwaggerRequestDto,
  ErrorSwaggerResponseDto,
  PaginatedArtigosSwaggerDto,
  UpdateArtigoSwaggerRequestDto,
} from './artigo.swagger.js';

@ApiTags('Backoffice - Artigos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissaoAdministrativaGuard)
@RequirePermissaoAdministrativa('GESTAO_CONTEUDOS')
@Controller('backoffice/artigos')
export class BackofficeArtigosController {
  constructor(
    private readonly listArtigos: ListArtigosUseCase,
    private readonly getArtigoDetails: GetArtigoDetailsUseCase,
    private readonly createArtigo: CreateArtigoUseCase,
    private readonly updateArtigo: UpdateArtigoUseCase,
    private readonly deleteArtigo: DeleteArtigoUseCase,
    private readonly uploadImagem: UploadArtigoImagemUseCase,
    private readonly deleteImagem: DeleteArtigoImagemUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar artigos',
    description:
      'Lista artigos para gestao no backoffice com filtros e paginacao.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'consulta' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['RASCUNHO', 'PUBLICADO', 'DESATIVADO'],
  })
  @ApiQuery({ name: 'categoriaId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'tagId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'autorId', required: false, format: 'uuid' })
  @ApiOkResponse({
    description: 'Lista paginada de artigos.',
    type: PaginatedArtigosSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  async list(
    @Query(new ZodValidationPipe(listArtigosQuerySchema))
    query: ListArtigosQuery,
  ) {
    return this.listArtigos.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar artigo por ID' })
  @ApiOkResponse({ description: 'Artigo encontrado.', type: ArtigoSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    try {
      return await this.getArtigoDetails.execute(id);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Criar artigo',
    description:
      'Cria artigo usando o administrador autenticado como autor. O body nao aceita autorId.',
  })
  @ApiCreatedResponse({ description: 'Artigo criado.', type: ArtigoSwaggerDto })
  @ApiBody({ type: CreateArtigoSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createArtigoSchema))
    body: CreateArtigoRequestBody,
  ) {
    try {
      return await this.createArtigo.execute({
        ...body,
        autorId: request.auth!.usuarioId,
      });
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar artigo' })
  @ApiOkResponse({
    description: 'Artigo atualizado.',
    type: ArtigoSwaggerDto,
  })
  @ApiBody({ type: UpdateArtigoSwaggerRequestDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateArtigoSchema))
    body: UpdateArtigoRequestBody,
  ) {
    try {
      return await this.updateArtigo.execute(id, body);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Post(':id/imagem')
  @UseInterceptors(FileInterceptor('imagem', { limits: { files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar ou substituir imagem de capa do artigo' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagem'],
      properties: { imagem: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({
    description: 'Imagem de capa salva.',
    type: ArtigoSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async uploadCover(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() image?: UploadableImage,
  ) {
    try {
      return await this.uploadImagem.execute(id, requiredImage(image));
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Delete(':id/imagem')
  @HttpCode(204)
  @ApiOperation({ summary: 'Excluir imagem de capa do artigo' })
  @ApiNoContentResponse({ description: 'Imagem de capa excluÃ­da.' })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async deleteCover(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    try {
      await this.deleteImagem.execute(id);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Desativar artigo',
    description: 'Realiza exclusao logica alterando o status para DESATIVADO.',
  })
  @ApiNoContentResponse({ description: 'Artigo desativado.' })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    try {
      await this.deleteArtigo.execute(id);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }
}

function requiredImage(image?: UploadableImage): UploadableImage {
  if (image === undefined) throw new BadRequestException('Envie uma imagem.');
  return image;
}
