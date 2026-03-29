import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText } from '../../components/ui/button';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background-0 justify-center items-center px-8">
      <View className="w-[72px] h-[72px] rounded-2xl bg-primary-500 items-center justify-center mb-6">
        <Text size="md" className="text-background-0 font-bold text-2xl">
          B
        </Text>
      </View>

      <Heading size="5xl" className="text-primary-500 mb-2 text-center">
        Broodly
      </Heading>
      <Text size="md" className="text-typography-500 text-center mb-10">
        Make the right decision at the right moment with confidence
      </Text>

      <View className="w-full gap-4">
        <Button
          action="primary"
          variant="solid"
          size="xl"
          onPress={() => router.push('/(onboarding)/create-account')}
          testID="get-started-btn"
          accessibilityLabel="Get Started"
        >
          <ButtonText>Get Started</ButtonText>
        </Button>

        <Button
          action="primary"
          variant="outline"
          size="lg"
          onPress={() => router.push('/(auth)/sign-in')}
          testID="sign-in-btn"
          accessibilityLabel="Sign In"
        >
          <ButtonText>Sign In</ButtonText>
        </Button>
      </View>

      <Text size="xs" className="text-typography-400 text-center mt-8">
        Field-first beekeeping decisions, powered by your observations
      </Text>
    </View>
  );
}
