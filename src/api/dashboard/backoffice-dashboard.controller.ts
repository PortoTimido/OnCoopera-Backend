import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetMonthlyGrowthUseCase } from '../../application/dashboard/use-cases/get-monthly-growth.use-case.js';
import { PERMISSAO_ADMINISTRATIVA_TOTAL } from '../../domain/usuario-autenticacao/entities/usuario.entity.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import type { AuthenticatedRequest } from '../usuario-autenticacao/auth.request.js';
import { JwtAuthGuard } from '../usuario-autenticacao/jwt-auth.guard.js';
import { RequirePermissaoAdministrativa } from '../usuario-autenticacao/permissao-administrativa.decorator.js';
import { PermissaoAdministrativaGuard } from '../usuario-autenticacao/permissao-administrativa.guard.js';
import { ErrorSwaggerResponseDto } from '../artigo/artigo.swagger.js';
import {
  monthlyGrowthQuerySchema,
  type MonthlyGrowthQuery,
} from './dashboard.schemas.js';
import { MonthlyGrowthSwaggerDto } from './dashboard.swagger.js';

@ApiTags('Backoffice - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissaoAdministrativaGuard)
@RequirePermissaoAdministrativa(
  'GESTAO_CONTEUDOS',
  'GESTAO_RADAR_APOIO',
  'GERENCIAR_USUARIOS',
)
@Controller('v1/backoffice/dashboard')
export class BackofficeDashboardController {
  constructor(private readonly getMonthlyGrowth: GetMonthlyGrowthUseCase) {}

  @Get('crescimento-mensal')
  @ApiOperation({
    summary: 'Consultar crescimento mensal acumulado',
    description:
      'Retorna os últimos meses completos em UTC. Cada série só é fornecida quando o administrador possui a permissão correspondente; séries sem autorização retornam null.',
  })
  @ApiQuery({ name: 'periodMonths', required: true, enum: [6, 12], example: 6 })
  @ApiOkResponse({
    description: 'Série mensal acumulada para o dashboard administrativo.',
    type: MonthlyGrowthSwaggerDto,
    example: {
      points: [
        {
          month: '2026-04',
          articlesPublished: 24,
          supportLocations: 43,
          activeUsers: 1247,
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    type: ErrorSwaggerResponseDto,
    example: { message: 'Payload invÃ¡lido.' },
  })
  @ApiUnauthorizedResponse({
    type: ErrorSwaggerResponseDto,
    example: { message: 'UsuÃ¡rio nÃ£o autenticado.' },
  })
  @ApiForbiddenResponse({
    type: ErrorSwaggerResponseDto,
    example: { message: 'PermissÃ£o administrativa insuficiente.' },
  })
  async getMonthlyGrowthData(
    @Query(new ZodValidationPipe(monthlyGrowthQuerySchema))
    query: MonthlyGrowthQuery,
    @Req() request: AuthenticatedRequest,
  ) {
    const permissions = request.auth!.permissoesAdministrativas;
    const has = (permission: (typeof permissions)[number]) =>
      permissions.includes(PERMISSAO_ADMINISTRATIVA_TOTAL) ||
      permissions.includes(permission);

    return this.getMonthlyGrowth.execute({
      periodMonths: query.periodMonths,
      includeArticlesPublished: has('GESTAO_CONTEUDOS'),
      includeSupportLocations: has('GESTAO_RADAR_APOIO'),
      includeActiveUsers: has('GERENCIAR_USUARIOS'),
    });
  }
}
