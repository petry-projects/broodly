import type { StalenessLevel } from './staleness-utils';

export type DataSource = 'weather' | 'flora' | 'telemetry';

const SOURCE_THRESHOLDS: Record<DataSource, number> = {
  weather: 24 * 60 * 60 * 1000, // 24 hours
  flora: 7 * 24 * 60 * 60 * 1000, // 7 days
  telemetry: 60 * 60 * 1000, // 1 hour (default)
};

/**
 * Determines staleness for a specific data source.
 * Each source has its own threshold for when data becomes stale.
 */
export function getSourceStalenessLevel(
  source: DataSource,
  dataUpdatedAt: Date,
  now = new Date()
): StalenessLevel {
  const ageMs = now.getTime() - dataUpdatedAt.getTime();
  const threshold = SOURCE_THRESHOLDS[source];

  if (ageMs < threshold) return 'fresh';
  if (ageMs < threshold * 2) return 'warning';
  return 'critical';
}

/**
 * Returns the threshold in milliseconds for a data source.
 */
export function getSourceThreshold(source: DataSource): number {
  return SOURCE_THRESHOLDS[source];
}
