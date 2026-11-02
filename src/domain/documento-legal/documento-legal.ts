export const TIPOS_DOCUMENTO_LEGAL = [
  'TERMOS_USO',
  'POLITICA_PRIVACIDADE',
] as const;

export type TipoDocumentoLegal = (typeof TIPOS_DOCUMENTO_LEGAL)[number];

export interface PublicDocumentoLegal {
  id: string;
  tipo: TipoDocumentoLegal;
  versao: string;
  conteudo: string;
  atualizadoEm: Date;
}

export function proximaVersaoDocumentoLegal(versaoAtual: string): string {
  const match = /^(\d+)\.(\d)$/.exec(versaoAtual);

  if (match === null) {
    throw new Error('Versão de documento legal inválida.');
  }

  const parteInteira = Number(match[1]);
  const decimal = Number(match[2]);

  if (parteInteira === 999 && decimal === 9) {
    throw new Error('Limite de versão do documento legal atingido.');
  }

  if (decimal === 9) return `${parteInteira + 1}.0`;
  return `${parteInteira}.${decimal + 1}`;
}
