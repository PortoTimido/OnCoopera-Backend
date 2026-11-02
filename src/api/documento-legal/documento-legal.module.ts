import { Module } from '@nestjs/common';
import {
  DOCUMENTO_LEGAL_REPOSITORY,
  type DocumentoLegalRepository,
} from '../../application/documento-legal/ports/documento-legal.repository.js';
import {
  CreateDocumentoLegalUseCase,
  GetDocumentoLegalUseCase,
  UpdateDocumentoLegalUseCase,
} from '../../application/documento-legal/use-cases/documento-legal.use-cases.js';
import { PrismaDocumentoLegalRepository } from '../../infrastructure/documento-legal/prisma-documento-legal.repository.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AuthModule } from '../usuario-autenticacao/auth.module.js';
import { BackofficeDocumentosLegaisController } from './backoffice-documentos-legais.controller.js';
import { MobileDocumentosLegaisController } from './mobile-documentos-legais.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [
    BackofficeDocumentosLegaisController,
    MobileDocumentosLegaisController,
  ],
  providers: [
    {
      provide: DOCUMENTO_LEGAL_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaDocumentoLegalRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: GetDocumentoLegalUseCase,
      useFactory: (repository: DocumentoLegalRepository) =>
        new GetDocumentoLegalUseCase(repository),
      inject: [DOCUMENTO_LEGAL_REPOSITORY],
    },
    {
      provide: CreateDocumentoLegalUseCase,
      useFactory: (repository: DocumentoLegalRepository) =>
        new CreateDocumentoLegalUseCase(repository),
      inject: [DOCUMENTO_LEGAL_REPOSITORY],
    },
    {
      provide: UpdateDocumentoLegalUseCase,
      useFactory: (repository: DocumentoLegalRepository) =>
        new UpdateDocumentoLegalUseCase(repository),
      inject: [DOCUMENTO_LEGAL_REPOSITORY],
    },
  ],
})
export class DocumentoLegalModule {}
