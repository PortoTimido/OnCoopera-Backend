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
import {
  CreateCategoriaUseCase,
  CreateTagUseCase,
  DeleteCategoriaUseCase,
  DeleteTagUseCase,
  ListCategoriasUseCase,
  ListTagsUseCase,
  UpdateCategoriaUseCase,
  UpdateTagUseCase,
} from '../../application/artigo/use-cases/manage-taxonomia.use-cases.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { JwtAuthGuard } from '../usuario-autenticacao/jwt-auth.guard.js';
import { ArticleContentGuard } from './article-content.guard.js';
import { mapArtigoError } from './artigo-error.mapper.js';
import {
  taxonomiaQuerySchema,
  taxonomiaSchema,
  type TaxonomiaQuery,
  type TaxonomiaRequestBody,
} from './artigo.schemas.js';
import {
  ErrorSwaggerResponseDto,
  TaxonomiaListSwaggerDto,
  TaxonomiaRequestSwaggerDto,
  TaxonomiaSwaggerDto,
} from './artigo.swagger.js';

@ApiTags('Backoffice - Artigo categorias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ArticleContentGuard)
@Controller('backoffice/artigo-categorias')
export class BackofficeArtigoCategoriasController {
  constructor(
    private readonly listCategorias: ListCategoriasUseCase,
    private readonly createCategoria: CreateCategoriaUseCase,
    private readonly updateCategoria: UpdateCategoriaUseCase,
    private readonly deleteCategoria: DeleteCategoriaUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias de artigo' })
  @ApiQuery({ name: 'search', required: false, example: 'tratamento' })
  @ApiOkResponse({
    description: 'Categorias encontradas.',
    type: TaxonomiaListSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  async list(
    @Query(new ZodValidationPipe(taxonomiaQuerySchema))
    query: TaxonomiaQuery,
  ) {
    return { data: await this.listCategorias.execute(query.search) };
  }

  @Post()
  @ApiOperation({ summary: 'Criar categoria de artigo' })
  @ApiCreatedResponse({
    description: 'Categoria criada.',
    type: TaxonomiaSwaggerDto,
  })
  @ApiBody({ type: TaxonomiaRequestSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async create(
    @Body(new ZodValidationPipe(taxonomiaSchema))
    body: TaxonomiaRequestBody,
  ) {
    try {
      return await this.createCategoria.execute(body.nome);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria de artigo' })
  @ApiOkResponse({
    description: 'Categoria atualizada.',
    type: TaxonomiaSwaggerDto,
  })
  @ApiBody({ type: TaxonomiaRequestSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(taxonomiaSchema))
    body: TaxonomiaRequestBody,
  ) {
    try {
      return await this.updateCategoria.execute(id, body.nome);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover categoria de artigo' })
  @ApiNoContentResponse({ description: 'Categoria removida.' })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    try {
      await this.deleteCategoria.execute(id);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }
}

@ApiTags('Backoffice - Artigo tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ArticleContentGuard)
@Controller('backoffice/artigo-tags')
export class BackofficeArtigoTagsController {
  constructor(
    private readonly listTags: ListTagsUseCase,
    private readonly createTag: CreateTagUseCase,
    private readonly updateTag: UpdateTagUseCase,
    private readonly deleteTag: DeleteTagUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar tags de artigo' })
  @ApiQuery({ name: 'search', required: false, example: 'quimioterapia' })
  @ApiOkResponse({
    description: 'Tags encontradas.',
    type: TaxonomiaListSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  async list(
    @Query(new ZodValidationPipe(taxonomiaQuerySchema))
    query: TaxonomiaQuery,
  ) {
    return { data: await this.listTags.execute(query.search) };
  }

  @Post()
  @ApiOperation({ summary: 'Criar tag de artigo' })
  @ApiCreatedResponse({ description: 'Tag criada.', type: TaxonomiaSwaggerDto })
  @ApiBody({ type: TaxonomiaRequestSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async create(
    @Body(new ZodValidationPipe(taxonomiaSchema))
    body: TaxonomiaRequestBody,
  ) {
    try {
      return await this.createTag.execute(body.nome);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar tag de artigo' })
  @ApiOkResponse({ description: 'Tag atualizada.', type: TaxonomiaSwaggerDto })
  @ApiBody({ type: TaxonomiaRequestSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(taxonomiaSchema))
    body: TaxonomiaRequestBody,
  ) {
    try {
      return await this.updateTag.execute(id, body.nome);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover tag de artigo' })
  @ApiNoContentResponse({ description: 'Tag removida.' })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    try {
      await this.deleteTag.execute(id);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }
}
