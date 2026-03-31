import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../../../components/ui/text';
import {
  getStalenessLevel,
  getRelativeTimeLabel,
} from '../../../../services/staleness/staleness-utils';

interface StalenessIndicatorProps {
  dataUpdatedAt: Date;
}

/**
 * Three-tier staleness indicator:
 * - fresh: renders nothing
 * - subtle (<24h): muted text with relative time
 * - warning (24-72h): amber warning badge
 * - critical (>72h): red alert banner
 */
export function StalenessIndicator({ dataUpdatedAt }: StalenessIndicatorProps) {
  const level = getStalenessLevel(dataUpdatedAt);
  const label = getRelativeTimeLabel(dataUpdatedAt);

  if (level === 'fresh') return null;

  if (level === 'subtle') {
    return (
      <Text
        size="xs"
        className="text-typography-500"
        accessibilityLabel={`Data last updated ${label}`}
      >
        Updated {label}
      </Text>
    );
  }

  if (level === 'warning') {
    return (
      <View
        className="flex-row items-center bg-background-warning rounded px-2 py-1"
        accessibilityRole="alert"
        accessibilityLabel={`Warning: data is ${label} old`}
      >
        <Text size="xs" className="text-warning-600 font-medium">
          ⚠ Data is {label} old
        </Text>
      </View>
    );
  }

  // critical
  return (
    <View
      className="bg-background-error rounded-lg p-3"
      accessibilityRole="alert"
      accessibilityLabel={`Data may be significantly outdated. Last updated ${label}.`}
    >
      <Text size="sm" className="text-error-600 font-medium">
        Data may be significantly outdated
      </Text>
      <Text size="xs" className="text-error-500 mt-1">
        Last updated {label}. Some information may have changed.
      </Text>
    </View>
  );
}
