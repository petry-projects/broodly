import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useSegments } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { useUIStore } from '../../store/ui-store';
import { useOnboardingStore, getResumeRoute } from '../../store/onboarding-store';

/**
 * Route protection guard. Redirects based on auth + onboarding state:
 * - Loading: shows spinner (prevents redirect flash)
 * - Unauthenticated + not in (auth)/(onboarding): redirect to onboarding welcome
 * - Authenticated + onboarding incomplete + not in (onboarding): redirect to resume onboarding step
 * - Authenticated + onboarding complete + in (auth)/(onboarding): redirect to tabs
 * - Otherwise: render children
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const isLoading = useAuthStore((s) => s.isLoading);
  const onboardingComplete = useUIStore((s) => s.onboardingComplete);
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const seasonalContext = useOnboardingStore((s) => s.seasonalContext);
  const midSeasonBaseline = useOnboardingStore((s) => s.midSeasonBaseline);

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
  const inOnboardingGroup = segments[0] === '(onboarding)';

  // Unauthenticated users can access (auth) and (onboarding) groups
  if (!isAuthenticated && !inAuthGroup && !inOnboardingGroup) {
    return <Redirect href="/(onboarding)" />;
  }

  // Authenticated but onboarding not complete: resume onboarding
  if (isAuthenticated && !onboardingComplete && !inOnboardingGroup) {
    const resumeRoute = getResumeRoute(currentStep, { seasonalContext, midSeasonBaseline });
    return <Redirect href={resumeRoute as `/${string}`} />;
  }

  // Authenticated + onboarding complete: redirect away from auth/onboarding
  if (isAuthenticated && onboardingComplete && (inAuthGroup || inOnboardingGroup)) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}
