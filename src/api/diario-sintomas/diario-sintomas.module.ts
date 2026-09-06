import { Module } from '@nestjs/common';
import { DIARIO_SINTOMAS_REPOSITORY, type DiarioSintomasRepository } from '../../application/diario-sintomas/ports/diario-sintomas.repository.js';
import { VOICE_NOTE_STORAGE, type VoiceNoteStorage } from '../../application/diario-sintomas/ports/voice-note.storage.js';
import { GetRegistroDiarioUseCase, GetRegistroHojeUseCase, ListRegistrosDiariosUseCase, SaveRegistroHojeUseCase, UpdateRegistroHojeUseCase } from '../../application/diario-sintomas/use-cases/diario-sintomas.use-cases.js';
import { LocalVoiceNoteStorage } from '../../infrastructure/diario-sintomas/local-voice-note.storage.js';
import { PrismaDiarioSintomasRepository } from '../../infrastructure/diario-sintomas/prisma-diario-sintomas.repository.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AuthModule } from '../usuario-autenticacao/auth.module.js';
import { MobileDiarioSintomasController } from './mobile-diario-sintomas.controller.js';
import { PatientDiarioGuard } from './patient-diario.guard.js';

@Module({
  imports: [AuthModule], controllers: [MobileDiarioSintomasController],
  providers: [
    { provide: DIARIO_SINTOMAS_REPOSITORY, useFactory: (prisma: PrismaService) => new PrismaDiarioSintomasRepository(prisma), inject: [PrismaService] },
    { provide: VOICE_NOTE_STORAGE, useFactory: () => new LocalVoiceNoteStorage() },
    { provide: ListRegistrosDiariosUseCase, useFactory: (repository: DiarioSintomasRepository) => new ListRegistrosDiariosUseCase(repository), inject: [DIARIO_SINTOMAS_REPOSITORY] },
    { provide: GetRegistroDiarioUseCase, useFactory: (repository: DiarioSintomasRepository) => new GetRegistroDiarioUseCase(repository), inject: [DIARIO_SINTOMAS_REPOSITORY] },
    { provide: GetRegistroHojeUseCase, useFactory: (repository: DiarioSintomasRepository) => new GetRegistroHojeUseCase(repository), inject: [DIARIO_SINTOMAS_REPOSITORY] },
    { provide: SaveRegistroHojeUseCase, useFactory: (repository: DiarioSintomasRepository, storage: VoiceNoteStorage) => new SaveRegistroHojeUseCase(repository, storage), inject: [DIARIO_SINTOMAS_REPOSITORY, VOICE_NOTE_STORAGE] },
    { provide: UpdateRegistroHojeUseCase, useFactory: (get: GetRegistroDiarioUseCase, save: SaveRegistroHojeUseCase) => new UpdateRegistroHojeUseCase(get, save), inject: [GetRegistroDiarioUseCase, SaveRegistroHojeUseCase] },
    PatientDiarioGuard,
  ],
})
export class DiarioSintomasModule {}
