import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useSegments } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';

/**
 * Route protection guard. Redirects based on auth state:
 * - Loading: shows spinner (prevents redirect flash)
 * - Unauthenticated + not in (auth): redirect to sign-in
 * - Authenticated + in (auth): redirect to tabs
 * - Otherwise: render children
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-background-0 justify-center items-center"
        testID="auth-loading"
      >
        <ActivityIndicator size="large" color="#D4880F" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}
