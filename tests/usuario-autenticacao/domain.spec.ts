import { test } from '@japa/runner';
import { Usuario } from '../../src/domain/usuario-autenticacao/entities/usuario.entity.js';
import { DataNascimento } from '../../src/domain/usuario-autenticacao/value-objects/data-nascimento.value-object.js';
import { Email } from '../../src/domain/usuario-autenticacao/value-objects/email.value-object.js';
import { Login } from '../../src/domain/usuario-autenticacao/value-objects/login.value-object.js';
import { Nome } from '../../src/domain/usuario-autenticacao/value-objects/nome.value-object.js';
import { SenhaHash } from '../../src/domain/usuario-autenticacao/value-objects/senha-hash.value-object.js';
import { Telefone } from '../../src/domain/usuario-autenticacao/value-objects/telefone.value-object.js';
import { assertRemainingTotalAdministrator } from '../../src/domain/usuario-autenticacao/services/admin-full-permission-policy.js';
import { assertValidPlainPassword } from '../../src/domain/usuario-autenticacao/services/password-policy.js';
import { SecureTemporaryPasswordGenerator } from '../../src/infrastructure/usuario-autenticacao/secure-temporary-password-generator.js';

test.group('usuario-autenticacao domain', () => {
  test('aceita objetos de valor válidos', ({ assert }) => {
    assert.equal(Email.create('USER@Example.com').value, 'user@example.com');
    assert.equal(Login.create('user.name_1').value, 'user.name_1');
    assert.equal(Nome.create('  Maria   Silva ').value, 'Maria Silva');
    assert.equal(SenhaHash.create('hashed-password').value, 'hashed-password');
    assert.equal(
      Telefone.fromString('(11) 99999-8888').formatarParaString(),
      '11999998888',
    );
    assert.equal(
      DataNascimento.create(
        new Date('1990-05-20T00:00:00.000Z'),
      ).formatarDDMMAAAA(),
      '20051990',
    );
  });

  test('rejeita objetos de valor inválidos', ({ assert }) => {
    assert.equal(
      throwsSync(() => Email.create('invalid')),
      true,
    );
    assert.equal(
      throwsSync(() => Login.create('u!')),
      true,
    );
    assert.equal(
      throwsSync(() => Nome.create(' ')),
      true,
    );
    assert.equal(
      throwsSync(() => SenhaHash.create('short')),
      true,
    );
    assert.equal(
      throwsSync(() => Telefone.fromString('123')),
      true,
    );
    assert.equal(
      throwsSync(() => DataNascimento.create(new Date('2999-01-01'))),
      true,
    );
  });

  test('valida política de senha nova', ({ assert }) => {
    assertValidPlainPassword('SenhaForte!123');

    assert.equal(
      throwsSync(() => assertValidPlainPassword('curta')),
      true,
    );
    assert.equal(
      throwsSync(() => assertValidPlainPassword('senhaforte!123')),
      true,
    );
    assert.equal(
      throwsSync(() => assertValidPlainPassword('SENHAFORTE!123')),
      true,
    );
    assert.equal(
      throwsSync(() => assertValidPlainPassword('SenhaForte!!!!')),
      true,
    );
    assert.equal(
      throwsSync(() => assertValidPlainPassword('SenhaForte1234')),
      true,
    );
  });

  test('valida senha temporária gerada contra política', ({ assert }) => {
    const password = new SecureTemporaryPasswordGenerator().generate();

    assert.doesNotThrow(() => assertValidPlainPassword(password));
  });

  test('valida regra de último administrador TOTAL', ({ assert }) => {
    assert.doesNotThrow(() => assertRemainingTotalAdministrator(1));
    assert.equal(
      throwsSync(() => assertRemainingTotalAdministrator(0)),
      true,
    );
  });

  test('paciente não recebe perfis administrativos', ({ assert }) => {
    const paciente = Usuario.create({
      id: 'patient-1',
      nome: Nome.create('Paciente Teste'),
      email: Email.create('paciente@example.com'),
      login: Login.create('paciente.teste'),
      senhaHash: SenhaHash.create('hashed-password'),
      telefone: Telefone.fromString('11999998888'),
      dataNascimento: DataNascimento.create(
        new Date('1990-05-20T00:00:00.000Z'),
      ),
      status: 'ATIVO',
      tipo: 'PACIENTE',
      perfisAdministrativos: [],
      trocaSenhaObrigatoria: false,
      dataCriacao: new Date('2026-01-01T00:00:00.000Z'),
      dataAtualizacao: new Date('2026-01-01T00:00:00.000Z'),
      ultimoAcesso: null,
    });

    assert.equal(paciente.toPublic().tipo, 'PACIENTE');
    assert.deepEqual(paciente.toPublic().perfisAdministrativos, []);
  });
});

function throwsSync(fn: () => void): boolean {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}
