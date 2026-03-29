import { useConnectivityStore } from './connectivity-store';

beforeEach(() => {
  // Reset to default state
  useConnectivityStore.setState({
    isOnline: true,
    lastOnlineAt: null,
  });
});

describe('Connectivity store', () => {
  it('initializes with isOnline: true', () => {
    expect(useConnectivityStore.getState().isOnline).toBe(true);
  });

  it('initializes with lastOnlineAt: null', () => {
    expect(useConnectivityStore.getState().lastOnlineAt).toBeNull();
  });

  it('setOffline sets isOnline to false', () => {
    useConnectivityStore.getState().setOffline();
    expect(useConnectivityStore.getState().isOnline).toBe(false);
  });

  it('setOffline records lastOnlineAt timestamp', () => {
    const before = new Date();
    useConnectivityStore.getState().setOffline();
    const after = new Date();

    const lastOnlineAt = useConnectivityStore.getState().lastOnlineAt;
    expect(lastOnlineAt).not.toBeNull();
    expect(lastOnlineAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(lastOnlineAt!.getTime()).toBeLessThanOrEqual(after.getTime());
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
    expect(useConnectivityStore.getState().lastOnlineAt).not.toBeNull();
  });
});
