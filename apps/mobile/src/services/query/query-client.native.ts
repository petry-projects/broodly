import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createMMKV } from 'react-native-mmkv';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 24 * 60 * 60 * 1000; // 24 hours

const storage = createMMKV({ id: 'broodly-query-cache' });

/**
 * MMKV-backed persister for TanStack Query.
 * Stores serialized query cache for offline-first reads.
 */
export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => storage.getString(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => { storage.remove(key); },
  },
});

/**
 * Singleton QueryClient with cache-first defaults.
 * staleTime: 5min — data considered fresh for 5 minutes.
 * gcTime: 24h — cached data retained for 24 hours.
 * retry: 3 — retry transient failures with exponential backoff.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        retry: 3,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
