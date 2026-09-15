import { DataNascimento } from '../value-objects/data-nascimento.value-object.js';
import { Email } from '../value-objects/email.value-object.js';
import { Login } from '../value-objects/login.value-object.js';
import { Nome } from '../value-objects/nome.value-object.js';
import { SenhaHash } from '../value-objects/senha-hash.value-object.js';
import { Telefone } from '../value-objects/telefone.value-object.js';

export type StatusUsuario = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
export type TipoUsuario = 'USUARIO' | 'PACIENTE' | 'ADMINISTRADOR';
export const PERMISSAO_ADMINISTRATIVA_TOTAL = 'TOTAL';
export const PERMISSOES_ADMINISTRATIVAS_CONHECIDAS = [
  PERMISSAO_ADMINISTRATIVA_TOTAL,
  'GERENCIAR_USUARIOS',
  'GESTAO_CONTEUDOS',
  'GESTAO_RADAR_APOIO',
] as const;
export type PermissaoAdministrativaNome =
  (typeof PERMISSOES_ADMINISTRATIVAS_CONHECIDAS)[number];

export interface PublicUsuario {
  id: string;
  nome: string;
  email: string;
  login: string;
  telefone: string;
  dataNascimento: Date;
  status: StatusUsuario;
  tipo: TipoUsuario;
  permissoesAdministrativas: PermissaoAdministrativaNome[];
  /**
   * @deprecated Mantido apenas para compatibilidade de resposta durante a
   * transição do modelo de perfis administrativos. Não é utilizado para
   * autorização; sempre espelha `permissoesAdministrativas`.
   */
  perfisAdministrativos: PermissaoAdministrativaNome[];
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
  permissoesAdministrativas: PermissaoAdministrativaNome[];
  trocaSenhaObrigatoria: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
  ultimoAcesso: Date | null;
  senhaTemporariaExpiraEm?: Date | null;
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

  get email(): string { return this.props.email.value; }
  get nome(): string { return this.props.nome.value; }

  get status(): StatusUsuario {
    return this.props.status;
  }

  get tipo(): TipoUsuario {
    return this.props.tipo;
  }

  get permissoesAdministrativas(): PermissaoAdministrativaNome[] {
    return [...this.props.permissoesAdministrativas];
  }

  get trocaSenhaObrigatoria(): boolean {
    return this.props.trocaSenhaObrigatoria;
  }

  get senhaTemporariaExpiraEm(): Date | null {
    return this.props.senhaTemporariaExpiraEm ?? null;
  }

  isActive(): boolean {
    return this.props.status === 'ATIVO';
  }

  hasPermissaoAdministrativa(permissao: PermissaoAdministrativaNome): boolean {
    return (
      this.props.permissoesAdministrativas.includes(
        PERMISSAO_ADMINISTRATIVA_TOTAL,
      ) || this.props.permissoesAdministrativas.includes(permissao)
    );
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

  atualizarDadosPessoais(
    data: {
      nome?: Nome;
      email?: Email;
      telefone?: Telefone;
      dataNascimento?: DataNascimento;
    },
    changedAt = new Date(),
  ): Usuario {
    return new Usuario({
      ...this.props,
      ...(data.nome !== undefined ? { nome: data.nome } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.telefone !== undefined ? { telefone: data.telefone } : {}),
      ...(data.dataNascimento !== undefined
        ? { dataNascimento: data.dataNascimento }
        : {}),
      dataAtualizacao: changedAt,
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
      permissoesAdministrativas: [...this.props.permissoesAdministrativas],
      perfisAdministrativos: [...this.props.permissoesAdministrativas],
      trocaSenhaObrigatoria: this.props.trocaSenhaObrigatoria,
      ultimoAcesso: this.props.ultimoAcesso,
    };
  }
}
