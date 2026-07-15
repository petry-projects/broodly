import { useApiaries } from '../../apiary/hooks/use-apiaries';
import { deriveApiaryHealth, type HealthStatus } from '../../apiary/utils/health-status';
import type { Apiary, HiveStatus } from '@broodly/graphql-types';

export interface DashboardApiary {
  apiary: Apiary;
  overallHealth: HealthStatus;
  hivesNeedingAttention: number;
}

interface DashboardSummary {
  totalApiaries: number;
  totalHives: number;
  statusCounts: Record<HealthStatus, number>;
  apiaries: DashboardApiary[];
}

const HEALTH_PRIORITY: Record<HealthStatus, number> = {
  critical: 0,
  warning: 1,
  attention: 2,
  healthy: 3,
};

export function useDashboardSummary() {
  const { data: apiaries, isLoading, refetch, isRefetching } = useApiaries();

  const summary: DashboardSummary | undefined = apiaries
    ? computeDashboard(apiaries)
    : undefined;

  return { data: summary, isLoading, refetch, isRefetching };
}

function computeDashboard(apiaries: Apiary[]): DashboardSummary {
  let totalHives = 0;
  const statusCounts: Record<HealthStatus, number> = {
    healthy: 0,
    attention: 0,
    warning: 0,
    critical: 0,
  };

  const dashboardApiaries: DashboardApiary[] = apiaries.map((apiary) => {
    const hiveStatuses = apiary.hives.map((h) => h.status as HiveStatus);
    totalHives += hiveStatuses.length;
    const overallHealth = deriveApiaryHealth(hiveStatuses);
    statusCounts[overallHealth]++;

    const needsAttention = hiveStatuses.filter((s) => {
      const h = deriveApiaryHealth([s]);
      return h !== 'healthy';
    }).length;

    return { apiary, overallHealth, hivesNeedingAttention: needsAttention };
  });

  dashboardApiaries.sort(
    (a, b) => HEALTH_PRIORITY[a.overallHealth] - HEALTH_PRIORITY[b.overallHealth],
  );

  return {
    totalApiaries: apiaries.length,
    totalHives,
    statusCounts,
    apiaries: dashboardApiaries,
  };
}
