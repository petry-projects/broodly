import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../../../../../components/ui/heading';
import { Text } from '../../../../../../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../../../../../../components/ui/button';
import { useInspectionStore } from '../../../../../../../src/store/inspection-store';
import { ICON_COLORS } from '../../../../../../../src/theme/colors';
import type { ObservationClassification } from '../../../../../../../src/features/inspection/types';

const CLASSIFICATION_CONFIG: Record<ObservationClassification, { bg: string; text: string; icon: string; label: string }> = {
  normal: { bg: 'bg-success-100', text: 'text-success-700', icon: 'checkmark-circle', label: 'Normal' },
  cautionary: { bg: 'bg-warning-100', text: 'text-warning-700', icon: 'alert-circle', label: 'Cautionary' },
  urgent: { bg: 'bg-error-100', text: 'text-error-700', icon: 'warning', label: 'Urgent' },
};

export default function InspectionSummaryScreen() {
  const router = useRouter();
  const { id: apiaryId, hiveId } = useLocalSearchParams<{ id: string; hiveId: string }>();
  const store = useInspectionStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urgentCount = store.observations.filter((o) => o.classification === 'urgent').length;
  const cautionaryCount = store.observations.filter((o) => o.classification === 'cautionary').length;
  const duration = store.startedAt
    ? Math.round((Date.now() - new Date(store.startedAt).getTime()) / 60000)
    : 0;

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      // In production: call completeInspection GraphQL mutation
      store.completeInspection();
      store.clearInspection();
      router.replace(`/(tabs)/apiaries/${apiaryId}/hives/${hiveId}`);
    } catch {
      setError('Failed to save inspection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background-0" contentContainerClassName="px-6 pt-8 pb-12">
      <Heading size="2xl" className="mb-1">Inspection Complete</Heading>
      <Text size="sm" className="text-typography-400 mb-6">
        {store.hiveName} — {store.type === 'full' ? 'Full' : 'Quick'} inspection — {duration} min
      </Text>

      {/* Summary stats */}
      <View className="flex-row gap-4 mb-6">
        <View className="bg-background-50 rounded-xl p-4 flex-1 items-center">
          <Heading size="xl">{store.observations.length}</Heading>
          <Text size="xs" className="text-typography-400">Observations</Text>
        </View>
        {urgentCount > 0 && (
          <View className="bg-background-error rounded-xl p-4 flex-1 items-center">
            <Heading size="xl" className="text-error-700">{urgentCount}</Heading>
            <Text size="xs" className="text-error-600">Urgent</Text>
          </View>
        )}
        {cautionaryCount > 0 && (
          <View className="bg-background-warning rounded-xl p-4 flex-1 items-center">
            <Heading size="xl" className="text-warning-700">{cautionaryCount}</Heading>
            <Text size="xs" className="text-warning-600">Cautionary</Text>
          </View>
        )}
      </View>

      {/* Observation list */}
      <Heading size="lg" className="mb-3">Observations</Heading>
      <View className="gap-2 mb-6">
        {store.observations.map((obs) => {
          const config = CLASSIFICATION_CONFIG[obs.classification];
          return (
            <View
              key={obs.id}
              className="flex-row items-center gap-3 p-3 bg-background-50 rounded-xl"
              accessibilityLabel={`${obs.observationType}: ${obs.value}, ${config.label}`}
            >
              <View className={`p-1 rounded ${config.bg}`}>
                <Ionicons name={config.icon as 'checkmark-circle'} size={16} />
              </View>
              <View className="flex-1">
                <Text size="sm" className="font-medium">{obs.observationType.replace(/_/g, ' ')}</Text>
                <Text size="xs" className="text-typography-400">{obs.value.replace(/_/g, ' ')}</Text>
              </View>
              <View className={`px-2 py-0.5 rounded ${config.bg}`}>
                <Text size="xs" className={config.text}>{config.label}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Colony improvement signal */}
      {urgentCount === 0 && (
        <View className="bg-background-success rounded-xl p-4 mb-6">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="trending-up" size={18} color={ICON_COLORS.muted} />
            <Text size="md" className="text-success-700 font-medium">
              Nice work — colony looks healthy
            </Text>
          </View>
          <Text size="sm" className="text-success-600">
            Keep up regular inspections to maintain this trend.
          </Text>
        </View>
      )}

      {error && (
        <View className="bg-background-error rounded-lg p-3 mb-4" accessibilityRole="alert">
          <Text size="sm" className="text-error-600">{error}</Text>
        </View>
      )}

      <View className="gap-3">
        <Button
          action="primary"
          variant="solid"
          size="xl"
          onPress={handleSave}
          disabled={isSaving}
          accessibilityLabel="Save inspection"
          testID="save-btn"
        >
          {isSaving ? <ButtonSpinner /> : <ButtonText>Save Inspection</ButtonText>}
        </Button>
      </View>
    </ScrollView>
  );
}
