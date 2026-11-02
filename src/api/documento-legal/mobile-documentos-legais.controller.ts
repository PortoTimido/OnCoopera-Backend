import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetDocumentoLegalUseCase } from '../../application/documento-legal/use-cases/documento-legal.use-cases.js';
import type { TipoDocumentoLegal } from '../../domain/documento-legal/documento-legal.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { mapDocumentoLegalError } from './documento-legal-error.mapper.js';
import { tipoDocumentoLegalSchema } from './documento-legal.schemas.js';
import {
  DocumentoLegalSwaggerDto,
  ErrorSwaggerResponseDto,
} from './documento-legal.swagger.js';

@ApiTags('Mobile - Documentos legais')
@Controller('mobile/documentos-legais')
export class MobileDocumentosLegaisController {
  constructor(private readonly getDocumento: GetDocumentoLegalUseCase) {}

  @Get(':tipo')
  @ApiOperation({ summary: 'Consultar documento legal por tipo' })
  @ApiOkResponse({ type: DocumentoLegalSwaggerDto })
  @ApiBadRequestResponse({ type: ErrorSwaggerResponseDto })
  @ApiNotFoundResponse({ type: ErrorSwaggerResponseDto })
  async getByTipo(
    @Param('tipo', new ZodValidationPipe(tipoDocumentoLegalSchema))
    tipo: TipoDocumentoLegal,
  ) {
    try {
      return await this.getDocumento.execute(tipo);
    } catch (error) {
      throw mapDocumentoLegalError(error);
    }
  }
}
