function escape(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[
        char
      ] ?? char,
  );
}
function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#16322f;max-width:600px;margin:auto"><h1 style="color:#16756a">OnCoopera</h1><h2>${escape(title)}</h2>${body}<p>Esta é uma mensagem automática. Não compartilhe suas credenciais.</p></body></html>`;
}
export function passwordRecoveryTemplate(input: {
  nome: string;
  codigo: string;
  ttlMinutes: number;
}) {
  return {
    subject: 'Código para redefinição de senha — OnCoopera',
    html: layout(
      'Redefina sua senha',
      `<p>Olá, ${escape(input.nome)}.</p><p>Seu código é:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${escape(input.codigo)}</p><p>Ele expira em ${input.ttlMinutes} minutos. Ignore esta mensagem caso não tenha solicitado.</p>`,
    ),
    text: `Olá, ${input.nome}. Seu código para redefinição de senha é ${input.codigo}. Ele expira em ${input.ttlMinutes} minutos. Ignore esta mensagem caso não tenha solicitado.`,
  };
}
export function adminTemporaryPasswordTemplate(input: {
  nome: string;
  email: string;
  senha: string;
  ttlHours: number;
}) {
  return {
    subject: 'Seu acesso administrativo ao OnCoopera',
    html: layout(
      'Seu acesso administrativo',
      `<p>Olá, ${escape(input.nome)}.</p><p>Use o e-mail ${escape(input.email)} e a senha temporária abaixo:</p><p style="font-size:22px;font-weight:bold">${escape(input.senha)}</p><p>A senha expira em ${input.ttlHours} horas e deverá ser alterada no primeiro acesso.</p>`,
    ),
    text: `Olá, ${input.nome}. Seu acesso é ${input.email}; senha temporária: ${input.senha}. Ela expira em ${input.ttlHours} horas e deve ser alterada no primeiro acesso.`,
  };
}
