import React from 'react';
import { View, TextInput } from 'react-native';
import { Heading } from '../../../../components/ui/heading';
import { Text } from '../../../../components/ui/text';

interface MicroclimateSectionProps {
  elevationOffset: number;
  onElevationChange: (value: number) => void;
  bloomOffset: number;
  onBloomChange: (value: number) => void;
  isNewRegion?: boolean;
}

export function MicroclimateSection({
  elevationOffset,
  onElevationChange,
  bloomOffset,
  onBloomChange,
  isNewRegion,
}: MicroclimateSectionProps) {
  const seasonShiftWeeks = Math.round(elevationOffset / 200);
  const shiftLabel =
    seasonShiftWeeks > 0
      ? `~${seasonShiftWeeks} week${seasonShiftWeeks !== 1 ? 's' : ''} later bloom`
      : seasonShiftWeeks < 0
        ? `~${Math.abs(seasonShiftWeeks)} week${Math.abs(seasonShiftWeeks) !== 1 ? 's' : ''} earlier bloom`
        : 'No shift';

  return (
    <View className="mt-4">
      <Heading size="lg" className="mb-2">
        Microclimate Adjustments
      </Heading>
      <Text size="sm" className="text-typography-500 mb-4">
        Fine-tune seasonal timing for this location. These offsets help the recommendation engine
        account for your specific microclimate.
      </Text>

      {isNewRegion && (
        <View className="bg-background-info rounded-lg p-3 mb-4" accessibilityRole="alert">
          <Text size="sm" className="text-info-700">
            This apiary is in a different region from your others. Seasonal context will use
            this region's baseline — personal history from other regions won't apply here.
          </Text>
        </View>
      )}

      <Text size="sm" className="text-typography-600 mb-1 font-medium">
        Elevation offset (meters)
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-1"
        value={String(elevationOffset)}
        onChangeText={(t) => {
          const val = parseInt(t, 10);
          if (!isNaN(val) && val >= -500 && val <= 3000) onElevationChange(val);
          else if (t === '' || t === '-') onElevationChange(0);
        }}
        keyboardType="numeric"
        accessibilityLabel="Elevation offset in meters"
        accessibilityHint="Positive values shift bloom later, negative values shift bloom earlier"
        testID="elevation-input"
      />
      <Text size="xs" className="text-typography-400 mb-4">
        {shiftLabel}
      </Text>

      <Text size="sm" className="text-typography-600 mb-1 font-medium">
        Bloom timing offset (days)
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-1"
        value={String(bloomOffset)}
        onChangeText={(t) => {
          const val = parseInt(t, 10);
          if (!isNaN(val) && val >= -30 && val <= 30) onBloomChange(val);
          else if (t === '' || t === '-') onBloomChange(0);
        }}
        keyboardType="numeric"
        accessibilityLabel="Bloom timing offset in days"
        accessibilityHint="Positive means bloom is later than regional average, negative means earlier"
        testID="bloom-input"
      />
      <Text size="xs" className="text-typography-400">
        Days relative to regional baseline ({bloomOffset > 0 ? '+' : ''}{bloomOffset})
      </Text>
    </View>
  );
}
