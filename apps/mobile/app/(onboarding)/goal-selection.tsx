import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore, type InteractionMode } from '../../src/store/onboarding-store';

const GOALS = [
  { id: 'health', label: 'Colony Health', icon: '🏥' },
  { id: 'honey', label: 'Honey Production', icon: '🍯' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'growth', label: 'Growth', icon: '📈' },
];

const INTERACTION_MODES: Array<{ value: InteractionMode; label: string; description: string }> = [
  { value: 'voice_first', label: 'Voice First', description: 'Hands-free in the field' },
  { value: 'tap_and_read', label: 'Tap & Read', description: 'Traditional touch interaction' },
];

export default function GoalSelectionScreen() {
  const router = useRouter();
  const goals = useOnboardingStore((s) => s.goals);
  const setGoals = useOnboardingStore((s) => s.setGoals);
  const interactionMode = useOnboardingStore((s) => s.interactionMode);
  const setInteractionMode = useOnboardingStore((s) => s.setInteractionMode);
  const seasonalContext = useOnboardingStore((s) => s.seasonalContext);
  const setStep = useOnboardingStore((s) => s.setStep);

  function toggleGoal(id: string) {
    if (goals.includes(id)) {
      setGoals(goals.filter((g) => g !== id));
    } else {
      setGoals([...goals, id]);
    }
  }

  function handleNext() {
    if (seasonalContext?.isMidSeason) {
      setStep(6);
      router.push('/(onboarding)/catchup-assessment');
    } else {
      setStep(6);
      router.push('/(onboarding)/disclaimer');
    }
  }

  return (
    <View className="flex-1 bg-background-0 px-8 pt-16">
      <OnboardingProgressDots totalSteps={7} currentStep={5} />

      <Heading size="2xl" className="mt-6 mb-2">
        What are your goals?
      </Heading>
      <Text size="md" className="text-typography-500 mb-6">
        Select all that apply
      </Text>

      <View className="flex-row flex-wrap gap-3 mb-8">
        {GOALS.map((goal) => {
          const selected = goals.includes(goal.id);
          return (
            <Pressable
              key={goal.id}
              className={`px-4 py-3 rounded-xl border-2 ${
                selected ? 'border-primary-500 bg-primary-50' : 'border-outline-200'
              }`}
              onPress={() => toggleGoal(goal.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={goal.label}
              testID={`goal-${goal.id}`}
            >
              <Text size="md">
                {goal.icon} {goal.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Heading size="lg" className="mb-2">
        How do you prefer to interact?
      </Heading>
      <Text size="sm" className="text-typography-500 mb-4">
        You can change this anytime in Settings
      </Text>

      <View className="gap-3 mb-8">
        {INTERACTION_MODES.map((mode) => (
          <Pressable
            key={mode.value}
            className={`p-4 rounded-xl border-2 ${
              interactionMode === mode.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-outline-200'
            }`}
            onPress={() => setInteractionMode(mode.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: interactionMode === mode.value }}
            accessibilityLabel={`${mode.label}: ${mode.description}`}
            testID={`mode-${mode.value}`}
          >
            <Heading size="md">{mode.label}</Heading>
            <Text size="sm" className="text-typography-500">
              {mode.description}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleNext}
        disabled={goals.length === 0 || !interactionMode}
        accessibilityLabel="Continue"
        testID="next-btn"
      >
        <ButtonText>Continue</ButtonText>
      </Button>
    </View>
  );
}
