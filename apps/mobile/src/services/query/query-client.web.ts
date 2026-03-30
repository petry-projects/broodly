import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Web persister using localStorage (MMKV is native-only).
 */
export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // quota exceeded
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  },
});

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
