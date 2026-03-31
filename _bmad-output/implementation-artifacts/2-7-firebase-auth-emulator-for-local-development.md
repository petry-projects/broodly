# Story 2.7: Firebase Auth Emulator for Local Development

## Status: review

## Tasks
- [x] Firebase emulator config in firebase.json with auth on port 9099
- [x] connectAuthEmulator integration in apps/mobile/src/platform/firebase-web.ts
- [x] EXPO_PUBLIC_FIREBASE_USE_EMULATOR env var controls emulator connection
- [x] Custom emulator host via EXPO_PUBLIC_FIREBASE_EMULATOR_HOST
- [x] Emulator-safe defaults (fake-api-key, broodly-dev) when env vars unset
- [x] Tests verifying emulator connection logic (7 test cases)

## Dev Agent Record
### Implementation Notes
- firebase-web.ts conditionally calls connectAuthEmulator when EXPO_PUBLIC_FIREBASE_USE_EMULATOR=true
- Default emulator host is http://127.0.0.1:9099, overridable via env var
- Firebase config falls back to safe defaults for emulator-only development
- Test file uses jest.resetModules() to re-require the module with different env var combinations
- All 7 tests pass covering: emulator on, emulator off, emulator unset, custom host, default config, real config, app reuse

### File List
- apps/mobile/src/platform/firebase-web.ts
- apps/mobile/src/platform/__tests__/firebase-web.test.ts
- firebase.json

### Change Log
- 2026-03-30: Verified existing implementation and tests are complete
