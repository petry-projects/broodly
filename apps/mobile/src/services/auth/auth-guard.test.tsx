import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthGuard } from './auth-guard';
import { Text } from 'react-native';

// Track redirect targets
let lastRedirectHref: string | null = null;

jest.mock('expo-router', () => ({
  useSegments: jest.fn(() => ['(tabs)']),
  Redirect: ({ href }: { href: string }) => {
    lastRedirectHref = href;
    return null;
  },
}));

jest.mock('../../store/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../../store/ui-store', () => ({
  useUIStore: jest.fn(),
}));

jest.mock('../../store/onboarding-store', () => ({
  useOnboardingStore: jest.fn(),
  getResumeRoute: jest.fn((step: number) => `/(onboarding)/step-${step}`),
}));

const { useSegments } = require('expo-router');
const { useAuthStore } = require('../../store/auth-store');
const { useUIStore } = require('../../store/ui-store');
const { useOnboardingStore, getResumeRoute } = require('../../store/onboarding-store');

function setupMocks({
  user = null,
  isLoading = false,
  onboardingComplete = false,
  currentStep = 0,
  segments = ['(tabs)'],
}: {
  user?: { uid: string } | null;
  isLoading?: boolean;
  onboardingComplete?: boolean;
  currentStep?: number;
  segments?: string[];
} = {}) {
  useSegments.mockReturnValue(segments);
  useAuthStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ user, isLoading })
  );
  useUIStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ onboardingComplete })
  );
  useOnboardingStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ currentStep })
  );
}

beforeEach(() => {
  lastRedirectHref = null;
  jest.clearAllMocks();
});

describe('AuthGuard', () => {
  it('renders children when authenticated and onboarding complete', () => {
    setupMocks({
      user: { uid: '123' },
      onboardingComplete: true,
      segments: ['(tabs)'],
    });

    const { getByText } = render(
      <AuthGuard>
        <Text>Protected Content</Text>
      </AuthGuard>
    );

    expect(getByText('Protected Content')).toBeTruthy();
  });

  it('shows loading spinner while auth state is loading', () => {
    setupMocks({ isLoading: true });

    const { getByTestId } = render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );

    expect(getByTestId('auth-loading')).toBeTruthy();
  });

  it('redirects to onboarding when not authenticated', () => {
    setupMocks({ user: null, segments: ['(tabs)'] });

    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );

    expect(lastRedirectHref).toBe('/(onboarding)');
  });

  it('redirects to onboarding resume step when onboarding incomplete', () => {
    setupMocks({
      user: { uid: '123' },
      onboardingComplete: false,
      currentStep: 3,
      segments: ['(tabs)'],
    });
    getResumeRoute.mockReturnValue('/(onboarding)/step-3');

    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );

    expect(getResumeRoute).toHaveBeenCalledWith(3);
    expect(lastRedirectHref).toBe('/(onboarding)/step-3');
  });

  it('allows unauthenticated access to onboarding group', () => {
    setupMocks({ user: null, segments: ['(onboarding)'] });

    const { getByText } = render(
      <AuthGuard>
        <Text>Onboarding Content</Text>
      </AuthGuard>
    );

    expect(getByText('Onboarding Content')).toBeTruthy();
  });

  it('redirects authenticated user away from auth group to tabs', () => {
    setupMocks({
      user: { uid: '123' },
      onboardingComplete: true,
      segments: ['(auth)'],
    });

    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );

    expect(lastRedirectHref).toBe('/(tabs)');
  });
});
