import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore } from '../../src/store/onboarding-store';

export default function ApiarySetupScreen() {
  const router = useRouter();
  const apiary = useOnboardingStore((s) => s.apiary);
  const setApiary = useOnboardingStore((s) => s.setApiary);
  const setStep = useOnboardingStore((s) => s.setStep);

  const [name, setName] = useState(apiary?.name ?? '');
  const [hiveCount, setHiveCount] = useState(apiary?.hiveCount ?? 1);

  function handleNext() {
    if (!name.trim()) return;
    setApiary({
      name: name.trim(),
      locationLat: null,
      locationLng: null,
      hiveCount,
    });
    setStep(5);
    router.push('/(onboarding)/goal-selection');
  }

  return (
    <View className="flex-1 bg-background-0 px-8 pt-16">
      <OnboardingProgressDots totalSteps={7} currentStep={4} />

      <Heading size="2xl" className="mt-6 mb-2">
        Set up your first apiary
      </Heading>
      <Text size="md" className="text-typography-500 mb-8">
        You can add more apiaries later
      </Text>

      <Text size="sm" className="text-typography-600 mb-2 font-medium">
        Apiary name
      </Text>
      <TextInput
        className="border-2 border-outline-200 rounded-xl px-4 py-3 text-base text-typography-800 mb-6"
        placeholder="e.g., Backyard, North Field"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={(text) => setName(text.slice(0, 50))}
        maxLength={50}
        accessibilityLabel="Apiary name"
        testID="apiary-name-input"
      />

      <Text size="sm" className="text-typography-600 mb-2 font-medium">
        Number of hives
      </Text>
      <View className="flex-row items-center gap-4 mb-8">
        <Button
          action="secondary"
          variant="outline"
          size="lg"
          onPress={() => setHiveCount(Math.max(1, hiveCount - 1))}
          disabled={hiveCount <= 1}
          accessibilityLabel="Decrease hive count"
          testID="hive-decrement"
        >
          <ButtonText>
            <Ionicons name="remove" size={20} />
          </ButtonText>
        </Button>

        <Text size="md" className="text-typography-800 font-bold min-w-[40px] text-center" testID="hive-count">
          {hiveCount}
        </Text>

        <Button
          action="secondary"
          variant="outline"
          size="lg"
          onPress={() => setHiveCount(Math.min(99, hiveCount + 1))}
          disabled={hiveCount >= 99}
          accessibilityLabel="Increase hive count"
          testID="hive-increment"
        >
          <ButtonText>
            <Ionicons name="add" size={20} />
          </ButtonText>
        </Button>
      </View>

      <Button
        action="primary"
        variant="solid"
        size="xl"
        onPress={handleNext}
        disabled={!name.trim()}
        accessibilityLabel="Continue to goal selection"
        testID="next-btn"
      >
        <ButtonText>Continue</ButtonText>
      </Button>
    </View>
  );
}
