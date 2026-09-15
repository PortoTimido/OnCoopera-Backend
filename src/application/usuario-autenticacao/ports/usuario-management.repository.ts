import type {
  PermissaoAdministrativaNome,
  PublicUsuario,
  StatusUsuario,
  TipoUsuario,
} from '../../../domain/usuario-autenticacao/entities/usuario.entity.js';

export interface EnderecoData {
  id?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
}

export type EnderecoOutput = Required<EnderecoData>;

export interface UsuarioDetails {
  usuario: PublicUsuario;
  endereco: EnderecoOutput | null;
}

export interface PaginatedUsuarios {
  data: PublicUsuario[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListUsuariosInput {
  page: number;
  pageSize: number;
  search?: string;
  tipo?: TipoUsuario;
  status?: StatusUsuario;
  permissao?: PermissaoAdministrativaNome;
}

export interface UsuarioBaseData {
  nome: string;
  email: string;
  login: string;
  telefone: string;
  dataNascimento: Date;
}

export interface CreateAdministradorRepositoryInput extends UsuarioBaseData {
  senhaHash: string;
  permissoesAdministrativas: PermissaoAdministrativaNome[];
  trocaSenhaObrigatoria: boolean;
  senhaTemporariaExpiraEm?: Date;
}

export interface UpdateAdministradorRepositoryInput {
  id: string;
  data: Partial<UsuarioBaseData> & {
    status?: StatusUsuario;
    permissoesAdministrativas?: PermissaoAdministrativaNome[];
  };
}

export interface CreatePacienteRepositoryInput extends UsuarioBaseData {
  senhaHash: string;
  endereco: Omit<EnderecoData, 'id'>;
}

export interface UpdatePacienteRepositoryInput {
  id: string;
  data: Partial<UsuarioBaseData> & {
    status?: StatusUsuario;
    endereco?: Omit<EnderecoData, 'id'>;
  };
}

export interface UsuarioManagementRepository {
  listUsuarios(input: ListUsuariosInput): Promise<PaginatedUsuarios>;
  findUsuarioDetailsById(id: string): Promise<UsuarioDetails | null>;
  createAdministrador(
    input: CreateAdministradorRepositoryInput,
  ): Promise<UsuarioDetails>;
  updateAdministrador(
    input: UpdateAdministradorRepositoryInput,
  ): Promise<UsuarioDetails>;
  createPaciente(input: CreatePacienteRepositoryInput): Promise<UsuarioDetails>;
  updatePaciente(input: UpdatePacienteRepositoryInput): Promise<UsuarioDetails>;
  inactivateUsuario(id: string, inactivatedAt: Date): Promise<void>;
  countActiveTotalAdministratorsExcluding(id?: string): Promise<number>;
}

export const USUARIO_MANAGEMENT_REPOSITORY = Symbol(
  'USUARIO_MANAGEMENT_REPOSITORY',
);
