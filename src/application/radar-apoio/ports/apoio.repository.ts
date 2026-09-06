import type {
  EnderecoApoio,
  HorarioApoio,
  PublicApoio,
  StatusApoio,
  TipoApoio,
} from '../../../domain/radar-apoio/entities/apoio.entity.js';
export const APOIO_REPOSITORY = Symbol('APOIO_REPOSITORY');
export interface ApoioWriteInput {
  nome: string;
  tipoApoio: TipoApoio;
  telefone: string;
  descricao: string | null;
  status: StatusApoio;
  endereco: EnderecoApoio;
  horarios: HorarioApoio[];
  imagensUrl: string[];
}
export interface ListApoiosInput {
  page: number;
  pageSize: number;
  search?: string;
  tipoApoio?: TipoApoio;
  status?: StatusApoio;
  cidade?: string;
  latitude?: number;
  longitude?: number;
  onlyActive?: boolean;
}
export interface PaginatedApoios {
  data: PublicApoio[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface ApoioRepository {
  list(input: ListApoiosInput): Promise<PaginatedApoios>;
  findById(id: string, onlyActive?: boolean): Promise<PublicApoio | null>;
  create(input: ApoioWriteInput): Promise<PublicApoio>;
  update(id: string, input: Partial<ApoioWriteInput>): Promise<PublicApoio>;
  deactivate(id: string): Promise<void>;
}
