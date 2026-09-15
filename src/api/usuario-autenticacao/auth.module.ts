import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  AUTH_CONFIG,
  type AuthConfig,
} from '../../application/usuario-autenticacao/ports/auth-config.js';
import {
  ACCESS_TOKEN_SERVICE,
  type AccessTokenService,
} from '../../application/usuario-autenticacao/ports/access-token.service.js';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepository,
} from '../../application/usuario-autenticacao/ports/auth-session.repository.js';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../application/usuario-autenticacao/ports/password-hasher.js';
import {
  SECRET_GENERATOR,
  type SecretGenerator,
} from '../../application/usuario-autenticacao/ports/secret-generator.js';
import {
  TEMPORARY_PASSWORD_GENERATOR,
  type TemporaryPasswordGenerator,
} from '../../application/usuario-autenticacao/ports/temporary-password-generator.js';
import {
  TOKEN_HASHER,
  type TokenHasher,
} from '../../application/usuario-autenticacao/ports/token-hasher.js';
import {
  USUARIO_MANAGEMENT_REPOSITORY,
  type UsuarioManagementRepository,
} from '../../application/usuario-autenticacao/ports/usuario-management.repository.js';
import {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from '../../application/usuario-autenticacao/ports/usuario.repository.js';
import { AuthenticateUserUseCase } from '../../application/usuario-autenticacao/use-cases/authenticate-user.use-case.js';
import { ChangeTemporaryPasswordUseCase } from '../../application/usuario-autenticacao/use-cases/change-temporary-password.use-case.js';
import { ChangePasswordUseCase } from '../../application/usuario-autenticacao/use-cases/change-password.use-case.js';
import { CreateAdministradorUseCase } from '../../application/usuario-autenticacao/use-cases/create-administrador.use-case.js';
import { CreatePacienteUseCase } from '../../application/usuario-autenticacao/use-cases/create-paciente.use-case.js';
import { GetAuthenticatedUserUseCase } from '../../application/usuario-autenticacao/use-cases/get-authenticated-user.use-case.js';
import { GetUsuarioDetailsUseCase } from '../../application/usuario-autenticacao/use-cases/get-usuario-details.use-case.js';
import { InactivateAdministradorUseCase } from '../../application/usuario-autenticacao/use-cases/inactivate-administrador.use-case.js';
import { InactivatePacienteUseCase } from '../../application/usuario-autenticacao/use-cases/inactivate-paciente.use-case.js';
import { ListUsuariosUseCase } from '../../application/usuario-autenticacao/use-cases/list-usuarios.use-case.js';
import { LogoutSessionUseCase } from '../../application/usuario-autenticacao/use-cases/logout-session.use-case.js';
import { RefreshSessionUseCase } from '../../application/usuario-autenticacao/use-cases/refresh-session.use-case.js';
import { UpdateAdministradorUseCase } from '../../application/usuario-autenticacao/use-cases/update-administrador.use-case.js';
import { UpdateOwnProfileUseCase } from '../../application/usuario-autenticacao/use-cases/update-own-profile.use-case.js';
import { UpdatePacienteUseCase } from '../../application/usuario-autenticacao/use-cases/update-paciente.use-case.js';
import {
  PASSWORD_RECOVERY_REPOSITORY,
  type PasswordRecoveryRepository,
} from '../../application/usuario-autenticacao/ports/password-recovery.repository.js';
import {
  RequestPasswordRecoveryUseCase,
  ResetPasswordWithTokenUseCase,
  VerifyPasswordRecoveryCodeUseCase,
} from '../../application/usuario-autenticacao/use-cases/password-recovery.use-cases.js';
import { ResendTemporaryAccessUseCase } from '../../application/usuario-autenticacao/use-cases/resend-temporary-access.use-case.js';
import {
  EMAIL_SERVICE,
  type EmailService,
} from '../../application/email/email.service.js';
import { PrismaPasswordRecoveryRepository } from '../../infrastructure/usuario-autenticacao/prisma-password-recovery.repository.js';
import { EmailModule } from '../../infrastructure/email/email.module.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { createAuthConfigFromEnv } from '../../infrastructure/usuario-autenticacao/auth-config.factory.js';
import { BcryptPasswordHasher } from '../../infrastructure/usuario-autenticacao/bcrypt-password-hasher.js';
import { HmacTokenHasher } from '../../infrastructure/usuario-autenticacao/hmac-token-hasher.js';
import { JwtAccessTokenService } from '../../infrastructure/usuario-autenticacao/jwt-access-token.service.js';
import { NodeSecretGenerator } from '../../infrastructure/usuario-autenticacao/node-secret-generator.js';
import { PrismaAuthSessionRepository } from '../../infrastructure/usuario-autenticacao/prisma-auth-session.repository.js';
import { PrismaUsuarioRepository } from '../../infrastructure/usuario-autenticacao/prisma-usuario.repository.js';
import { SecureTemporaryPasswordGenerator } from '../../infrastructure/usuario-autenticacao/secure-temporary-password-generator.js';
import { PermissaoAdministrativaGuard } from './permissao-administrativa.guard.js';
import { AuthController } from './auth.controller.js';
import { BackofficeUsuariosController } from './backoffice-usuarios.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { MobilePacientesController } from './mobile-pacientes.controller.js';

@Module({
  imports: [JwtModule.register({}), EmailModule],
  controllers: [
    AuthController,
    BackofficeUsuariosController,
    MobilePacientesController,
  ],
  providers: [
    {
      provide: AUTH_CONFIG,
      useFactory: () => createAuthConfigFromEnv(process.env),
    },
    {
      provide: PASSWORD_HASHER,
      useFactory: (config: AuthConfig) => new BcryptPasswordHasher(config),
      inject: [AUTH_CONFIG],
    },
    {
      provide: ACCESS_TOKEN_SERVICE,
      useFactory: (jwtService: JwtService, config: AuthConfig) =>
        new JwtAccessTokenService(jwtService, config),
      inject: [JwtService, AUTH_CONFIG],
    },
    {
      provide: TOKEN_HASHER,
      useFactory: (config: AuthConfig) => new HmacTokenHasher(config),
      inject: [AUTH_CONFIG],
    },
    {
      provide: SECRET_GENERATOR,
      useFactory: () => new NodeSecretGenerator(),
    },
    {
      provide: TEMPORARY_PASSWORD_GENERATOR,
      useFactory: () => new SecureTemporaryPasswordGenerator(),
    },
    {
      provide: USUARIO_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaUsuarioRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: USUARIO_MANAGEMENT_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaUsuarioRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaAuthSessionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PASSWORD_RECOVERY_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaPasswordRecoveryRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: AuthenticateUserUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        sessions: AuthSessionRepository,
        passwordHasher: PasswordHasher,
        accessTokens: AccessTokenService,
        tokenHasher: TokenHasher,
        secretGenerator: SecretGenerator,
        config: AuthConfig,
      ) =>
        new AuthenticateUserUseCase(
          usuarios,
          sessions,
          passwordHasher,
          accessTokens,
          tokenHasher,
          secretGenerator,
          config,
        ),
      inject: [
        USUARIO_REPOSITORY,
        AUTH_SESSION_REPOSITORY,
        PASSWORD_HASHER,
        ACCESS_TOKEN_SERVICE,
        TOKEN_HASHER,
        SECRET_GENERATOR,
        AUTH_CONFIG,
      ],
    },
    {
      provide: RefreshSessionUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        sessions: AuthSessionRepository,
        accessTokens: AccessTokenService,
        tokenHasher: TokenHasher,
        secretGenerator: SecretGenerator,
        config: AuthConfig,
      ) =>
        new RefreshSessionUseCase(
          usuarios,
          sessions,
          accessTokens,
          tokenHasher,
          secretGenerator,
          config,
        ),
      inject: [
        USUARIO_REPOSITORY,
        AUTH_SESSION_REPOSITORY,
        ACCESS_TOKEN_SERVICE,
        TOKEN_HASHER,
        SECRET_GENERATOR,
        AUTH_CONFIG,
      ],
    },
    {
      provide: LogoutSessionUseCase,
      useFactory: (sessions: AuthSessionRepository, tokenHasher: TokenHasher) =>
        new LogoutSessionUseCase(sessions, tokenHasher),
      inject: [AUTH_SESSION_REPOSITORY, TOKEN_HASHER],
    },
    {
      provide: GetAuthenticatedUserUseCase,
      useFactory: (usuarios: UsuarioRepository) =>
        new GetAuthenticatedUserUseCase(usuarios),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: ChangePasswordUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        sessions: AuthSessionRepository,
        passwordHasher: PasswordHasher,
      ) => new ChangePasswordUseCase(usuarios, sessions, passwordHasher),
      inject: [USUARIO_REPOSITORY, AUTH_SESSION_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: ChangeTemporaryPasswordUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        sessions: AuthSessionRepository,
        passwordHasher: PasswordHasher,
      ) =>
        new ChangeTemporaryPasswordUseCase(usuarios, sessions, passwordHasher),
      inject: [USUARIO_REPOSITORY, AUTH_SESSION_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: UpdateOwnProfileUseCase,
      useFactory: (usuarios: UsuarioRepository) =>
        new UpdateOwnProfileUseCase(usuarios),
      inject: [USUARIO_REPOSITORY],
    },
    {
      provide: ListUsuariosUseCase,
      useFactory: (usuarios: UsuarioManagementRepository) =>
        new ListUsuariosUseCase(usuarios),
      inject: [USUARIO_MANAGEMENT_REPOSITORY],
    },
    {
      provide: GetUsuarioDetailsUseCase,
      useFactory: (usuarios: UsuarioManagementRepository) =>
        new GetUsuarioDetailsUseCase(usuarios),
      inject: [USUARIO_MANAGEMENT_REPOSITORY],
    },
    {
      provide: CreateAdministradorUseCase,
      useFactory: (
        usuarios: UsuarioManagementRepository,
        passwordHasher: PasswordHasher,
        temporaryPasswords: TemporaryPasswordGenerator,
        email: EmailService,
        config: AuthConfig,
      ) =>
        new CreateAdministradorUseCase(
          usuarios,
          passwordHasher,
          temporaryPasswords,
          email,
          config,
        ),
      inject: [
        USUARIO_MANAGEMENT_REPOSITORY,
        PASSWORD_HASHER,
        TEMPORARY_PASSWORD_GENERATOR,
        EMAIL_SERVICE,
        AUTH_CONFIG,
      ],
    },
    {
      provide: RequestPasswordRecoveryUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        recoveries: PasswordRecoveryRepository,
        tokens: TokenHasher,
        email: EmailService,
        config: AuthConfig,
      ) =>
        new RequestPasswordRecoveryUseCase(
          usuarios,
          recoveries,
          tokens,
          email,
          config,
        ),
      inject: [
        USUARIO_REPOSITORY,
        PASSWORD_RECOVERY_REPOSITORY,
        TOKEN_HASHER,
        EMAIL_SERVICE,
        AUTH_CONFIG,
      ],
    },
    {
      provide: VerifyPasswordRecoveryCodeUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        recoveries: PasswordRecoveryRepository,
        tokens: TokenHasher,
        secrets: SecretGenerator,
        config: AuthConfig,
      ) =>
        new VerifyPasswordRecoveryCodeUseCase(
          usuarios,
          recoveries,
          tokens,
          secrets,
          config,
        ),
      inject: [
        USUARIO_REPOSITORY,
        PASSWORD_RECOVERY_REPOSITORY,
        TOKEN_HASHER,
        SECRET_GENERATOR,
        AUTH_CONFIG,
      ],
    },
    {
      provide: ResetPasswordWithTokenUseCase,
      useFactory: (
        recoveries: PasswordRecoveryRepository,
        tokens: TokenHasher,
        passwords: PasswordHasher,
        usuarios: UsuarioRepository,
        sessions: AuthSessionRepository,
      ) =>
        new ResetPasswordWithTokenUseCase(
          recoveries,
          tokens,
          passwords,
          usuarios,
          sessions,
        ),
      inject: [
        PASSWORD_RECOVERY_REPOSITORY,
        TOKEN_HASHER,
        PASSWORD_HASHER,
        USUARIO_REPOSITORY,
        AUTH_SESSION_REPOSITORY,
      ],
    },
    {
      provide: ResendTemporaryAccessUseCase,
      useFactory: (
        usuarios: UsuarioRepository,
        sessions: AuthSessionRepository,
        passwords: PasswordHasher,
        generator: TemporaryPasswordGenerator,
        email: EmailService,
        config: AuthConfig,
      ) =>
        new ResendTemporaryAccessUseCase(
          usuarios,
          sessions,
          passwords,
          generator,
          email,
          config,
        ),
      inject: [
        USUARIO_REPOSITORY,
        AUTH_SESSION_REPOSITORY,
        PASSWORD_HASHER,
        TEMPORARY_PASSWORD_GENERATOR,
        EMAIL_SERVICE,
        AUTH_CONFIG,
      ],
    },
    {
      provide: UpdateAdministradorUseCase,
      useFactory: (
        usuarios: UsuarioManagementRepository,
        sessions: AuthSessionRepository,
      ) => new UpdateAdministradorUseCase(usuarios, sessions),
      inject: [USUARIO_MANAGEMENT_REPOSITORY, AUTH_SESSION_REPOSITORY],
    },
    {
      provide: InactivateAdministradorUseCase,
      useFactory: (
        usuarios: UsuarioManagementRepository,
        sessions: AuthSessionRepository,
      ) => new InactivateAdministradorUseCase(usuarios, sessions),
      inject: [USUARIO_MANAGEMENT_REPOSITORY, AUTH_SESSION_REPOSITORY],
    },
    {
      provide: CreatePacienteUseCase,
      useFactory: (
        usuarios: UsuarioManagementRepository,
        passwordHasher: PasswordHasher,
      ) => new CreatePacienteUseCase(usuarios, passwordHasher),
      inject: [USUARIO_MANAGEMENT_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: UpdatePacienteUseCase,
      useFactory: (usuarios: UsuarioManagementRepository) =>
        new UpdatePacienteUseCase(usuarios),
      inject: [USUARIO_MANAGEMENT_REPOSITORY],
    },
    {
      provide: InactivatePacienteUseCase,
      useFactory: (
        usuarios: UsuarioManagementRepository,
        sessions: AuthSessionRepository,
      ) => new InactivatePacienteUseCase(usuarios, sessions),
      inject: [USUARIO_MANAGEMENT_REPOSITORY, AUTH_SESSION_REPOSITORY],
    },
    JwtAuthGuard,
    PermissaoAdministrativaGuard,
  ],
  exports: [
    ACCESS_TOKEN_SERVICE,
    AUTH_SESSION_REPOSITORY,
    USUARIO_REPOSITORY,
    JwtAuthGuard,
    PermissaoAdministrativaGuard,
  ],
})
export class AuthModule {}
