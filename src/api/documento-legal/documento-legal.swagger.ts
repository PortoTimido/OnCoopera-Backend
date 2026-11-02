import { ApiProperty } from '@nestjs/swagger';

export class DocumentoLegalSwaggerDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['TERMOS_USO', 'POLITICA_PRIVACIDADE'] })
  tipo!: string;

  @ApiProperty({ example: '1.0' })
  versao!: string;

  @ApiProperty({ example: 'Conteúdo completo do documento legal.' })
  conteudo!: string;

  @ApiProperty({ format: 'date-time' })
  atualizadoEm!: Date;
}

export class CreateDocumentoLegalSwaggerRequestDto {
  @ApiProperty({ enum: ['TERMOS_USO', 'POLITICA_PRIVACIDADE'] })
  tipo!: string;

  @ApiProperty({ example: 'Conteúdo completo dos termos de uso.' })
  conteudo!: string;
}

export class UpdateDocumentoLegalSwaggerRequestDto {
  @ApiProperty({ example: 'Conteúdo atualizado dos termos de uso.' })
  conteudo!: string;
}

export class ErrorSwaggerResponseDto {
  @ApiProperty({ example: 'Mensagem de erro.' })
  message!: string;
}
