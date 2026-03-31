import { useMemo } from 'react';
import {
  getSourceStalenessLevel,
  type DataSource,
} from '../../../services/staleness/source-thresholds';
import type { StalenessLevel } from '../../../services/staleness/staleness-utils';

interface SourceStalenessResult {
  level: StalenessLevel;
  isStale: boolean;
}

/**
 * Hook that computes source-specific staleness.
 * Each source type (weather, flora, telemetry) has its own threshold.
 */
export function useSourceStaleness(
  source: DataSource,
  dataUpdatedAt: number | undefined
): SourceStalenessResult {
  return useMemo(() => {
    if (!dataUpdatedAt) {
      return { level: 'fresh' as const, isStale: false };
    }
    const level = getSourceStalenessLevel(source, new Date(dataUpdatedAt));
    return {
      level,
      isStale: level !== 'fresh',
    };
  }, [source, dataUpdatedAt]);
}
