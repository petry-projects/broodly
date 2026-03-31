import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useAuthStore } from '../src/store/auth-store';
import { useUIStore } from '../src/store/ui-store';
import { useOnboardingStore } from '../src/store/onboarding-store';

// Mock expo-router
const mockUseSegments = jest.fn<string[], []>(() => ['(tabs)']);
jest.mock('expo-router', () => {
  const RN = require('react-native');
  const ReactMock = require('react');
  return {
    Redirect: ({ href }: { href: string }) =>
      ReactMock.createElement(RN.Text, { testID: `redirect-${href}` }, `Redirect to ${href}`),
    useSegments: () => mockUseSegments(),
  };
});

import { AuthGuard } from '../src/services/auth/auth-guard';

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, isLoading: false, error: null });
  useUIStore.setState({ onboardingComplete: false, activeApiaryId: null });
  useOnboardingStore.getState().reset();
  mockUseSegments.mockReturnValue(['(tabs)']);
});

describe('AuthGuard', () => {
  it('shows loading indicator while auth state is resolving', () => {
    useAuthStore.setState({ isLoading: true });
    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );
    expect(screen.getByTestId('auth-loading')).toBeTruthy();
    expect(screen.queryByText('Content')).toBeNull();
  });

  it('redirects unauthenticated user from tabs to onboarding', () => {
    mockUseSegments.mockReturnValue(['(tabs)']);
    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );
    expect(screen.getByTestId('redirect-/(onboarding)')).toBeTruthy();
  });

  it('renders children for unauthenticated user on auth', () => {
    mockUseSegments.mockReturnValue(['(auth)']);
    render(
      <AuthGuard>
        <Text>Sign In Form</Text>
      </AuthGuard>
    );
    expect(screen.getByText('Sign In Form')).toBeTruthy();
    expect(screen.queryByTestId(/redirect/)).toBeNull();
  });

  it('renders children for unauthenticated user on onboarding', () => {
    mockUseSegments.mockReturnValue(['(onboarding)']);
    render(
      <AuthGuard>
        <Text>Onboarding</Text>
      </AuthGuard>
    );
    expect(screen.getByText('Onboarding')).toBeTruthy();
    expect(screen.queryByTestId(/redirect/)).toBeNull();
  });

  it('redirects authenticated user without onboarding to resume route', () => {
    useAuthStore.setState({
      user: { uid: 'u1', email: 'a@b.com', displayName: 'A', idToken: 't' },
      isLoading: false,
    });
    useOnboardingStore.getState().setStep(3);
    mockUseSegments.mockReturnValue(['(tabs)']);
    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );
    expect(screen.getByTestId('redirect-/(onboarding)/region-setup')).toBeTruthy();
  });

  it('renders children for authenticated user with completed onboarding on tabs', () => {
    useAuthStore.setState({
      user: { uid: 'u1', email: 'a@b.com', displayName: 'A', idToken: 't' },
      isLoading: false,
    });
    useUIStore.setState({ onboardingComplete: true });
    mockUseSegments.mockReturnValue(['(tabs)']);
    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );
    expect(screen.getByText('Content')).toBeTruthy();
    expect(screen.queryByTestId(/redirect/)).toBeNull();
  });

  it('redirects completed user from onboarding to tabs', () => {
    useAuthStore.setState({
      user: { uid: 'u1', email: 'a@b.com', displayName: 'A', idToken: 't' },
      isLoading: false,
    });
    useUIStore.setState({ onboardingComplete: true });
    mockUseSegments.mockReturnValue(['(onboarding)']);
    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );
    expect(screen.getByTestId('redirect-/(tabs)')).toBeTruthy();
  });
});
