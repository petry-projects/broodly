import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore, type MidSeasonBaseline } from '../../src/store/onboarding-store';

const CHECKLIST_ITEMS: Array<{ key: keyof MidSeasonBaseline; label: string; subtitle: string }> = [
  { key: 'queenPresentAndLaying', label: 'Queen present and laying', subtitle: 'Verified queen is alive and actively laying eggs' },
  { key: 'colonyStrengthModerateOrStrong', label: 'Colony strength: moderate or strong', subtitle: 'Bees cover at least 5-6 frames in the brood box' },
  { key: 'treatmentsAppliedThisSeason', label: 'Treatments applied this season', subtitle: 'Varroa or other treatments have been administered' },
  { key: 'honeySupersOn', label: 'Honey supers on', subtitle: 'Supers are currently on the hive for honey collection' },
  { key: 'healthConcernsObserved', label: 'Any health concerns observed', subtitle: 'Signs of disease, pests, or unusual behavior noted' },
];

const DEFAULT_BASELINE: MidSeasonBaseline = {
  queenPresentAndLaying: false,
  colonyStrengthModerateOrStrong: false,
  treatmentsAppliedThisSeason: false,
  honeySupersOn: false,
  healthConcernsObserved: false,
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
      <View className="bg-background-warning rounded-xl p-3 mb-6" accessibilityRole="alert">
        <Text size="sm" className="text-warning-700">
          You're joining mid-season. Let's capture where your colonies are now so recommendations start from the right baseline.
        </Text>
      </View>

      <View className="gap-3 mb-6">
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
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
            <View className="flex-1">
              <Text size="md">{item.label}</Text>
              <Text size="xs" className="text-typography-400">{item.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text size="xs" className="text-typography-400 mb-4">
        Past milestones will show as "not tracked" rather than "missed."
      </Text>

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
