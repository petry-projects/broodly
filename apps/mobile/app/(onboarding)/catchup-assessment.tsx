import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore, type MidSeasonBaseline } from '../../src/store/onboarding-store';

const CHECKLIST_ITEMS: Array<{ key: keyof MidSeasonBaseline; label: string }> = [
  { key: 'hasExistingHives', label: 'I have existing hives set up' },
  { key: 'hasInspectedRecently', label: 'I have inspected in the last 2 weeks' },
  { key: 'knowsQueenStatus', label: 'I know my queen status' },
  { key: 'hasHarvestedThisYear', label: 'I have harvested honey this year' },
  { key: 'hasTreatedForMites', label: 'I have treated for mites this season' },
];

const DEFAULT_BASELINE: MidSeasonBaseline = {
  hasExistingHives: false,
  hasInspectedRecently: false,
  knowsQueenStatus: false,
  hasHarvestedThisYear: false,
  hasTreatedForMites: false,
};

export default function CatchupAssessmentScreen() {
  const router = useRouter();
  const setMidSeasonBaseline = useOnboardingStore((s) => s.setMidSeasonBaseline);
  const setStep = useOnboardingStore((s) => s.setStep);
  const [baseline, setBaseline] = useState<MidSeasonBaseline>(DEFAULT_BASELINE);

  function toggle(key: keyof MidSeasonBaseline) {
    setBaseline((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleNext() {
    setMidSeasonBaseline(baseline);
    setStep(6);
    router.push('/(onboarding)/disclaimer');
  }

  return (
    <View className="flex-1 bg-background-0 px-8 pt-16">
      <OnboardingProgressDots totalSteps={7} currentStep={5} />

      <Heading size="2xl" className="mt-6 mb-2">
        Quick catch-up
      </Heading>
      <Text size="md" className="text-typography-500 mb-8">
        Since you are joining mid-season, tell us where things stand
      </Text>

      <View className="gap-3 mb-8">
        {CHECKLIST_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            className="flex-row items-center gap-3 py-3"
            onPress={() => toggle(item.key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: baseline[item.key] }}
            accessibilityLabel={item.label}
            testID={`check-${item.key}`}
          >
            <View
              className={`w-6 h-6 rounded border-2 items-center justify-center ${
                baseline[item.key]
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-outline-300'
              }`}
            >
              {baseline[item.key] && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
            <Text size="md" className="flex-1">{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleNext}
        accessibilityLabel="Continue to disclaimer"
        testID="next-btn"
      >
        <ButtonText>Continue</ButtonText>
      </Button>
    </View>
  );
}
