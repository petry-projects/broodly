jest.mock('@react-native-community/netinfo', () => {
  let callback: ((state: { isConnected: boolean }) => void) | null = null;
  return {
    __esModule: true,
    default: {
      addEventListener: jest.fn((cb: (state: { isConnected: boolean }) => void) => {
        callback = cb;
        return jest.fn(() => {
          callback = null;
        });
      }),
    },
    // Helper to simulate state changes in tests
    __simulateChange: (isConnected: boolean) => {
      if (callback) callback({ isConnected });
    },
  };
});

import { useConnectivityStore } from '../../store/connectivity-store';
import { startConnectivityListener } from './connectivity-listener';

const NetInfoMock = jest.requireMock('@react-native-community/netinfo');

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: true, lastOnlineAt: null });
});

describe('Connectivity listener', () => {
  it('subscribes to NetInfo on start', () => {
    const unsubscribe = startConnectivityListener();
    expect(NetInfoMock.default.addEventListener).toHaveBeenCalled();
    unsubscribe();
  });

  it('sets store offline when NetInfo reports disconnected', () => {
    const unsubscribe = startConnectivityListener();
    NetInfoMock.__simulateChange(false);

    expect(useConnectivityStore.getState().isOnline).toBe(false);
    expect(useConnectivityStore.getState().lastOnlineAt).not.toBeNull();
    unsubscribe();
  });

  it('sets store online when NetInfo reports connected', () => {
    const unsubscribe = startConnectivityListener();
    NetInfoMock.__simulateChange(false);
    NetInfoMock.__simulateChange(true);

    expect(useConnectivityStore.getState().isOnline).toBe(true);
    unsubscribe();
  });

  it('returns unsubscribe function', () => {
    const unsubscribe = startConnectivityListener();
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
