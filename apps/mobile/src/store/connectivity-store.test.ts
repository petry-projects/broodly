import { useConnectivityStore } from './connectivity-store';

beforeEach(() => {
  // Reset to default state
  useConnectivityStore.setState({
    isOnline: true,
    lastOfflineAt: null,
  });
});

describe('Connectivity store', () => {
  it('initializes with isOnline: true', () => {
    expect(useConnectivityStore.getState().isOnline).toBe(true);
  });

  it('initializes with lastOfflineAt: null', () => {
    expect(useConnectivityStore.getState().lastOfflineAt).toBeNull();
  });

  it('setOffline sets isOnline to false', () => {
    useConnectivityStore.getState().setOffline();
    expect(useConnectivityStore.getState().isOnline).toBe(false);
  });

  it('setOffline records lastOfflineAt timestamp', () => {
    const before = new Date();
    useConnectivityStore.getState().setOffline();
    const after = new Date();

    const lastOfflineAt = useConnectivityStore.getState().lastOfflineAt;
    expect(lastOfflineAt).not.toBeNull();
    expect(lastOfflineAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(lastOfflineAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('setOnline sets isOnline to true', () => {
    useConnectivityStore.getState().setOffline();
    expect(useConnectivityStore.getState().isOnline).toBe(false);

    useConnectivityStore.getState().setOnline();
    expect(useConnectivityStore.getState().isOnline).toBe(true);
  });

  it('handles rapid online/offline transitions', () => {
    useConnectivityStore.getState().setOffline();
    useConnectivityStore.getState().setOnline();
    useConnectivityStore.getState().setOffline();

    expect(useConnectivityStore.getState().isOnline).toBe(false);
    expect(useConnectivityStore.getState().lastOfflineAt).not.toBeNull();
  });
});
