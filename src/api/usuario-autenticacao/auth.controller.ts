import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import {
  AUTH_CONFIG,
  type AuthConfig,
} from '../../application/usuario-autenticacao/ports/auth-config.js';
import { AuthenticateUserUseCase } from '../../application/usuario-autenticacao/use-cases/authenticate-user.use-case.js';
import { ChangePasswordUseCase } from '../../application/usuario-autenticacao/use-cases/change-password.use-case.js';
import { ChangeTemporaryPasswordUseCase } from '../../application/usuario-autenticacao/use-cases/change-temporary-password.use-case.js';
import { GetAuthenticatedUserUseCase } from '../../application/usuario-autenticacao/use-cases/get-authenticated-user.use-case.js';
import { LogoutSessionUseCase } from '../../application/usuario-autenticacao/use-cases/logout-session.use-case.js';
import { RefreshSessionUseCase } from '../../application/usuario-autenticacao/use-cases/refresh-session.use-case.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
} from './auth-cookie.service.js';
import { mapAuthError } from './auth-error.mapper.js';
import type { AuthenticatedRequest } from './auth.request.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import {
  changePasswordSchema,
  changeTemporaryPasswordSchema,
  loginSchema,
  type ChangePasswordRequestBody,
  type ChangeTemporaryPasswordRequestBody,
  type LoginRequestBody,
} from './auth.schemas.js';
import {
  AuthSwaggerResponseDto,
  AuthenticatedUserSwaggerDto,
  ChangePasswordSwaggerRequestDto,
  ChangeTemporaryPasswordSwaggerRequestDto,
  ErrorSwaggerResponseDto,
  LoginSwaggerRequestDto,
} from './auth.swagger.js';

@ApiTags('Usuário e Autenticação')
@Controller('auth')
export class AuthController {
  private readonly authenticateUser: AuthenticateUserUseCase;
  private readonly refreshSession: RefreshSessionUseCase;
  private readonly logoutSession: LogoutSessionUseCase;
  private readonly getAuthenticatedUser: GetAuthenticatedUserUseCase;
  private readonly changePassword: ChangePasswordUseCase;
  private readonly changeTemporaryPassword: ChangeTemporaryPasswordUseCase;
  private readonly config: AuthConfig;

