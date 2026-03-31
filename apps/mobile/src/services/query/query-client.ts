/**
 * Base query-client module for TypeScript resolution.
 * Metro bundler resolves .web.ts or .native.ts at runtime;
 * this file satisfies tsc --noEmit for non-platform-aware tooling.
 */
export { createQueryClient, queryPersister } from './query-client.web';
