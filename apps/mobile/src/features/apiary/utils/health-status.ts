import type { HiveStatus } from '@broodly/graphql-types';

export type HealthStatus = 'healthy' | 'attention' | 'warning' | 'critical';

const HIVE_STATUS_TO_HEALTH: Record<string, HealthStatus> = {
  ACTIVE: 'healthy',
  INACTIVE: 'attention',
  SOLD: 'attention',
  DEAD: 'critical',
};

export function deriveHiveHealth(status: HiveStatus): HealthStatus {
  return HIVE_STATUS_TO_HEALTH[status] ?? 'attention';
}

export function deriveApiaryHealth(hiveStatuses: HiveStatus[]): HealthStatus {
  if (hiveStatuses.length === 0) return 'healthy';

  const priority: HealthStatus[] = ['critical', 'warning', 'attention', 'healthy'];
  const healthValues = hiveStatuses.map(deriveHiveHealth);

  for (const level of priority) {
    if (healthValues.includes(level)) return level;
  }
  return 'healthy';
}

export const HEALTH_BADGE_CONFIG: Record<
  HealthStatus,
  { action: 'success' | 'warning' | 'error'; variant: 'solid' | 'outline'; label: string }
> = {
  healthy: { action: 'success', variant: 'solid', label: 'Healthy' },
  attention: { action: 'warning', variant: 'outline', label: 'Attention' },
  warning: { action: 'warning', variant: 'solid', label: 'Warning' },
  critical: { action: 'error', variant: 'solid', label: 'Critical' },
};
