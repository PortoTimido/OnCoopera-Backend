import { DataNascimento } from '../value-objects/data-nascimento.value-object.js';
import { Email } from '../value-objects/email.value-object.js';
import { Login } from '../value-objects/login.value-object.js';
import { Nome } from '../value-objects/nome.value-object.js';
import { SenhaHash } from '../value-objects/senha-hash.value-object.js';
import { Telefone } from '../value-objects/telefone.value-object.js';

export type StatusUsuario = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
export type TipoUsuario = 'USUARIO' | 'PACIENTE' | 'ADMINISTRADOR';
export const PERFIL_ADMINISTRATIVO_TOTAL = 'TOTAL';
export const PERFIS_ADMINISTRATIVOS_CONHECIDOS = [
  PERFIL_ADMINISTRATIVO_TOTAL,
  'MODERADOR_DE_CONTEUDO',
  'GERENTE_DE_APOIOS',
  'ANALISTA_DE_INTERACOES',
] as const;
export type PerfilAdministrativoNome =
  (typeof PERFIS_ADMINISTRATIVOS_CONHECIDOS)[number];

export interface PublicUsuario {
  id: string;
  nome: string;
  email: string;
  login: string;
  telefone: string;
  dataNascimento: Date;
  status: StatusUsuario;
  tipo: TipoUsuario;
  perfisAdministrativos: PerfilAdministrativoNome[];
  trocaSenhaObrigatoria: boolean;
  ultimoAcesso: Date | null;
}

export interface UsuarioProps {
  id: string;
  nome: Nome;
  email: Email;
  login: Login;
  senhaHash: SenhaHash;
  telefone: Telefone;
  dataNascimento: DataNascimento;
  status: StatusUsuario;
  tipo: TipoUsuario;
  perfisAdministrativos: PerfilAdministrativoNome[];
  trocaSenhaObrigatoria: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
  ultimoAcesso: Date | null;
}

export class Usuario {
  private readonly props: UsuarioProps;

  private constructor(props: UsuarioProps) {
    this.props = props;
  }

  static create(props: UsuarioProps): Usuario {
    return new Usuario(props);
  }

  get id(): string {
    return this.props.id;
  }

  get senhaHash(): SenhaHash {
    return this.props.senhaHash;
  }

  get status(): StatusUsuario {
    return this.props.status;
  }

  get tipo(): TipoUsuario {
    return this.props.tipo;
  }

  get perfisAdministrativos(): PerfilAdministrativoNome[] {
    return [...this.props.perfisAdministrativos];
  }

  get trocaSenhaObrigatoria(): boolean {
    return this.props.trocaSenhaObrigatoria;
  }

  isActive(): boolean {
    return this.props.status === 'ATIVO';
  }

  hasPerfilAdministrativo(perfil: PerfilAdministrativoNome): boolean {
    return this.props.perfisAdministrativos.includes(perfil);
  }

  alterarSenha(
    novaSenhaHash: SenhaHash,
    changedAt = new Date(),
    trocaSenhaObrigatoria = this.props.trocaSenhaObrigatoria,
  ): Usuario {
    return new Usuario({
      ...this.props,
      senhaHash: novaSenhaHash,
      trocaSenhaObrigatoria,
      dataAtualizacao: changedAt,
    });
  }

  registrarUltimoAcesso(ultimoAcesso: Date): Usuario {
    return new Usuario({
      ...this.props,
      ultimoAcesso,
    });
  }

  toPublic(): PublicUsuario {
    return {
      id: this.props.id,
      nome: this.props.nome.value,
      email: this.props.email.value,
      login: this.props.login.value,
      telefone: this.props.telefone.formatarParaString(),
      dataNascimento: this.props.dataNascimento.value,
      status: this.props.status,
      tipo: this.props.tipo,
      perfisAdministrativos: [...this.props.perfisAdministrativos],
      trocaSenhaObrigatoria: this.props.trocaSenhaObrigatoria,
      ultimoAcesso: this.props.ultimoAcesso,
    };
  }
}
