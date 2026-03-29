import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore } from '../../src/store/onboarding-store';
import { useUIStore } from '../../src/store/ui-store';

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-outline-100">
      <Text size="sm" className="text-typography-500">{label}</Text>
      <Text size="sm" className="text-typography-800 font-medium">{value}</Text>
    </View>
  );
}

const GOAL_LABELS: Record<string, string> = {
  health: 'Colony Health',
  honey: 'Honey Production',
  learning: 'Learning',
  growth: 'Growth',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  newbie: 'Newbie',
  amateur: 'Amateur',
  sideliner: 'Sideliner',
};

export default function SummaryScreen() {
  const router = useRouter();
  const state = useOnboardingStore();
  const setOnboardingComplete = useUIStore((s) => s.setOnboardingComplete);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setIsSubmitting(true);
    setError(null);
    try {
      // In production: fire completeOnboarding GraphQL mutation here
      state.setOnboardingCompleted();
      setOnboardingComplete(true);
      router.replace('/(tabs)');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background-0" contentContainerClassName="px-8 pt-16 pb-12">
      <OnboardingProgressDots totalSteps={7} currentStep={7} />

      <Heading size="2xl" className="mt-6 mb-2">
        You are all set!
      </Heading>
      <Text size="md" className="text-typography-500 mb-6">
        Review your setup before getting started
      </Text>

      <View className="bg-background-50 rounded-xl p-4 mb-8">
        <SummaryRow
          label="Experience"
          value={state.experienceLevel ? (EXPERIENCE_LABELS[state.experienceLevel] ?? state.experienceLevel) : 'Not set'}
        />
        <SummaryRow
          label="Region"
          value={state.region ?? 'Not set'}
        />
        <SummaryRow
          label="Season"
          value={state.seasonalContext?.season ?? 'Not set'}
        />
        <SummaryRow
          label="Apiary"
          value={state.apiary?.name ?? 'Not set'}
        />
        <SummaryRow
          label="Hives"
          value={state.apiary?.hiveCount?.toString() ?? '0'}
        />
        <SummaryRow
          label="Goals"
          value={state.goals.length > 0 ? state.goals.map((g) => GOAL_LABELS[g] ?? g).join(', ') : 'None selected'}
        />
        <SummaryRow
          label="Interaction"
          value={state.interactionMode === 'voice_first' ? 'Voice First' : 'Tap & Read'}
        />
      </View>

      <View className="bg-background-info rounded-lg p-3 mb-4">
        <Text size="sm" className="text-info-700">
          You can change any of these anytime from Settings.
        </Text>
      </View>

      {error && (
        <View className="bg-background-error rounded-lg p-3 mb-4" accessibilityRole="alert">
          <Text size="sm" className="text-error-600 text-center">{error}</Text>
        </View>
      )}

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleComplete}
        disabled={isSubmitting}
        accessibilityLabel="Complete onboarding and go to home"
        testID="complete-btn"
      >
        {isSubmitting ? <ButtonSpinner /> : <ButtonText>Let's Go!</ButtonText>}
      </Button>
    </ScrollView>
  );
}
