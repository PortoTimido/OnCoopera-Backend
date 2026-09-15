import { Module } from '@nestjs/common';
import { EMAIL_PROVIDER } from '../../application/email/email-provider.js';
import {
  EMAIL_SERVICE,
  EmailService,
} from '../../application/email/email.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { PrismaService } from '../database/prisma.service.js';
import { PrismaEmailAuditRepository } from './email-audit.repository.js';
import { createEmailConfig, SmtpEmailProvider } from './smtp-email.provider.js';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useFactory: () => new SmtpEmailProvider(createEmailConfig(process.env)),
    },
    {
      provide: EMAIL_SERVICE,
      useFactory: (provider, prisma: PrismaService) =>
        new EmailService(provider, new PrismaEmailAuditRepository(prisma)),
      inject: [EMAIL_PROVIDER, PrismaService],
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
