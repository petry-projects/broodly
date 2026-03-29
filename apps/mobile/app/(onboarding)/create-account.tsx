import React, { useState } from 'react';
import { View, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from '../../components/ui/button';
import { OnboardingProgressDots } from '@broodly/ui/src/OnboardingProgressDots';
import { useOnboardingStore } from '../../src/store/onboarding-store';
import { useAuthStore } from '../../src/store/auth-store';
import { useConnectivityStore } from '../../src/store/connectivity-store';
import { mapFirebaseError } from '../../src/services/auth/error-messages';

export default function CreateAccountScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const tosAccepted = useOnboardingStore((s) => s.tosAccepted);
  const setTosAccepted = useOnboardingStore((s) => s.setTosAccepted);
  const setStep = useOnboardingStore((s) => s.setStep);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isOnline = useConnectivityStore((s) => s.isOnline);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const { signInWithGoogle } = await import('../../src/services/auth');
      const googleIdToken = '';
      await signInWithGoogle(googleIdToken);
      setStep(2);
      router.push('/(onboarding)/experience-level');
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const { signInWithApple } = await import('../../src/services/auth');
      await signInWithApple('', '');
      setStep(2);
      router.push('/(onboarding)/experience-level');
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  }

  function handleOfflineStart() {
    setStep(2);
    router.push('/(onboarding)/experience-level');
  }

  return (
    <View className="flex-1 bg-background-0 px-8 pt-16">
      <OnboardingProgressDots totalSteps={7} currentStep={1} />

      <Heading size="2xl" className="mt-6 mb-2">
        Create your account
      </Heading>
      <Text size="md" className="text-typography-500 mb-8">
        Sign in to save your data across devices
      </Text>

      {!isOnline && (
        <View className="bg-background-info rounded-lg p-3 mb-4" accessibilityRole="alert">
          <Text size="sm" className="text-info-600">
            You are offline. You can start onboarding now — your account will be created when you reconnect.
          </Text>
        </View>
      )}

      <Pressable
        className="flex-row items-center gap-3 mb-6 min-h-[48px]"
        onPress={() => setTosAccepted(!tosAccepted)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: tosAccepted }}
        accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
        testID="tos-checkbox"
      >
        <View
          className={`w-6 h-6 rounded border-2 items-center justify-center ${
            tosAccepted ? 'bg-primary-500 border-primary-500' : 'border-outline-300'
          }`}
        >
          {tosAccepted && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
        <Text size="sm" className="flex-1">
          I agree to the Terms of Service and Privacy Policy
        </Text>
      </Pressable>

      <View className="gap-4">
        {isOnline ? (
          <>
            <Button
              action="primary"
              variant="solid"
              size="xl"
              onPress={handleGoogleSignIn}
              disabled={!tosAccepted || isLoading}
              accessibilityLabel="Continue with Google"
              testID="google-sign-in"
            >
              {isLoading ? (
                <ButtonSpinner />
              ) : (
                <ButtonIcon as={() => <Ionicons name="logo-google" size={20} color="white" />} />
              )}
              <ButtonText>Continue with Google</ButtonText>
            </Button>

            {Platform.OS === 'ios' && (
              <Button
                action="primary"
                variant="outline"
                size="xl"
                onPress={handleAppleSignIn}
                disabled={!tosAccepted || isLoading}
                accessibilityLabel="Continue with Apple"
                testID="apple-sign-in"
              >
                {isLoading ? (
                  <ButtonSpinner />
                ) : (
                  <ButtonIcon as={() => <Ionicons name="logo-apple" size={20} color="rgb(212, 136, 15)" />} />
                )}
                <ButtonText>Continue with Apple</ButtonText>
              </Button>
            )}
          </>
        ) : (
          <Button
            action="primary"
            variant="solid"
            size="xl"
            onPress={handleOfflineStart}
            disabled={!tosAccepted}
            accessibilityLabel="Continue offline"
            testID="offline-continue"
          >
            <ButtonText>Continue Offline</ButtonText>
          </Button>
        )}
      </View>

      {error && (
        <View className="mt-4 bg-background-error rounded-lg p-3" accessibilityRole="alert">
          <Text size="sm" className="text-error-600 text-center">{error}</Text>
        </View>
      )}
    </View>
  );
}