  constructor(
    authenticateUser: AuthenticateUserUseCase,
    refreshSession: RefreshSessionUseCase,
    logoutSession: LogoutSessionUseCase,
    getAuthenticatedUser: GetAuthenticatedUserUseCase,
    changePassword: ChangePasswordUseCase,
    changeTemporaryPassword: ChangeTemporaryPasswordUseCase,
    @Inject(AUTH_CONFIG) config: AuthConfig,
  ) {
    this.authenticateUser = authenticateUser;
    this.refreshSession = refreshSession;
    this.logoutSession = logoutSession;
    this.getAuthenticatedUser = getAuthenticatedUser;
    this.changePassword = changePassword;
    this.changeTemporaryPassword = changeTemporaryPassword;
    this.config = config;
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Autenticar usuário',
    description:
      'Autentica por email ou login, cria sessão revogável, retorna access token e seta cookies de refresh e CSRF.',
  })
  @ApiBody({ type: LoginSwaggerRequestDto })
  @ApiOkResponse({
    description: 'Usuário autenticado com sucesso.',
    headers: {
      'Set-Cookie': {
        description:
          'Define refresh token HttpOnly e CSRF token legível no path `/api/auth`.',
        schema: { type: 'string' },
      },
    },
    type: AuthSwaggerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido.',
    type: ErrorSwaggerResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas ou usuário não ativo.',
    type: ErrorSwaggerResponseDto,
  })
  @ApiConflictResponse({
    description: 'Usuário deve trocar a senha temporária antes do login.',
    type: ErrorSwaggerResponseDto,
  })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginRequestBody,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const output = await this.authenticateUser.execute(body);
      setAuthCookies(response, output, this.config);

      return {
        accessToken: output.accessToken,
        usuario: output.usuario,
      };
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Post('change-temporary-password')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Trocar senha temporária',
    description:
      'Permite que um usuário criado com senha temporária defina senha definitiva antes de abrir sessão.',
  })
  @ApiBody({ type: ChangeTemporaryPasswordSwaggerRequestDto })
  @ApiNoContentResponse({
    description: 'Senha temporária trocada com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido ou nova senha fora da política.',
    type: ErrorSwaggerResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Identificador ou senha temporária inválidos.',
    type: ErrorSwaggerResponseDto,
  })
  async updateTemporaryPassword(
    @Body(new ZodValidationPipe(changeTemporaryPasswordSchema))
    body: ChangeTemporaryPasswordRequestBody,
  ): Promise<void> {
    try {
      await this.changeTemporaryPassword.execute(body);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Renovar sessão autenticada',
    description:
      'Renova o access token usando refresh cookie válido e header CSRF, rotacionando refresh e CSRF tokens.',
  })
  @ApiCookieAuth('refreshToken')
  @ApiHeader({
    name: 'x-csrf-token',
    description: 'CSRF token recebido no cookie legível de autenticação.',
    required: true,
  })
  @ApiOkResponse({
    description: 'Sessão renovada com sucesso.',
    headers: {
      'Set-Cookie': {
        description: 'Rotaciona refresh token HttpOnly e CSRF token legível.',
        schema: { type: 'string' },
      },
    },
    type: AuthSwaggerResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token ausente, inválido, expirado ou revogado.',
    type: ErrorSwaggerResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'CSRF token ausente ou inválido.',
    type: ErrorSwaggerResponseDto,
  })
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Headers('x-csrf-token') csrfToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const refreshToken = getRefreshTokenFromRequest(request);

      if (refreshToken === undefined) {
        throw new UnauthorizedException('Sessão inválida.');
      }

      const output = await this.refreshSession.execute({
        refreshToken,
        csrfToken,
      });

      setAuthCookies(response, output, this.config);

      return {
        accessToken: output.accessToken,
        usuario: output.usuario,
      };
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Encerrar sessão autenticada',
    description:
      'Revoga a sessão associada ao refresh token quando ele existir e limpa os cookies de autenticação.',
  })
  @ApiCookieAuth('refreshToken')
  @ApiHeader({
    name: 'x-csrf-token',
    description: 'CSRF token recebido no cookie legível de autenticação.',
    required: false,
  })
  @ApiNoContentResponse({
    description: 'Logout processado com sucesso.',
    headers: {
      'Set-Cookie': {
        description: 'Limpa refresh token HttpOnly e CSRF token.',
        schema: { type: 'string' },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'CSRF token inválido para uma sessão existente.',
    type: ErrorSwaggerResponseDto,
  })
  async logout(
    @Req() request: AuthenticatedRequest,
    @Headers('x-csrf-token') csrfToken: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    try {
      await this.logoutSession.execute({
        refreshToken: getRefreshTokenFromRequest(request),
        csrfToken,
      });

      clearAuthCookies(response, this.config);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Consultar usuário autenticado',
    description: 'Retorna a identidade sanitizada do usuário autenticado.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Usuário autenticado.',
    type: AuthenticatedUserSwaggerDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token ausente, inválido ou sessão revogada.',
    type: ErrorSwaggerResponseDto,
  })
  async me(@Req() request: AuthenticatedRequest) {
    try {
      return await this.getAuthenticatedUser.execute(
        requireAuthContext(request).usuarioId,
      );
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  @Post('change-password')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Alterar senha do usuário autenticado',
    description:
      'Valida a senha atual, aplica a política da nova senha, grava novo hash bcrypt e revoga sessões do usuário.',
  })
  @ApiBearerAuth()
  @ApiBody({ type: ChangePasswordSwaggerRequestDto })
  @ApiNoContentResponse({
    description: 'Senha alterada com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido ou nova senha fora da política.',
    type: ErrorSwaggerResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token inválido ou senha atual incorreta.',
    type: ErrorSwaggerResponseDto,
  })
  async updatePassword(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: ChangePasswordRequestBody,
  ): Promise<void> {
    try {
      await this.changePassword.execute({
        usuarioId: requireAuthContext(request).usuarioId,
        senhaAtual: body.senhaAtual,
        novaSenha: body.novaSenha,
      });
    } catch (error) {
      throw mapAuthError(error);
    }
  }
}

function requireAuthContext(request: AuthenticatedRequest) {
  if (request.auth === undefined) {
    throw new UnauthorizedException('Usuário não autenticado.');
  }

  return request.auth;
}
