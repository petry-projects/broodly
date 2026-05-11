import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Button, ButtonText } from '../../components/ui/button';
import { Text } from '../../components/ui/text';
import { useAuthStore } from '../store/auth-store';

export function SignInScreen() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  return (
    <View
      className="flex-1 justify-center items-center p-6"
      testID="sign-in-screen"
    >
      {isLoading && <ActivityIndicator testID="auth-loading-spinner" size="large" />}

      {error && (
        <Text size="md" className="text-error-600 mb-4" testID="auth-error-message">
          {error}
        </Text>
      )}

      <Button
        testID="google-sign-in-button"
        action="primary"
        variant="solid"
        size="xl"
        disabled={isLoading}
        accessibilityLabel="Sign in with Google"
        className="mb-4 min-w-[280px]"
      >
        <ButtonText>Sign in with Google</ButtonText>
      </Button>

      {Platform.OS === 'ios' && (
        <Button
          testID="apple-sign-in-button"
          action="primary"
          variant="solid"
          size="xl"
          disabled={isLoading}
          accessibilityLabel="Sign in with Apple"
          className="min-w-[280px]"
        >
          <ButtonText>Sign in with Apple</ButtonText>
        </Button>
      )}
    </View>
  );
}
