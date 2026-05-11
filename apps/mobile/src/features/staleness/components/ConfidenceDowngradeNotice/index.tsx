import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../../../components/ui/text';
import type { DataSource } from '../../../../services/staleness/source-thresholds';

interface StaleSource {
  source: DataSource;
  dataUpdatedAt: Date;
}

interface ConfidenceDowngradeNoticeProps {
  staleSources: StaleSource[];
}

const SOURCE_LABELS: Record<DataSource, string> = {
  weather: 'weather data',
  flora: 'flora data',
  telemetry: 'telemetry data',
};

/**
 * Confidence downgrade notice for recommendation cards.
 * Displays when any contributing data source is stale.
 */
export function ConfidenceDowngradeNotice({
  staleSources,
}: ConfidenceDowngradeNoticeProps) {
  if (staleSources.length === 0) return null;

  const sourceNames = staleSources.map((s) => SOURCE_LABELS[s.source]);
  const sourceList = sourceNames.join(' and ');
  const verb = staleSources.length === 1 ? 'is' : 'are';

  return (
    <View
      className="bg-background-warning rounded-lg px-3 py-2 mt-2"
      accessibilityRole="alert"
      accessibilityLabel={`Recommendation confidence is reduced because ${sourceList} ${verb} outdated.`}
    >
      <Text size="xs" className="text-warning-600">
        Confidence reduced — {sourceList} {verb} outdated.
      </Text>
    </View>
  );
}
