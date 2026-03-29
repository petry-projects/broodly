import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore, type ExperienceLevel } from '../../src/store/onboarding-store';

const LEVELS: Array<{ value: ExperienceLevel; label: string; description: string }> = [
  { value: 'newbie', label: 'Newbie', description: 'Just getting started with beekeeping' },
  { value: 'amateur', label: 'Amateur', description: '1-3 years of experience' },
  { value: 'sideliner', label: 'Sideliner', description: '3+ years, managing multiple hives' },
];

export default function ExperienceLevelScreen() {
  const router = useRouter();
  const experienceLevel = useOnboardingStore((s) => s.experienceLevel);
  const setExperienceLevel = useOnboardingStore((s) => s.setExperienceLevel);
  const setStep = useOnboardingStore((s) => s.setStep);

  function handleNext() {
    setStep(3);
    router.push('/(onboarding)/region-setup');
  }

  return (
    <View className="flex-1 bg-background-0 px-8 pt-16">
      <OnboardingProgressDots totalSteps={7} currentStep={2} />

      <Heading size="2xl" className="mt-6 mb-2">
        Your experience level
      </Heading>
      <Text size="md" className="text-typography-500 mb-8">
        This helps us tailor recommendations to your skill level
      </Text>

      <View className="gap-3 mb-8">
        {LEVELS.map((level) => (
          <Pressable
            key={level.value}
            className={`p-4 rounded-xl border-2 ${
              experienceLevel === level.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-outline-200'
            }`}
            onPress={() => setExperienceLevel(level.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: experienceLevel === level.value }}
            accessibilityLabel={`${level.label}: ${level.description}`}
            testID={`level-${level.value}`}
          >
            <Heading size="lg">{level.label}</Heading>
            <Text size="sm" className="text-typography-500 mt-1">
              {level.description}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleNext}
        disabled={!experienceLevel}
        accessibilityLabel="Continue to region setup"
        testID="next-btn"
      >
        <ButtonText>Continue</ButtonText>
      </Button>
    </View>
  );
}
