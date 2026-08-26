import { assertValidPlainPassword } from '../../../domain/usuario-autenticacao/services/password-policy.js';
import { AuthApplicationError } from '../errors/auth-application.error.js';
import type { PasswordHasher } from '../ports/password-hasher.js';
import type { TemporaryPasswordGenerator } from '../ports/temporary-password-generator.js';
import type {
  UsuarioBaseData,
  UsuarioDetails,
  UsuarioManagementRepository,
} from '../ports/usuario-management.repository.js';
import {
  normalizePerfisAdministrativos,
  normalizeUsuarioBaseData,
} from './usuario-data.mapper.js';

export interface CreateAdministradorInput extends UsuarioBaseData {
  perfisAdministrativos: string[];
}

export interface CreateAdministradorOutput {
  usuario: UsuarioDetails['usuario'];
  endereco: null;
  senhaTemporaria: string;
}

export class CreateAdministradorUseCase {
  private readonly usuarios: UsuarioManagementRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly temporaryPasswords: TemporaryPasswordGenerator;

  constructor(
    usuarios: UsuarioManagementRepository,
    passwordHasher: PasswordHasher,
    temporaryPasswords: TemporaryPasswordGenerator,
  ) {
    this.usuarios = usuarios;
    this.passwordHasher = passwordHasher;
    this.temporaryPasswords = temporaryPasswords;
  }

  async execute(
    input: CreateAdministradorInput,
  ): Promise<CreateAdministradorOutput> {
    const usuarioData = normalizeUsuarioBaseData(input);
    const perfisAdministrativos = normalizePerfisAdministrativos(
      input.perfisAdministrativos,
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
      perfisAdministrativos,
      trocaSenhaObrigatoria: true,
    });

    return {
      usuario: created.usuario,
      endereco: null,
      senhaTemporaria,
    };
  }
}
