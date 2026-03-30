import React, { useState, useMemo } from 'react';
import { View, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../../../../../components/ui/heading';
import { Text } from '../../../../../../../components/ui/text';
import { Button, ButtonText } from '../../../../../../../components/ui/button';
import { useInspectionStore } from '../../../../../../../src/store/inspection-store';
import { getPromptSequence, getNextPromptIndex } from '../../../../../../../src/features/inspection/services/step-engine';
import { ICON_COLORS } from '../../../../../../../src/theme/colors';
import type { ObservationClassification } from '../../../../../../../src/features/inspection/types';

const CLASSIFICATION_STYLES: Record<ObservationClassification, { bg: string; text: string; icon: string }> = {
  normal: { bg: 'bg-success-100', text: 'text-success-700', icon: 'checkmark-circle' },
  cautionary: { bg: 'bg-warning-100', text: 'text-warning-700', icon: 'alert-circle' },
  urgent: { bg: 'bg-error-100', text: 'text-error-700', icon: 'warning' },
};

export default function InspectionStepScreen() {
  const router = useRouter();
  const { id: apiaryId, hiveId } = useLocalSearchParams<{ id: string; hiveId: string }>();
  const store = useInspectionStore();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');

  const prompts = useMemo(
    () => getPromptSequence(store.type ?? 'full', store.observations),
    [store.type, store.observations],
  );
  const currentPrompt = prompts[store.currentPromptIndex];
  const totalSteps = prompts.length;

  if (!currentPrompt) {
    // All steps complete — navigate to summary
    router.replace(`/(tabs)/apiaries/${apiaryId}/hives/${hiveId}/inspect/summary`);
    return null;
  }

  function handleNext() {
    const value = selectedOption ?? freeText.trim();
    if (!value && currentPrompt.isRequired) return;

    const classification: ObservationClassification =
      currentPrompt.options?.find((o) => o.id === selectedOption)?.classification ?? 'normal';

    store.addObservation({
      id: `obs-${Date.now()}`,
      promptId: currentPrompt.id,
      observationType: currentPrompt.observationType,
      value,
      classification,
      createdAt: new Date().toISOString(),
    });

    const nextIndex = getNextPromptIndex(store.currentPromptIndex, prompts);
    if (nextIndex !== null) {
      store.setPromptIndex(nextIndex);
      setSelectedOption(null);
      setFreeText('');
    } else {
      router.replace(`/(tabs)/apiaries/${apiaryId}/hives/${hiveId}/inspect/summary`);
    }
  }

  function handlePause() {
    store.pauseInspection();
    router.back();
  }

  const progress = ((store.currentPromptIndex + 1) / totalSteps) * 100;

  return (
    <ScrollView className="flex-1 bg-background-0" contentContainerClassName="px-6 pt-6 pb-12">
      {/* Progress */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text size="sm" className="text-typography-500">
            Step {store.currentPromptIndex + 1} of {totalSteps}
          </Text>
          <Pressable
            onPress={handlePause}
            className="min-h-[48px] min-w-[48px] items-center justify-center"
            accessibilityLabel="Pause inspection"
            testID="pause-btn"
          >
            <Ionicons name="pause-circle-outline" size={24} color={ICON_COLORS.muted} />
          </Pressable>
        </View>
        <View className="h-2 bg-outline-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-primary-500 rounded-full"
            style={{ width: `${progress}%` }}
            accessibilityLabel={`Progress: step ${store.currentPromptIndex + 1} of ${totalSteps}`}
          />
        </View>
      </View>

      {/* Prompt */}
      <Heading size="xl" className="mb-2">{currentPrompt.title}</Heading>
      <Text size="md" className="text-typography-500 mb-6">
        {currentPrompt.description}
      </Text>

      {/* Voice hint */}
      <View className="bg-background-info rounded-lg p-3 mb-4 flex-row items-center gap-2">
        <Ionicons name="mic-outline" size={18} color={ICON_COLORS.muted} />
        <Text size="sm" className="text-info-700 flex-1">
          Speak your observation or select an option below
        </Text>
      </View>

      {/* Options */}
      {currentPrompt.options && (
        <View className="gap-2 mb-4">
          {currentPrompt.options.map((option) => {
            const styles = CLASSIFICATION_STYLES[option.classification];
            const isSelected = selectedOption === option.id;
            return (
              <Pressable
                key={option.id}
                className={`p-4 rounded-xl border-2 min-h-[48px] ${
                  isSelected ? 'border-primary-500 bg-primary-50' : 'border-outline-200'
                }`}
                onPress={() => setSelectedOption(option.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${option.label}, ${option.classification} classification`}
                testID={`option-${option.id}`}
              >
                <View className="flex-row items-center gap-2">
                  <View className={`px-2 py-0.5 rounded ${styles.bg}`}>
                    <Ionicons name={styles.icon as 'checkmark-circle'} size={14} />
                  </View>
                  <Text size="md">{option.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Free text */}
      {!currentPrompt.options && (
        <TextInput
          className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-4 min-h-[80px]"
          placeholder="Describe what you observe or plan to do..."
          value={freeText}
          onChangeText={setFreeText}
          multiline
          accessibilityLabel="Observation notes"
          testID="observation-input"
        />
      )}

      {/* Next button */}
      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleNext}
        disabled={currentPrompt.isRequired && !selectedOption && !freeText.trim()}
        accessibilityLabel={store.currentPromptIndex + 1 === totalSteps ? 'Complete inspection' : 'Next step'}
        testID="next-btn"
      >
        <ButtonText>
          {store.currentPromptIndex + 1 === totalSteps ? 'Complete' : 'Next'}
        </ButtonText>
      </Button>
    </ScrollView>
  );
}
