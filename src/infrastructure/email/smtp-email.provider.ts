import nodemailer from 'nodemailer';
import type {
  EmailProvider,
  EmailMessage,
} from '../../application/email/email-provider.js';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
}

export class SmtpEmailProvider implements EmailProvider {
  private readonly transport;
  constructor(private readonly config: EmailConfig) {
    this.transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.username, pass: config.password },
    });
  }
  async send(message: EmailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}

export function createEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const production = env.NODE_ENV === 'production';
  const required = (name: string, fallback = '') => {
    const value = env[name] ?? fallback;
    if (production && value.length === 0)
      throw new Error(`${name} precisa estar definido em produção.`);
    return value;
  };
  return {
    host: required('EMAIL_HOST', 'localhost'),
    port: Number(env.EMAIL_PORT ?? 587),
    secure: env.EMAIL_SECURE === 'true',
    username: required('EMAIL_USERNAME'),
    password: required('EMAIL_PASSWORD'),
    from: `${env.EMAIL_FROM_NAME ?? 'OnCoopera'} <${env.EMAIL_FROM_ADDRESS ?? 'no-reply@oncoopera.com.br'}>`,
  };
}
