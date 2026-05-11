import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from '../../components/ui/button';
import { useAuthStore } from '../../src/store/auth-store';

export default function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      // TODO: retrieve googleIdToken from @react-native-google-signin
      // Native SDK not yet integrated — guard against empty-credential Firebase call
      const googleIdToken = '';
      if (!googleIdToken) {
        setError('Google sign-in is not yet available in this build.');
        return;
      }
      const { signInWithGoogle } = await import('../../src/services/auth');
      await signInWithGoogle(googleIdToken);
    } catch (err) {
      // auth service maps Firebase error codes before re-throwing as plain Error
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    setError(null);
    setLoading(true);
    try {
      // TODO: retrieve token + nonce from expo-apple-authentication
      // Native SDK not yet integrated — guard against empty-credential Firebase call
      const appleIdToken = '';
      const nonce = '';
      if (!appleIdToken) {
        setError('Sign in with Apple is not yet available in this build.');
        return;
      }
      const { signInWithApple } = await import('../../src/services/auth');
      await signInWithApple(appleIdToken, nonce);
    } catch (err) {
      // auth service maps Firebase error codes before re-throwing as plain Error
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background-0 justify-center items-center px-8">
      <Heading size="3xl" className="mb-2 text-center">
        Welcome to Broodly
      </Heading>
      <Text size="md" className="text-typography-500 text-center mb-10">
        Sign in to start managing your apiaries
      </Text>

      <View className="w-full gap-4">
        <Button
          action="primary"
          variant="solid"
          size="xl"
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          accessibilityLabel="Sign in with Google"
          testID="google-sign-in"
        >
          {isLoading ? (
            <ButtonSpinner />
          ) : (
            <ButtonIcon as={() => <Ionicons name="logo-google" size={20} color="#FFFFFF" />} />
          )}
          <ButtonText>Sign in with Google</ButtonText>
        </Button>

        {Platform.OS === 'ios' && (
          <Button
            action="primary"
            variant="outline"
            size="xl"
            onPress={handleAppleSignIn}
            disabled={isLoading}
            accessibilityLabel="Sign in with Apple"
            testID="apple-sign-in"
          >
            {isLoading ? (
              <ButtonSpinner />
            ) : (
              <ButtonIcon as={() => <Ionicons name="logo-apple" size={20} color="#D4880F" />} />
            )}
            <ButtonText>Sign in with Apple</ButtonText>
          </Button>
        )}
      </View>

      {error && (
        <View
          className="mt-6 w-full bg-background-error rounded-lg p-4"
          accessibilityRole="alert"
        >
          <Text size="sm" className="text-error-600 text-center">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
