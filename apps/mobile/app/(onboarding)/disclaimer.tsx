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
        Advisory-Only Guidance
      </Heading>

      <View className="bg-background-warning rounded-xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Ionicons name="warning-outline" size={24} color="rgb(184, 114, 10)" />
          <Heading size="lg">Recommendations include confidence levels</Heading>
        </View>
        <Text size="md" className="text-typography-800 leading-6">
          Broodly provides decision-support recommendations based on your observations, seasonal context,
          and general beekeeping knowledge. Each recommendation includes a confidence level to help you
          judge its reliability.
        </Text>
        <View className="mt-3 gap-1">
          <Text size="md" className="text-typography-800">{'\u2022'} Not a substitute for professional veterinary advice</Text>
          <Text size="md" className="text-typography-800">{'\u2022'} Treatment decisions are your responsibility</Text>
          <Text size="md" className="text-typography-800">{'\u2022'} Always consult local regulations and beekeeping associations</Text>
        </View>
      </View>

      <View className="bg-background-info rounded-xl p-4 mb-6">
        <Text size="sm" className="text-info-700">
          Treatment recommendations are filtered by your region's regulatory status. Always verify
          legality with your local agricultural authority before use.
        </Text>
      </View>

      <Pressable
        className="flex-row items-center gap-3 mb-8 min-h-[48px]"
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
          {accepted && <Ionicons name="checkmark" size={16} color="white" />}
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
