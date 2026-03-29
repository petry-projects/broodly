import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from '../../components/ui/button';
import { useAuthStore } from '../../src/store/auth-store';
import { mapFirebaseError } from '../../src/services/auth/error-messages';

export default function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      // Google Sign-In flow — requires native module at runtime
      const { signInWithGoogle } = await import('../../src/services/auth');
      // In production, googleIdToken comes from @react-native-google-signin
      // Placeholder: actual OAuth token retrieval is wired in the native integration
      const googleIdToken = ''; // replaced by native Google Sign-In SDK
      await signInWithGoogle(googleIdToken);
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
      // In production, token + nonce come from expo-apple-authentication
      const appleIdToken = '';
      const nonce = '';
      await signInWithApple(appleIdToken, nonce);
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(mapFirebaseError(code));
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
            <ButtonIcon as={() => <Ionicons name="logo-google" size={20} color="white" />} />
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
              <ButtonIcon as={() => <Ionicons name="logo-apple" size={20} color="rgb(212, 136, 15)" />} />
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
