import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useAuthStore } from '../store/auth-store';

export function SignInScreen() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);

  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
      testID="sign-in-screen"
    >
      {isLoading && <ActivityIndicator testID="auth-loading-spinner" size="large" />}

      {error && (
        <Text style={{ color: '#A63D2F', marginBottom: 16 }} testID="auth-error-message">
          {error}
        </Text>
      )}

      <TouchableOpacity
        testID="google-sign-in-button"
        disabled={isLoading}
        accessibilityState={{ disabled: isLoading }}
        accessibilityRole="button"
        accessibilityLabel="Sign in with Google"
        style={{ marginBottom: 16, minHeight: 48, minWidth: 280, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text>Sign in with Google</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity
          testID="apple-sign-in-button"
          disabled={isLoading}
          accessibilityState={{ disabled: isLoading }}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Apple"
          style={{ minHeight: 48, minWidth: 280, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text>Sign in with Apple</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
