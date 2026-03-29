import React from 'react';
import { Text } from '../../../../../components/ui/text';
import {
  getSourceStalenessLevel,
  type DataSource,
} from '../../../../services/staleness/source-thresholds';
import { getRelativeTimeLabel } from '../../../../services/staleness/staleness-utils';

interface SourceStalenessIndicatorProps {
  source: DataSource;
  dataUpdatedAt: Date;
}

const SOURCE_LABELS: Record<DataSource, string> = {
  weather: 'Weather data',
  flora: 'Flora data',
  telemetry: 'Telemetry data',
};

/**
 * Per-source staleness indicator for context cards.
 * Uses source-specific thresholds (weather: 24h, flora: 7d, telemetry: 1h).
 */
export function SourceStalenessIndicator({
  source,
  dataUpdatedAt,
}: SourceStalenessIndicatorProps) {
  const level = getSourceStalenessLevel(source, dataUpdatedAt);

  if (level === 'fresh') return null;

  const label = getRelativeTimeLabel(dataUpdatedAt);
  const sourceLabel = SOURCE_LABELS[source];

  return (
    <Text
      size="xs"
      className={
        level === 'critical'
          ? 'text-error-600 font-medium'
          : 'text-warning-600'
      }
      accessibilityLabel={`${sourceLabel} is outdated. Last updated ${label}.`}
    >
      {sourceLabel} outdated ({label})
    </Text>
  );
}
