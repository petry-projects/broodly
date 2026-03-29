import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../store/auth-store';

jest.mock('./account', () => ({
  updateDisplayName: jest.fn(),
  getLinkedProvider: jest.fn(() => 'google.com'),
}));

import { SettingsScreen } from './settings-screen';
const mockUpdateDisplayName = require('./account').updateDisplayName;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.getState().setUser({
    uid: 'test-uid',
    email: 'alice@test.com',
    displayName: 'Alice',
    idToken: 'token',
  });
});

describe('SettingsScreen', () => {
  it('renders current displayName and email', () => {
    render(<SettingsScreen />);

    const input = screen.getByTestId('display-name-input');
    expect(input.props.value).toBe('Alice');
    expect(screen.getByText('alice@test.com')).toBeTruthy();
  });

  it('shows loading spinner on save button during save', async () => {
    let resolvePromise: () => void;
    mockUpdateDisplayName.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('save-spinner')).toBeTruthy();
    });

    const saveBtn = screen.getByTestId('save-button');
    expect(saveBtn.props.accessibilityState?.disabled).toBe(true);

    resolvePromise!();
  });

  it('shows success message on successful update', async () => {
    mockUpdateDisplayName.mockResolvedValue(undefined);

    render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeTruthy();
    });

    expect(screen.getByText('Display name updated successfully')).toBeTruthy();
  });

  it('shows error message on failed update', async () => {
    mockUpdateDisplayName.mockRejectedValue(new Error('Network error. Please check your connection and try again.'));

    render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeTruthy();
    });

    expect(screen.getByText('Network error. Please check your connection and try again.')).toBeTruthy();
  });
});
