export const DASHBOARD_REPOSITORY = Symbol('DASHBOARD_REPOSITORY');

export interface MonthlyCount {
  month: string;
  count: number;
}

export interface MonthlyGrowthSeries {
  articlesPublished: MonthlyCount[] | null;
  supportLocations: MonthlyCount[] | null;
  activeUsers: MonthlyCount[] | null;
}

export interface GetMonthlyGrowthInput {
  endExclusive: Date;
  includeArticlesPublished: boolean;
  includeSupportLocations: boolean;
  includeActiveUsers: boolean;
}

export interface DashboardRepository {
  getMonthlyGrowth(input: GetMonthlyGrowthInput): Promise<MonthlyGrowthSeries>;
}
