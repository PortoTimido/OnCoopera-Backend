import { assertValidPlainPassword } from '../../../domain/usuario-autenticacao/services/password-policy.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { TemporaryPasswordGenerator } from '../ports/temporary-password-generator.js';
import type { EmailService } from '../../email/email.service.js';
import type { AuthConfig } from '../ports/auth-config.js';
import { adminTemporaryPasswordTemplate } from '../../../infrastructure/email/templates.js';
import type {
  UsuarioBaseData,
  UsuarioDetails,
  UsuarioManagementRepository,
} from '../ports/usuario-management.repository.js';
import {
  normalizePermissoesAdministrativas,
  normalizeUsuarioBaseData,
} from './usuario-data.mapper.js';

export interface CreateAdministradorInput extends UsuarioBaseData {
  permissoesAdministrativas: string[];
}

export interface CreateAdministradorOutput {
  usuario: UsuarioDetails['usuario'];
  endereco: null;
  senhaTemporaria: string;
  emailEnvio: 'ENVIADO' | 'FALHOU';
}

export class CreateAdministradorUseCase {
  private readonly usuarios: UsuarioManagementRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly temporaryPasswords: TemporaryPasswordGenerator;
  private readonly email: EmailService;
  private readonly config: AuthConfig;

  constructor(
    usuarios: UsuarioManagementRepository,
    passwordHasher: PasswordHasher,
    temporaryPasswords: TemporaryPasswordGenerator,
    email?: EmailService,
    config?: AuthConfig,
  ) {
    this.usuarios = usuarios;
    this.passwordHasher = passwordHasher;
    this.temporaryPasswords = temporaryPasswords;
    this.email =
      email ??
      ({ send: () => Promise.resolve('FALHOU') } as unknown as EmailService);
    this.config = config ?? ({ temporaryPasswordTtlHours: 24 } as AuthConfig);
  }

  async execute(
    input: CreateAdministradorInput,
  ): Promise<CreateAdministradorOutput> {
    const usuarioData = normalizeUsuarioBaseData(input);
    const permissoesAdministrativas = normalizePermissoesAdministrativas(
      input.permissoesAdministrativas,
    );
    const senhaTemporaria = this.temporaryPasswords.generate();

    try {
      assertValidPlainPassword(senhaTemporaria);
    } catch {
      throw new AuthApplicationError(
        'INVALID_PASSWORD_POLICY',
        'Senha temporária gerada fora da política.',
      );
    }

    const senhaHash = await this.passwordHasher.hash(senhaTemporaria);
    const created = await this.usuarios.createAdministrador({
      ...usuarioData,
      senhaHash,
      permissoesAdministrativas,
      trocaSenhaObrigatoria: true,
      senhaTemporariaExpiraEm: new Date(
        Date.now() + this.config.temporaryPasswordTtlHours * 3_600_000,
      ),
    });

    const template = adminTemporaryPasswordTemplate({
      nome: created.usuario.nome,
      email: created.usuario.email,
      senha: senhaTemporaria,
      ttlHours: this.config.temporaryPasswordTtlHours,
    });
    const emailEnvio = await this.email.send({
      tipo: 'ACESSO_TEMPORARIO_ADMINISTRADOR',
      to: created.usuario.email,
      ...template,
    });

    return {
      usuario: created.usuario,
      endereco: null,
      senhaTemporaria,
      emailEnvio,
    };
  }
}
