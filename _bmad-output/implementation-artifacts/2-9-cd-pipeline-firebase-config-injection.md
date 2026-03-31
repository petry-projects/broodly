# Story 2.9: CD Pipeline Firebase Config Injection

## Status: review

## Tasks
- [x] CI workflow (.github/workflows/ci.yml) with TypeScript and Go jobs
- [x] Firebase emulator env vars set for test jobs
- [x] .env generation from GitHub secrets for mobile builds
- [x] Native Firebase config injection for Android (google-services.json from base64 secret)
- [x] Native Firebase config injection for iOS (GoogleService-Info.plist from base64 secret)
- [x] All GitHub Actions pinned to commit SHAs
- [x] Test artifacts uploaded on failure
- [x] Validation tests for CI workflow structure (11 test cases)

## Dev Agent Record
### Implementation Notes
- ci.yml has 4 jobs: typescript, go, go-integration, mobile-build
- mobile-build job generates .env from secrets and injects native Firebase configs
- All action references use pinned commit SHAs for reproducibility
- New ci-config-validation.test.ts reads ci.yml and asserts required steps, env vars, and SHA pinning
- All 11 tests pass

### File List
- .github/workflows/ci.yml
- apps/mobile/__tests__/ci-config-validation.test.ts

### Change Log
- 2026-03-30: Created CI config validation tests
