import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../../../../../components/ui/heading';
import { Text } from '../../../../../../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../../../../../../components/ui/button';
import { useInspectionStore } from '../../../../../../../src/store/inspection-store';
import { useConnectivityStore } from '../../../../../../../src/store/connectivity-store';
import { ICON_COLORS } from '../../../../../../../src/theme/colors';
import type { InspectionType } from '../../../../../../../src/features/inspection/types';

export default function InspectionEntryScreen() {
  const router = useRouter();
  const { id: apiaryId, hiveId } = useLocalSearchParams<{ id: string; hiveId: string }>();
  const startInspection = useInspectionStore((s) => s.startInspection);
  const hasActive = useInspectionStore((s) => s.hasActiveInspection);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedType, setSelectedType] = useState<InspectionType | null>(null);

  async function handleStart() {
    if (!selectedType) return;
    setIsStarting(true);
    try {
      // In production: call startInspection GraphQL mutation to get server ID
      const inspectionId = `local-${Date.now()}`;
      startInspection({
        inspectionId,
        hiveId: hiveId!,
        hiveName: `Hive ${hiveId}`,
        type: selectedType,
      });
      router.push(`/(tabs)/apiaries/${apiaryId}/hives/${hiveId}/inspect/step`);
    } finally {
      setIsStarting(false);
    }
  }

  if (hasActive()) {
    return (
      <View className="flex-1 bg-background-0 px-6 pt-8">
        <Heading size="2xl" className="mb-4">Resume Inspection?</Heading>
        <Text size="md" className="text-typography-500 mb-6">
          You have an inspection in progress. Would you like to resume or start fresh?
        </Text>
        <View className="gap-3">
          <Button
            action="primary"
            variant="solid"
            size="xl"
            onPress={() => router.push(`/(tabs)/apiaries/${apiaryId}/hives/${hiveId}/inspect/step`)}
            accessibilityLabel="Resume inspection"
            testID="resume-btn"
          >
            <ButtonText>Resume Inspection</ButtonText>
          </Button>
          <Button
            action="secondary"
            variant="outline"
            size="xl"
            onPress={() => {
              useInspectionStore.getState().clearInspection();
              setSelectedType(null);
            }}
            accessibilityLabel="Start new inspection"
            testID="start-fresh-btn"
          >
            <ButtonText>Start Fresh</ButtonText>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-0 px-6 pt-8">
      <Heading size="2xl" className="mb-2">Start Inspection</Heading>
      <Text size="md" className="text-typography-500 mb-6">
        Choose your inspection type
      </Text>

      {!isOnline && (
        <View className="bg-background-info rounded-lg p-3 mb-4" accessibilityRole="status">
          <Text size="sm" className="text-info-700">
            You are offline. Inspection data will be saved locally and synced when you reconnect.
          </Text>
        </View>
      )}

      <View className="gap-3 mb-8">
        <Pressable
          className={`p-4 rounded-xl border-2 min-h-[48px] ${
            selectedType === 'full' ? 'border-primary-500 bg-primary-50' : 'border-outline-200'
          }`}
          onPress={() => setSelectedType('full')}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedType === 'full' }}
          accessibilityLabel="Full inspection: comprehensive check of all hive aspects"
          testID="type-full"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="clipboard-outline" size={24} color={ICON_COLORS.muted} />
            <View className="flex-1">
              <Heading size="md">Full Inspection</Heading>
              <Text size="sm" className="text-typography-500">
                8 steps — entrance, brood, queen cells, stores, pests, colony health, actions
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          className={`p-4 rounded-xl border-2 min-h-[48px] ${
            selectedType === 'quick' ? 'border-primary-500 bg-primary-50' : 'border-outline-200'
          }`}
          onPress={() => setSelectedType('quick')}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedType === 'quick' }}
          accessibilityLabel="Quick inspection: key observations only"
          testID="type-quick"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="flash-outline" size={24} color={ICON_COLORS.muted} />
            <View className="flex-1">
              <Heading size="md">Quick Check</Heading>
              <Text size="sm" className="text-typography-500">
                5 steps — entrance, brood, queen cells, colony health, actions
              </Text>
            </View>
          </View>
        </Pressable>
      </View>

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleStart}
        disabled={!selectedType || isStarting}
        accessibilityLabel="Begin inspection"
        testID="start-btn"
      >
        {isStarting ? <ButtonSpinner /> : <ButtonText>Begin Inspection</ButtonText>}
      </Button>
    </View>
  );
}
