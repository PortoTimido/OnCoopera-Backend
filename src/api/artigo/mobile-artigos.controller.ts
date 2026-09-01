import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetPublishedArtigoUseCase } from '../../application/artigo/use-cases/get-published-artigo.use-case.js';
import { ListPublishedArtigosUseCase } from '../../application/artigo/use-cases/list-published-artigos.use-case.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { mapArtigoError } from './artigo-error.mapper.js';
import {
  listPublishedArtigosQuerySchema,
  type ListPublishedArtigosQuery,
} from './artigo.schemas.js';
import {
  ArtigoSwaggerDto,
  ErrorSwaggerResponseDto,
  PaginatedArtigosSwaggerDto,
} from './artigo.swagger.js';

@ApiTags('Mobile - Artigos')
@Controller('mobile/artigos')
export class MobileArtigosController {
  constructor(
    private readonly listPublishedArtigos: ListPublishedArtigosUseCase,
    private readonly getPublishedArtigo: GetPublishedArtigoUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar artigos publicados',
    description: 'Lista apenas artigos publicados para consumo pelo mobile.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'consulta' })
  @ApiQuery({ name: 'categoriaId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'tagId', required: false, format: 'uuid' })
  @ApiOkResponse({
    description: 'Lista paginada de artigos publicados.',
    type: PaginatedArtigosSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  async list(
    @Query(new ZodValidationPipe(listPublishedArtigosQuerySchema))
    query: ListPublishedArtigosQuery,
  ) {
    return this.listPublishedArtigos.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar artigo publicado por ID' })
  @ApiOkResponse({
    description: 'Artigo publicado encontrado.',
    type: ArtigoSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    try {
      return await this.getPublishedArtigo.execute(id);
    } catch (error) {
      throw mapArtigoError(error);
    }
  }
}
