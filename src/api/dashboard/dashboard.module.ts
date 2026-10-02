import { Module } from '@nestjs/common';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepository,
} from '../../application/dashboard/ports/dashboard.repository.js';
import { GetMonthlyGrowthUseCase } from '../../application/dashboard/use-cases/get-monthly-growth.use-case.js';
import { PrismaDashboardRepository } from '../../infrastructure/dashboard/prisma-dashboard.repository.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AuthModule } from '../usuario-autenticacao/auth.module.js';
import { BackofficeDashboardController } from './backoffice-dashboard.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [BackofficeDashboardController],
  providers: [
    {
      provide: DASHBOARD_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaDashboardRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: GetMonthlyGrowthUseCase,
      useFactory: (dashboard: DashboardRepository) =>
        new GetMonthlyGrowthUseCase(dashboard),
      inject: [DASHBOARD_REPOSITORY],
    },
  ],
})
export class DashboardModule {}
