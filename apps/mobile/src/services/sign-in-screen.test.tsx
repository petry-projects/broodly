import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SignInScreen } from './sign-in-screen';
import { useAuthStore } from '../store/auth-store';

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().clearUser();
});

describe('SignInScreen', () => {
  it('renders sign-in buttons', () => {
    render(<SignInScreen />);

    expect(screen.getByTestId('google-sign-in-button')).toBeTruthy();
  });

  it('shows loading spinner when auth operation is pending', () => {
    useAuthStore.getState().setLoading(true);

    render(<SignInScreen />);

    expect(screen.getByTestId('auth-loading-spinner')).toBeTruthy();
  });

  it('disables submit button during pending operation', () => {
    useAuthStore.getState().setLoading(true);

    render(<SignInScreen />);

    const googleButton = screen.getByTestId('google-sign-in-button');
    expect(googleButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows error message on auth failure', () => {
    useAuthStore.getState().setError('Network error. Please check your connection and try again.');

    render(<SignInScreen />);

    expect(
      screen.getByText('Network error. Please check your connection and try again.')
    ).toBeTruthy();
  });
});
