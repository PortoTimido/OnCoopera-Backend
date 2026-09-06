import { Module } from '@nestjs/common';
import {
  APOIO_REPOSITORY,
  type ApoioRepository,
} from '../../application/radar-apoio/ports/apoio.repository.js';
import {
  CreateApoioUseCase,
  DeactivateApoioUseCase,
  GetApoioUseCase,
  ListApoiosUseCase,
  UpdateApoioUseCase,
} from '../../application/radar-apoio/use-cases/apoio.use-cases.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { PrismaApoioRepository } from '../../infrastructure/radar-apoio/prisma-apoio.repository.js';
import { AuthModule } from '../usuario-autenticacao/auth.module.js';
import { ApoioManagementGuard } from './apoio-management.guard.js';
import { BackofficeApoiosController } from './backoffice-apoios.controller.js';
import { MobileApoiosController } from './mobile-apoios.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [BackofficeApoiosController, MobileApoiosController],
  providers: [
    {
      provide: APOIO_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaApoioRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListApoiosUseCase,
      useFactory: (apoios: ApoioRepository) => new ListApoiosUseCase(apoios),
      inject: [APOIO_REPOSITORY],
    },
    {
      provide: GetApoioUseCase,
      useFactory: (apoios: ApoioRepository) => new GetApoioUseCase(apoios),
      inject: [APOIO_REPOSITORY],
    },
    {
      provide: CreateApoioUseCase,
      useFactory: (apoios: ApoioRepository) => new CreateApoioUseCase(apoios),
      inject: [APOIO_REPOSITORY],
    },
    {
      provide: UpdateApoioUseCase,
      useFactory: (apoios: ApoioRepository) => new UpdateApoioUseCase(apoios),
      inject: [APOIO_REPOSITORY],
    },
    {
      provide: DeactivateApoioUseCase,
      useFactory: (apoios: ApoioRepository) =>
        new DeactivateApoioUseCase(apoios),
      inject: [APOIO_REPOSITORY],
    },
    ApoioManagementGuard,
  ],
})
export class RadarApoioModule {}
