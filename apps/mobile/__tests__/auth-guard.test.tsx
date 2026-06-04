import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useAuthStore } from '../src/store/auth-store';

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
  useAuthStore.setState({
    user: null,
    isLoading: false,
    error: null,
  });
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

  it('redirects unauthenticated user from tabs to sign-in', () => {
    useAuthStore.setState({ user: null, isLoading: false });
    mockUseSegments.mockReturnValue(['(tabs)']);
    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );
    expect(screen.getByTestId('redirect-/(auth)/sign-in')).toBeTruthy();
  });

  it('redirects authenticated user from auth to tabs', () => {
    useAuthStore.setState({
      user: {
        uid: 'user-1',
        email: 'test@example.com',
        displayName: 'Test',
        idToken: 'token',
      },
      isLoading: false,
    });
    mockUseSegments.mockReturnValue(['(auth)']);
    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );
    expect(screen.getByTestId('redirect-/(tabs)')).toBeTruthy();
  });

  it('renders children for authenticated user on tabs', () => {
    useAuthStore.setState({
      user: {
        uid: 'user-1',
        email: 'test@example.com',
        displayName: 'Test',
        idToken: 'token',
      },
      isLoading: false,
    });
    mockUseSegments.mockReturnValue(['(tabs)']);
    render(
      <AuthGuard>
        <Text>Content</Text>
      </AuthGuard>
    );
    expect(screen.getByText('Content')).toBeTruthy();
    expect(screen.queryByTestId(/redirect/)).toBeNull();
  });

  it('renders children for unauthenticated user on auth', () => {
    useAuthStore.setState({ user: null, isLoading: false });
    mockUseSegments.mockReturnValue(['(auth)']);
    render(
      <AuthGuard>
        <Text>Sign In Form</Text>
      </AuthGuard>
    );
    expect(screen.getByText('Sign In Form')).toBeTruthy();
    expect(screen.queryByTestId(/redirect/)).toBeNull();
  });
});
