/**
 * Base mmkv-storage module for TypeScript resolution.
 * Metro bundler resolves .web.ts or .native.ts at runtime;
 * this file satisfies tsc --noEmit for non-platform-aware tooling.
 */
export { mmkvStorage } from './mmkv-storage.web';
