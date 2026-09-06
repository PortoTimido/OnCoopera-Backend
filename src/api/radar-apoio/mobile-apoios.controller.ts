import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  GetApoioUseCase,
  ListApoiosUseCase,
} from '../../application/radar-apoio/use-cases/apoio.use-cases.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { mapApoioError } from './radar-apoio-error.mapper.js';
import {
  listActiveApoiosQuerySchema,
  type ListActiveApoiosQuery,
} from './radar-apoio.schemas.js';
import {
  ApoioSwaggerDto,
  ErrorSwaggerResponseDto,
  PaginatedApoiosSwaggerDto,
} from './radar-apoio.swagger.js';

@ApiTags('Mobile - Radar de Apoio')
@Controller('mobile/apoios')
export class MobileApoiosController {
  constructor(
    private readonly listApoios: ListApoiosUseCase,
    private readonly getApoio: GetApoioUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar apoios ativos',
    description:
      'Lista apenas apoios ativos para consumo pelo mobile, com filtros e busca por localidade.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'esperança' })
  @ApiQuery({
    name: 'tipoApoio',
    required: false,
    enum: ['ONG', 'CLINICA', 'TRANSPORTE', 'CASA_APOIO', 'PSICOLOGO'],
  })
  @ApiQuery({ name: 'cidade', required: false, example: 'São Paulo' })
  @ApiQuery({ name: 'latitude', required: false, example: -23.563099 })
  @ApiQuery({ name: 'longitude', required: false, example: -46.654293 })
  @ApiOkResponse({
    description: 'Lista paginada de apoios ativos.',
    type: PaginatedApoiosSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  async list(
    @Query(new ZodValidationPipe(listActiveApoiosQuerySchema))
    query: ListActiveApoiosQuery,
  ) {
    return this.listApoios.execute({ ...query, onlyActive: true });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar apoio ativo por ID' })
  @ApiOkResponse({
    description: 'Apoio ativo encontrado.',
    type: ApoioSwaggerDto,
  })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async getById(@Param('id', new ParseUUIDPipe()) id: string) {
    try {
      return await this.getApoio.execute(id, true);
    } catch (error) {
      throw mapApoioError(error);
    }
  }
}
