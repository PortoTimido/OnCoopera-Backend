import { test } from '@japa/runner';
import type {
  DashboardRepository,
  GetMonthlyGrowthInput,
  MonthlyGrowthSeries,
} from '../../src/application/dashboard/ports/dashboard.repository.js';
import { GetMonthlyGrowthUseCase } from '../../src/application/dashboard/use-cases/get-monthly-growth.use-case.js';

test.group('dashboard application', () => {
  test('monta seis meses completos em ordem cronológica e acumula eventos', async ({
    assert,
  }) => {
    const dashboard = new InMemoryDashboardRepository({
      articlesPublished: [
        { month: '2025-11', count: 2 },
        { month: '2026-02', count: 3 },
        { month: '2026-04', count: 1 },
      ],
      supportLocations: [{ month: '2026-03', count: 4 }],
      activeUsers: [{ month: '2026-01', count: 10 }],
    });
    const useCase = new GetMonthlyGrowthUseCase(dashboard);

    const output = await useCase.execute({
      periodMonths: 6,
      includeArticlesPublished: true,
      includeSupportLocations: true,
      includeActiveUsers: true,
      now: new Date('2026-07-10T12:00:00.000Z'),
    });

    assert.deepEqual(
      output.points.map((point) => point.month),
      ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'],
    );
    assert.deepEqual(
      output.points.map((point) => point.articlesPublished),
      [2, 5, 5, 6, 6, 6],
    );
    assert.deepEqual(
      output.points.map((point) => point.supportLocations),
      [0, 0, 4, 4, 4, 4],
    );
    assert.deepEqual(
      output.points.map((point) => point.activeUsers),
      [10, 10, 10, 10, 10, 10],
    );
    assert.equal(
      dashboard.lastInput?.endExclusive.toISOString(),
      '2026-07-01T00:00:00.000Z',
    );
  });

  test('monta doze meses e retorna zeros quando não há dados', async ({
    assert,
  }) => {
    const useCase = new GetMonthlyGrowthUseCase(
      new InMemoryDashboardRepository({
        articlesPublished: [],
        supportLocations: [],
        activeUsers: [],
      }),
    );

    const output = await useCase.execute({
      periodMonths: 12,
      includeArticlesPublished: true,
      includeSupportLocations: true,
      includeActiveUsers: true,
      now: new Date('2026-07-10T12:00:00.000Z'),
    });

    assert.equal(output.points.length, 12);
    assert.equal(output.points[0]?.month, '2025-07');
    assert.equal(output.points[11]?.month, '2026-06');
    assert.deepEqual(
      output.points.every(
        (point) =>
          point.articlesPublished === 0 &&
          point.supportLocations === 0 &&
          point.activeUsers === 0,
      ),
      true,
    );
  });

  test('retorna null sem consultar séries não autorizadas', async ({
    assert,
  }) => {
    const dashboard = new InMemoryDashboardRepository({
      articlesPublished: [{ month: '2026-06', count: 1 }],
      supportLocations: [{ month: '2026-06', count: 1 }],
      activeUsers: [{ month: '2026-06', count: 1 }],
    });
    const useCase = new GetMonthlyGrowthUseCase(dashboard);

    const output = await useCase.execute({
      periodMonths: 6,
      includeArticlesPublished: false,
      includeSupportLocations: false,
      includeActiveUsers: true,
      now: new Date('2026-07-10T12:00:00.000Z'),
    });

    assert.equal(dashboard.lastInput?.includeArticlesPublished, false);
    assert.equal(dashboard.lastInput?.includeSupportLocations, false);
    assert.deepEqual(
      output.points.every(
        (point) =>
          point.articlesPublished === null &&
          point.supportLocations === null &&
          point.activeUsers === (point.month === '2026-06' ? 1 : 0),
      ),
      true,
    );
  });
});

class InMemoryDashboardRepository implements DashboardRepository {
  lastInput: GetMonthlyGrowthInput | null = null;

  constructor(private readonly series: MonthlyGrowthSeries) {}

  async getMonthlyGrowth(
    input: GetMonthlyGrowthInput,
  ): Promise<MonthlyGrowthSeries> {
    this.lastInput = input;
    return {
      articlesPublished: input.includeArticlesPublished
        ? this.series.articlesPublished
        : null,
      supportLocations: input.includeSupportLocations
        ? this.series.supportLocations
        : null,
      activeUsers: input.includeActiveUsers ? this.series.activeUsers : null,
    };
  }
}
