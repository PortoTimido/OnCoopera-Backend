import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AUTH_CONFIG,
  type AuthConfig,
} from '../../application/usuario-autenticacao/ports/auth-config.js';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '../../application/usuario-autenticacao/ports/usuario.repository.js';
import { IssueAuthSessionService } from '../../application/usuario-autenticacao/services/issue-auth-session.service.js';
import { TermosUsoAceiteService } from '../../application/usuario-autenticacao/services/termos-uso-aceite.service.js';
import { setAuthCookies } from './auth-cookie.service.js';
import type { AuthenticatedRequest } from './auth.request.js';
import { TermosUsoAceiteGuard } from './termos-uso-aceite.guard.js';
import { ErrorSwaggerResponseDto } from './auth.swagger.js';

class TermosUsoAceiteStatusSwaggerDto {
  @ApiProperty({ example: false })
  aceito!: boolean;
}

class TermosUsoAceiteSwaggerDto {
  @ApiProperty({
    description:
      'Access token JWT emitido após registrar o aceite do Termo de Uso.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;
}

@ApiTags('Mobile - Aceites de documentos')
@ApiBearerAuth()
@UseGuards(TermosUsoAceiteGuard)
@Controller('mobile/aceites-documentos')
export class MobileAceitesDocumentosController {
  constructor(
    private readonly termosUso: TermosUsoAceiteService,
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepository,
    private readonly issueSession: IssueAuthSessionService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig,
  ) {}

  @Get('termos-uso')
  @ApiOperation({ summary: 'Consultar aceite do Termo de Uso vigente' })
  @ApiOkResponse({ type: TermosUsoAceiteStatusSwaggerDto })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  async getTermosUso(@Req() request: AuthenticatedRequest) {
    return { aceito: await this.termosUso.isAceito(request.auth!.usuarioId) };
  }

  @Post('termos-uso')
  @HttpCode(200)
  @ApiOperation({ summary: 'Registrar aceite do Termo de Uso vigente' })
  @ApiOkResponse({
    type: TermosUsoAceiteSwaggerDto,
    description:
      'Registra o aceite e retorna um access token de sessão. Também define os cookies de refresh e CSRF.',
    headers: {
      'Set-Cookie': {
        description:
          'Define refresh token HttpOnly e CSRF token legível no path `/api/auth`.',
        schema: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ type: ErrorSwaggerResponseDto })
  @ApiForbiddenResponse({ type: ErrorSwaggerResponseDto })
  async acceptTermosUso(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const usuarioId = request.auth!.usuarioId;
    await this.termosUso.registrar(usuarioId);

    const usuario = await this.usuarios.findById(usuarioId);
    if (usuario === null) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    const session = await this.issueSession.issue(usuario);
    setAuthCookies(response, session, this.config);

    return { accessToken: session.accessToken };
  }
}
