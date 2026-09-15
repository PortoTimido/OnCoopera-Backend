import type { EmailProvider } from './email-provider.js';

export interface EmailAuditRepository {
  create(input: {
    tipo: string;
    destinatarioMascarado: string;
  }): Promise<string>;
  update(
    id: string,
    input: {
      status: 'ENVIADO' | 'FALHOU';
      tentativas: number;
      erroCodigo?: string;
    },
  ): Promise<void>;
}

export class EmailService {
  constructor(
    private readonly provider: EmailProvider,
    private readonly audits: EmailAuditRepository,
  ) {}

  async send(input: {
    tipo: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<'ENVIADO' | 'FALHOU'> {
    const auditId = await this.audits.create({
      tipo: input.tipo,
      destinatarioMascarado: maskEmail(input.to),
    });
    let attempts = 0;
    let lastError: unknown;
    for (const delay of [0, 1000, 3000]) {
      if (delay > 0)
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      attempts += 1;
      try {
        await this.provider.send(input);
        await this.audits.update(auditId, {
          status: 'ENVIADO',
          tentativas: attempts,
        });
        return 'ENVIADO';
      } catch (error) {
        lastError = error;
      }
    }
    await this.audits.update(auditId, {
      status: 'FALHOU',
      tentativas: attempts,
      erroCodigo: sanitizeError(lastError),
    });
    return 'FALHOU';
  }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (domain === undefined) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error && /^E[A-Z0-9_]+$/.test(error.name))
    return error.name.slice(0, 80);
  return 'SMTP_SEND_FAILED';
}

export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');
