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
import { BackofficeApoiosController } from './backoffice-apoios.controller.js';
import { MobileApoiosController } from './mobile-apoios.controller.js';
import { ArmazenamentoImagemModule } from '../../infrastructure/armazenamento-imagem/armazenamento-imagem.module.js';
import {
  IMAGE_STORAGE,
  type ImageStorage,
} from '../../application/armazenamento-imagem/image-storage.port.js';
import {
  DeleteApoioImagemUseCase,
  ReplaceApoioImagemUseCase,
  UploadApoioImagemUseCase,
} from '../../application/radar-apoio/use-cases/manage-apoio-imagem.use-cases.js';

@Module({
  imports: [AuthModule, ArmazenamentoImagemModule],
  controllers: [BackofficeApoiosController, MobileApoiosController],
  providers: [
    {
      provide: APOIO_REPOSITORY,
      useFactory: (prisma: PrismaService, storage: ImageStorage) =>
        new PrismaApoioRepository(prisma, storage),
      inject: [PrismaService, IMAGE_STORAGE],
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
      useFactory: (apoios: ApoioRepository, storage: ImageStorage) =>
        new DeactivateApoioUseCase(apoios, storage),
      inject: [APOIO_REPOSITORY, IMAGE_STORAGE],
    },
    {
      provide: UploadApoioImagemUseCase,
      useFactory: (apoios: ApoioRepository, storage: ImageStorage) =>
        new UploadApoioImagemUseCase(apoios, storage),
      inject: [APOIO_REPOSITORY, IMAGE_STORAGE],
    },
    {
      provide: ReplaceApoioImagemUseCase,
      useFactory: (apoios: ApoioRepository, storage: ImageStorage) =>
        new ReplaceApoioImagemUseCase(apoios, storage),
      inject: [APOIO_REPOSITORY, IMAGE_STORAGE],
    },
    {
      provide: DeleteApoioImagemUseCase,
      useFactory: (apoios: ApoioRepository, storage: ImageStorage) =>
        new DeleteApoioImagemUseCase(apoios, storage),
      inject: [APOIO_REPOSITORY, IMAGE_STORAGE],
    },
  ],
})
export class RadarApoioModule {}
