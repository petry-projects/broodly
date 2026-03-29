import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { useConnectivityStore } from '../../../../store/connectivity-store';
import { OfflineBanner } from './index';

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: true, lastOnlineAt: null });
});

describe('OfflineBanner', () => {
  it('does not render when online', () => {
    render(<OfflineBanner />);
    expect(screen.queryByText(/offline/i)).toBeNull();
  });

  it('renders banner when offline', () => {
    useConnectivityStore.setState({ isOnline: false });
    render(<OfflineBanner />);
    expect(screen.getByText(/You are offline/)).toBeTruthy();
  });

  it('shows cached data message', () => {
    useConnectivityStore.setState({ isOnline: false });
    render(<OfflineBanner />);
    expect(screen.getByText(/Showing cached data/)).toBeTruthy();
  });

  it('has accessibility role alert', () => {
    useConnectivityStore.setState({ isOnline: false });
    render(<OfflineBanner />);
    expect(
      screen.getByLabelText('You are offline. Showing cached data.')
    ).toBeTruthy();
  });

  it('disappears when going back online', () => {
    useConnectivityStore.setState({ isOnline: false });
    const { rerender } = render(<OfflineBanner />);
    expect(screen.getByText(/You are offline/)).toBeTruthy();

    act(() => {
      useConnectivityStore.setState({ isOnline: true });
    });
    rerender(<OfflineBanner />);
    expect(screen.queryByText(/You are offline/)).toBeNull();
  });
});
