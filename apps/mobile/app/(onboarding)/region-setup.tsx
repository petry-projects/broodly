import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore } from '../../src/store/onboarding-store';
import { resolveSeasonalContext } from '../../src/features/onboarding/utils/seasonal-context';

export default function RegionSetupScreen() {
  const router = useRouter();
  const region = useOnboardingStore((s) => s.region);
  const setRegion = useOnboardingStore((s) => s.setRegion);
  const setSeasonalContext = useOnboardingStore((s) => s.setSeasonalContext);
  const setStep = useOnboardingStore((s) => s.setStep);
  const [input, setInput] = useState(region ?? '');

  function handleNext() {
    if (!input.trim()) return;
    setRegion(input.trim());
    setSeasonalContext(resolveSeasonalContext(input.trim(), new Date()));
    setStep(4);
    router.push('/(onboarding)/apiary-setup');
  }

  return (
    <View className="flex-1 bg-background-0 px-8 pt-16">
      <OnboardingProgressDots totalSteps={7} currentStep={3} />

      <Heading size="2xl" className="mt-6 mb-2">
        Where are your bees?
      </Heading>
      <Text size="md" className="text-typography-500 mb-8">
        Your region helps us provide seasonal recommendations
      </Text>

      <Text size="sm" className="text-typography-600 mb-2 font-medium">
        Region or city
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-8"
        placeholder="e.g., Pacific Northwest, London, Melbourne"
        placeholderTextColor="#9CA3AF"
        value={input}
        onChangeText={setInput}
        accessibilityLabel="Region or city name"
        testID="region-input"
      />

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleNext}
        disabled={!input.trim()}
        accessibilityLabel="Continue to apiary setup"
        testID="next-btn"
      >
        <ButtonText>Continue</ButtonText>
      </Button>
    </View>
  );
}
