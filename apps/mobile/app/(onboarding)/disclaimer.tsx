import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore } from '../../src/store/onboarding-store';

export default function DisclaimerScreen() {
  const router = useRouter();
  const setDisclaimerAccepted = useOnboardingStore((s) => s.setDisclaimerAccepted);
  const setStep = useOnboardingStore((s) => s.setStep);
  const [accepted, setAccepted] = useState(false);

  function handleNext() {
    setDisclaimerAccepted();
    setStep(7);
    router.push('/(onboarding)/summary');
  }

  return (
    <View className="flex-1 bg-background-0 px-8 pt-16">
      <OnboardingProgressDots totalSteps={7} currentStep={6} />

      <Heading size="2xl" className="mt-6 mb-2">
        Important advisory
      </Heading>

      <View className="bg-background-warning rounded-xl p-4 mb-6">
        <Text size="md" className="text-typography-800 leading-6">
          Broodly provides decision-support recommendations based on your observations and general
          beekeeping knowledge. It is not a substitute for professional veterinary advice, local
          regulations, or hands-on experience.
        </Text>
        <Text size="md" className="text-typography-800 leading-6 mt-3">
          Always consult local beekeeping associations and veterinary professionals for colony health
          concerns. Treatment decisions and interventions are your responsibility.
        </Text>
      </View>

      <Pressable
        className="flex-row items-center gap-3 mb-8"
        onPress={() => setAccepted(!accepted)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        accessibilityLabel="I understand that Broodly provides advisory recommendations only"
        testID="disclaimer-checkbox"
      >
        <View
          className={`w-6 h-6 rounded border-2 items-center justify-center ${
            accepted ? 'bg-primary-500 border-primary-500' : 'border-outline-300'
          }`}
        >
          {accepted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text size="sm" className="flex-1">
          I understand and acknowledge this advisory
        </Text>
      </Pressable>

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleNext}
        disabled={!accepted}
        accessibilityLabel="Continue to summary"
        testID="next-btn"
      >
        <ButtonText>Continue</ButtonText>
      </Button>
    </View>
  );
}
