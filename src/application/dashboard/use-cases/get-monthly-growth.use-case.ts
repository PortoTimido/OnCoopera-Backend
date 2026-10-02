import type {
  DashboardRepository,
  MonthlyCount,
} from '../ports/dashboard.repository.js';

export interface GetMonthlyGrowthUseCaseInput {
  periodMonths: 6 | 12;
  includeArticlesPublished: boolean;
  includeSupportLocations: boolean;
  includeActiveUsers: boolean;
  now?: Date;
}

export interface MonthlyGrowthPoint {
  month: string;
  articlesPublished: number | null;
  supportLocations: number | null;
  activeUsers: number | null;
}

export interface MonthlyGrowthOutput {
  points: MonthlyGrowthPoint[];
}

export class GetMonthlyGrowthUseCase {
  constructor(private readonly dashboard: DashboardRepository) {}

  async execute(
    input: GetMonthlyGrowthUseCaseInput,
  ): Promise<MonthlyGrowthOutput> {
    const endExclusive = startOfCurrentMonthUtc(input.now ?? new Date());
    const series = await this.dashboard.getMonthlyGrowth({
      endExclusive,
      includeArticlesPublished: input.includeArticlesPublished,
      includeSupportLocations: input.includeSupportLocations,
      includeActiveUsers: input.includeActiveUsers,
    });
    const months = previousCompleteMonths(endExclusive, input.periodMonths);

    return {
      points: months.map((month) => ({
        month,
        articlesPublished: accumulateUntil(month, series.articlesPublished),
        supportLocations: accumulateUntil(month, series.supportLocations),
        activeUsers: accumulateUntil(month, series.activeUsers),
      })),
    };
  }
}

function startOfCurrentMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function previousCompleteMonths(
  endExclusive: Date,
  periodMonths: number,
): string[] {
  return Array.from({ length: periodMonths }, (_, index) => {
    const offset = periodMonths - index;
    const date = new Date(
      Date.UTC(
        endExclusive.getUTCFullYear(),
        endExclusive.getUTCMonth() - offset,
        1,
      ),
    );
    return date.toISOString().slice(0, 7);
  });
}

function accumulateUntil(
  month: string,
  counts: MonthlyCount[] | null,
): number | null {
  if (counts === null) return null;

  return counts.reduce(
    (total, event) => (event.month <= month ? total + event.count : total),
    0,
  );
}
