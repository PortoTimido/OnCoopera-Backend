import { DomainValidationError } from '../errors/domain-validation.error.js';

export const TIPOS_APOIO = ['ONG', 'CLINICA', 'TRANSPORTE', 'CASA_APOIO', 'PSICOLOGO'] as const;
export const STATUS_APOIO = ['RASCUNHO', 'ATIVO', 'DESATIVADO'] as const;
export type TipoApoio = (typeof TIPOS_APOIO)[number];
export type StatusApoio = (typeof STATUS_APOIO)[number];
export interface EnderecoApoio { id?: string; cep: string; logradouro: string; numero: string; complemento: string | null; bairro: string; cidade: string; estado: string; latitude: number; longitude: number; }
export interface HorarioApoio { diaSemana: number; horarioInicio: string; horarioFim: string; }
export interface PublicApoio { id: string; nome: string; tipoApoio: TipoApoio; telefone: string; descricao: string | null; status: StatusApoio; endereco: EnderecoApoio; horarios: HorarioApoio[]; imagensUrl: string[]; dataCriacao: Date; dataAtualizacao: Date; estaAbertoAgora: boolean; distanciaKm?: number; }

export function validateHorarios(horarios: HorarioApoio[]): void {
  const byDay = new Map<number, HorarioApoio[]>();
  for (const horario of horarios) {
    if (!Number.isInteger(horario.diaSemana) || horario.diaSemana < 0 || horario.diaSemana > 6) throw new DomainValidationError('Dia da semana invalido.');
    if (!/^\d{2}:\d{2}$/.test(horario.horarioInicio) || !/^\d{2}:\d{2}$/.test(horario.horarioFim) || horario.horarioInicio >= horario.horarioFim) throw new DomainValidationError('Intervalo de horario invalido.');
    byDay.set(horario.diaSemana, [...(byDay.get(horario.diaSemana) ?? []), horario]);
  }
  for (const intervals of byDay.values()) {
    const ordered = [...intervals].sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));
    for (let index = 1; index < ordered.length; index += 1) if (ordered[index - 1]!.horarioFim > ordered[index]!.horarioInicio) throw new DomainValidationError('Horarios do mesmo dia nao podem se sobrepor.');
  }
}

export function isOpenNow(horarios: HorarioApoio[], now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday ?? '');
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  const time = `${hour}:${minute}`;
  return horarios.some((item) => item.diaSemana === day && item.horarioInicio <= time && time < item.horarioFim);
}
