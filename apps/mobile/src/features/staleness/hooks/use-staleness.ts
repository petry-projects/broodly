import { useMemo } from 'react';
import {
  getStalenessLevel,
  getRelativeTimeLabel,
  type StalenessLevel,
} from '../../../services/staleness/staleness-utils';

interface StalenessResult {
  level: StalenessLevel;
  label: string;
  isStale: boolean;
}

/**
 * Hook that computes staleness from TanStack Query's dataUpdatedAt.
 * Re-evaluates when dataUpdatedAt changes (i.e., on refetch).
 */
export function useStaleness(dataUpdatedAt: number | undefined): StalenessResult {
  return useMemo(() => {
    if (!dataUpdatedAt) {
      return { level: 'fresh' as const, label: '', isStale: false };
    }
    const date = new Date(dataUpdatedAt);
    const level = getStalenessLevel(date);
    const label = getRelativeTimeLabel(date);
    return {
      level,
      label,
      isStale: level !== 'fresh',
    };
  }, [dataUpdatedAt]);
}
