import { Module } from '@nestjs/common';
import {
  ARTIGO_REPOSITORY,
  type ArtigoRepository,
} from '../../application/artigo/ports/artigo.repository.js';
import { CreateArtigoUseCase } from '../../application/artigo/use-cases/create-artigo.use-case.js';
import { DeleteArtigoUseCase } from '../../application/artigo/use-cases/delete-artigo.use-case.js';
import { GetArtigoDetailsUseCase } from '../../application/artigo/use-cases/get-artigo-details.use-case.js';
import { GetPublishedArtigoUseCase } from '../../application/artigo/use-cases/get-published-artigo.use-case.js';
import { ListArtigosUseCase } from '../../application/artigo/use-cases/list-artigos.use-case.js';
import { ListPublishedArtigosUseCase } from '../../application/artigo/use-cases/list-published-artigos.use-case.js';
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
import { UpdateArtigoUseCase } from '../../application/artigo/use-cases/update-artigo.use-case.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { PrismaArtigoRepository } from '../../infrastructure/artigo/prisma-artigo.repository.js';
import { AuthModule } from '../usuario-autenticacao/auth.module.js';
import { ArticleContentGuard } from './article-content.guard.js';
import { BackofficeArtigosController } from './backoffice-artigos.controller.js';
import {
  BackofficeArtigoCategoriasController,
  BackofficeArtigoTagsController,
} from './backoffice-artigo-taxonomia.controller.js';
import { MobileArtigosController } from './mobile-artigos.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [
    BackofficeArtigosController,
    BackofficeArtigoCategoriasController,
    BackofficeArtigoTagsController,
    MobileArtigosController,
  ],
  providers: [
    {
      provide: ARTIGO_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaArtigoRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListArtigosUseCase,
      useFactory: (artigos: ArtigoRepository) => new ListArtigosUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: GetArtigoDetailsUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new GetArtigoDetailsUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: CreateArtigoUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new CreateArtigoUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: UpdateArtigoUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new UpdateArtigoUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: DeleteArtigoUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new DeleteArtigoUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: ListPublishedArtigosUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new ListPublishedArtigosUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: GetPublishedArtigoUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new GetPublishedArtigoUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: ListCategoriasUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new ListCategoriasUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: CreateCategoriaUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new CreateCategoriaUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: UpdateCategoriaUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new UpdateCategoriaUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: DeleteCategoriaUseCase,
      useFactory: (artigos: ArtigoRepository) =>
        new DeleteCategoriaUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: ListTagsUseCase,
      useFactory: (artigos: ArtigoRepository) => new ListTagsUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: CreateTagUseCase,
      useFactory: (artigos: ArtigoRepository) => new CreateTagUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: UpdateTagUseCase,
      useFactory: (artigos: ArtigoRepository) => new UpdateTagUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    {
      provide: DeleteTagUseCase,
      useFactory: (artigos: ArtigoRepository) => new DeleteTagUseCase(artigos),
      inject: [ARTIGO_REPOSITORY],
    },
    ArticleContentGuard,
  ],
})
export class ArtigoModule {}
