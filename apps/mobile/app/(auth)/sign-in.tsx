import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../components/ui/heading';
import { Text } from '../../components/ui/text';
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from '../../components/ui/button';
import { mapFirebaseError } from '../../src/services/auth/error-messages';

export default function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(method: 'google' | 'apple') {
    setError(null);
    setIsLoading(true);
    try {
      const auth = await import('../../src/services/auth');
      const result = method === 'google'
        ? await auth.signInWithGoogle()
        : await auth.signInWithApple();

      if (!result?.user) {
        // Redirect flow — result picked up on reload
        setError(null);
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      const message = (err as { message?: string }).message;
      setError(message || mapFirebaseError(code));
    } finally {
      setIsLoading(false);
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
          onPress={() => handleSignIn('google')}
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

        <Button
          action="primary"
          variant="outline"
          size="xl"
          onPress={() => handleSignIn('apple')}
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
