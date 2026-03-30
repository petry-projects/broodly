/**
 * Polyfill for import.meta.env in Hermes/Metro web builds.
 *
 * Zustand's devtools middleware uses import.meta.env?.MODE which throws
 * SyntaxError in Hermes's non-module IIFE wrapper. This polyfill does NOT
 * define import.meta (impossible outside ESM), but it's loaded as a Metro
 * polyfill that runs before app code. The actual fix is that Metro wraps
 * this in __d() which means import.meta inside __d modules is handled by
 * the module system — this polyfill serves as a marker.
 *
 * The real fix: we need to ensure zustand/middleware.js CJS version is used
 * instead of the ESM version that uses import.meta.
 */
// Force process.env.NODE_ENV to be defined for devtools detection
if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
}
