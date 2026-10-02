import type {
  DashboardRepository,
  GetMonthlyGrowthInput,
  MonthlyCount,
  MonthlyGrowthSeries,
} from '../../application/dashboard/ports/dashboard.repository.js';
import { PrismaService } from '../database/prisma.service.js';

interface MonthlyCountRow {
  month: string;
  count: bigint;
}

export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyGrowth(
    input: GetMonthlyGrowthInput,
  ): Promise<MonthlyGrowthSeries> {
    const [articlesPublished, supportLocations, activeUsers] =
      await Promise.all([
        input.includeArticlesPublished
          ? this.listPublishedArticlesByMonth(input.endExclusive)
          : Promise.resolve(null),
        input.includeSupportLocations
          ? this.listActiveSupportLocationsByMonth(input.endExclusive)
          : Promise.resolve(null),
        input.includeActiveUsers
          ? this.listActiveUsersByMonth(input.endExclusive)
          : Promise.resolve(null),
      ]);

    return { articlesPublished, supportLocations, activeUsers };
  }

  private async listPublishedArticlesByMonth(
    endExclusive: Date,
  ): Promise<MonthlyCount[]> {
    const rows = await this.prisma.$queryRaw<MonthlyCountRow[]>`
      SELECT
        to_char(date_trunc('month', "data_publicacao" AT TIME ZONE 'UTC'), 'YYYY-MM') AS "month",
        COUNT(*)::bigint AS "count"
      FROM "artigo"
      WHERE "status" = 'PUBLICADO'
        AND "data_publicacao" IS NOT NULL
        AND "data_publicacao" < (${endExclusive}::timestamptz AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1
    `;
    return toMonthlyCounts(rows);
  }

  private async listActiveSupportLocationsByMonth(
    endExclusive: Date,
  ): Promise<MonthlyCount[]> {
    const rows = await this.prisma.$queryRaw<MonthlyCountRow[]>`
      SELECT
        to_char(date_trunc('month', "data_criacao" AT TIME ZONE 'UTC'), 'YYYY-MM') AS "month",
        COUNT(*)::bigint AS "count"
      FROM "apoio"
      WHERE "status_administrativo" = 'ATIVO'
        AND "data_criacao" < (${endExclusive}::timestamptz AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1
    `;
    return toMonthlyCounts(rows);
  }

  private async listActiveUsersByMonth(
    endExclusive: Date,
  ): Promise<MonthlyCount[]> {
    const rows = await this.prisma.$queryRaw<MonthlyCountRow[]>`
      SELECT
        to_char(date_trunc('month', "data_criacao" AT TIME ZONE 'UTC'), 'YYYY-MM') AS "month",
        COUNT(*)::bigint AS "count"
      FROM "usuario"
      WHERE "status" = 'ATIVO'
        AND "data_criacao" < (${endExclusive}::timestamptz AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1
    `;
    return toMonthlyCounts(rows);
  }
}

function toMonthlyCounts(rows: MonthlyCountRow[]): MonthlyCount[] {
  return rows.map((row) => ({ month: row.month, count: Number(row.count) }));
}
