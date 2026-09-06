import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Put, Query, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiConflictResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { GetRegistroDiarioUseCase, GetRegistroHojeUseCase, ListRegistrosDiariosUseCase, SaveRegistroHojeUseCase, UpdateRegistroHojeUseCase } from '../../application/diario-sintomas/use-cases/diario-sintomas.use-cases.js';
import { VOICE_NOTE_STORAGE, type VoiceNoteStorage } from '../../application/diario-sintomas/ports/voice-note.storage.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import type { AuthenticatedRequest } from '../usuario-autenticacao/auth.request.js';
import { mapDiarioSintomasError } from './diario-sintomas-error.mapper.js';
import { listDiarioQuerySchema, saveDiarioSchema, type ListDiarioQuery, type SaveDiarioRequestBody } from './diario-sintomas.schemas.js';
import { ErrorSwaggerResponseDto, PaginatedRegistrosDiariosSwaggerDto, RegistroDiarioSwaggerDto } from './diario-sintomas.swagger.js';
import { PatientDiarioGuard } from './patient-diario.guard.js';
import { Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../usuario-autenticacao/jwt-auth.guard.js';

const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav'];
const voiceNoteInterceptor = FileInterceptor('notaVoz', { limits: { fileSize: MAX_AUDIO_SIZE, files: 1 }, fileFilter: (_request, file, callback) => callback(ALLOWED_AUDIO_TYPES.includes(file.mimetype) ? null : new BadRequestException('Formato de áudio inválido.'), ALLOWED_AUDIO_TYPES.includes(file.mimetype)) });
type UploadedVoiceNote = { buffer: Buffer; mimetype: string };

@ApiTags('Mobile - Diário de Sintomas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PatientDiarioGuard)
@Controller('v1/mobile/diario-sintomas')
export class MobileDiarioSintomasController {
  constructor(
    private readonly listRegistros: ListRegistrosDiariosUseCase,
    private readonly getRegistro: GetRegistroDiarioUseCase,
    private readonly getHoje: GetRegistroHojeUseCase,
    private readonly saveHoje: SaveRegistroHojeUseCase,
    private readonly updateHoje: UpdateRegistroHojeUseCase,
    @Inject(VOICE_NOTE_STORAGE) private readonly storage: VoiceNoteStorage,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar histórico próprio de sintomas' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiOkResponse({ type: PaginatedRegistrosDiariosSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  list(@Req() request: AuthenticatedRequest, @Query(new ZodValidationPipe(listDiarioQuerySchema)) query: ListDiarioQuery) { return this.listRegistros.execute(patientId(request), query.page, query.pageSize); }

  @Get('hoje')
  @ApiOperation({ summary: 'Consultar o registro do dia atual' })
  @ApiOkResponse({ type: RegistroDiarioSwaggerDto })
  getToday(@Req() request: AuthenticatedRequest) { return this.getHoje.execute(patientId(request)); }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar registro próprio por ID' })
  @ApiOkResponse({ type: RegistroDiarioSwaggerDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async getById(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string) { try { return await this.getRegistro.execute(patientId(request), id); } catch (error) { throw mapDiarioSintomasError(error); } }

  @Put('hoje')
  @UseInterceptors(voiceNoteInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Criar ou substituir o registro do dia atual' })
  @ApiBody({ schema: { type: 'object', required: ['humor', 'sintomas'], properties: { humor: { type: 'string', enum: ['MUITO_BEM', 'BEM', 'NEUTRO', 'MAL', 'MUITO_MAL'] }, sintomas: { type: 'string', description: 'JSON de sintomas.' }, notaVoz: { type: 'string', format: 'binary' }, removerNotaVoz: { type: 'boolean' } } } })
  @ApiOkResponse({ type: RegistroDiarioSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  async save(@Req() request: AuthenticatedRequest, @Body(new ZodValidationPipe(saveDiarioSchema)) body: SaveDiarioRequestBody, @UploadedFile() file?: UploadedVoiceNote) {
    try { return await this.saveHoje.execute(patientId(request), { ...body, notaVoz: file === undefined ? undefined : { buffer: file.buffer, mimetype: file.mimetype } }); } catch (error) { throw mapDiarioSintomasError(error); }
  }

  @Patch(':id')
  @UseInterceptors(voiceNoteInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Editar o registro do dia atual' })
  @ApiBody({ schema: { type: 'object', required: ['humor', 'sintomas'], properties: { humor: { type: 'string' }, sintomas: { type: 'string', description: 'JSON de sintomas.' }, notaVoz: { type: 'string', format: 'binary' }, removerNotaVoz: { type: 'boolean' } } } })
  @ApiOkResponse({ type: RegistroDiarioSwaggerDto })
  @ApiConflictResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async update(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Body(new ZodValidationPipe(saveDiarioSchema)) body: SaveDiarioRequestBody, @UploadedFile() file?: UploadedVoiceNote) {
    try { return await this.updateHoje.execute(patientId(request), id, { ...body, notaVoz: file === undefined ? undefined : { buffer: file.buffer, mimetype: file.mimetype } }); } catch (error) { throw mapDiarioSintomasError(error); }
  }

  @Get(':id/nota-voz')
  @ApiOperation({ summary: 'Reproduzir nota de voz própria' })
  @ApiOkResponse({ description: 'Arquivo de áudio.' })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async voiceNote(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe()) id: string, @Res({ passthrough: true }) response: Response): Promise<StreamableFile> {
    try {
      const registro = await this.getRegistro.execute(patientId(request), id);
      if (registro.notaVozUrl === null) throw new BadRequestException('Registro não possui nota de voz.');
      const content = await this.storage.read(registro.notaVozUrl);
      response.setHeader('Content-Type', contentType(registro.notaVozUrl));
      return new StreamableFile(content);
    } catch (error) { throw mapDiarioSintomasError(error); }
  }
}
function patientId(request: AuthenticatedRequest): string { if (request.auth === undefined) throw new BadRequestException('Contexto autenticado ausente.'); return request.auth.usuarioId; }
function contentType(key: string): string { if (key.endsWith('.mp3')) return 'audio/mpeg'; if (key.endsWith('.m4a')) return 'audio/mp4'; return 'audio/wav'; }
