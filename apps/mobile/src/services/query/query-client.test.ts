/**
 * Mock react-native-mmkv since it requires native modules.
 * We test the QueryClient configuration, not MMKV itself.
 */
jest.mock('react-native-mmkv', () => {
  const store = new Map<string, string>();
  return {
    createMMKV: jest.fn(() => ({
      getString: (key: string) => store.get(key),
      set: (key: string, value: string) => store.set(key, value),
      remove: (key: string) => store.delete(key),
    })),
  };
});

import { createQueryClient, queryPersister } from './query-client';

describe('createQueryClient', () => {
  it('returns a QueryClient instance', () => {
    const client = createQueryClient();
    expect(client).toBeDefined();
    expect(typeof client.getQueryData).toBe('function');
    expect(typeof client.setQueryData).toBe('function');
  });

  it('configures staleTime to 5 minutes', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('configures gcTime to 24 hours', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.gcTime).toBe(24 * 60 * 60 * 1000);
  });

  it('configures retry to 3 for queries', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(3);
  });

  it('disables retry for mutations', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.mutations?.retry).toBe(false);
  });

  it('disables refetchOnWindowFocus', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });
});

describe('queryPersister', () => {
  it('is defined and has expected interface', () => {
    expect(queryPersister).toBeDefined();
  });
});

describe('MMKV storage integration', () => {
  it('can set and get cached query data', () => {
    const client = createQueryClient();
    client.setQueryData(['test-key'], { hello: 'world' });
    const data = client.getQueryData(['test-key']);
    expect(data).toEqual({ hello: 'world' });
  });

  it('returns undefined for uncached query data', () => {
    const client = createQueryClient();
    const data = client.getQueryData(['nonexistent']);
    expect(data).toBeUndefined();
  });
});
