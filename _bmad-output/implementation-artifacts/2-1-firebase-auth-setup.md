# Story 2.1: Firebase Auth Setup — Google and Apple Sign-In

Status: ready-for-dev

## Story

As a new user,
I want to create an account with Google or Apple Sign-In,
so that I can access the app quickly using my preferred social login.

## Acceptance Criteria (BDD)

1. GIVEN a user on the sign-in screen WHEN they tap "Sign in with Google" THEN the Google OAuth flow launches, returns a Firebase credential, the auth state updates in the Zustand store, and the user is navigated to onboarding (new user) or the home screen (returning user).
2. GIVEN a user on an iOS device WHEN they tap "Sign in with Apple" THEN the Apple Sign-In flow launches, returns a Firebase credential, and the auth state updates in the Zustand store.
3. GIVEN a user who previously signed in WHEN the app relaunches THEN `onAuthStateChanged` restores the auth state from the persisted Firebase session without requiring re-login.
4. GIVEN any auth operation in progress WHEN the operation is pending THEN a loading spinner is displayed and the submit button is disabled.
5. GIVEN an auth operation WHEN it fails (network error, cancelled by user) THEN a human-readable error message is displayed via a toast notification with a recovery path.
6. GIVEN a signed-in user WHEN they tap "Sign Out" THEN Firebase signs them out, the Zustand auth store is cleared, and the user is navigated to the sign-in screen.

## Tasks / Subtasks

- [ ] Write unit tests for Firebase Auth client wrapper (AC: #1, #2)
  - [ ] Test: Google OAuth provider mock — assert redirect triggers and token captured
  - [ ] Test: Apple Sign-In provider mock — assert credential returned on iOS
  - [ ] Test: auth failure scenarios — network error, user cancelled return correct error types
- [ ] Write unit tests for Zustand auth store (AC: #1, #3, #6)
  - [ ] Test: `setUser` action stores uid, email, displayName, idToken
  - [ ] Test: `clearUser` action resets store to initial state
  - [ ] Test: `isAuthenticated` selector returns true when user is set, false when cleared
- [ ] Write unit tests for onAuthStateChanged listener (AC: #3)
  - [ ] Test: listener fires with user object on app launch when session exists
  - [ ] Test: listener fires with null when session does not exist
- [ ] Write component tests for loading/error states (AC: #4, #5)
  - [ ] Test: loading spinner renders when auth operation is pending
  - [ ] Test: submit button is disabled during pending operation
  - [ ] Test: error toast renders with message on auth failure
- [ ] Configure Firebase project with auth providers (AC: #1, #2)
  - [ ] Enable Google OAuth provider — configure OAuth consent screen
  - [ ] Enable Apple Sign-In provider — configure Apple Developer credentials
  - [ ] Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to `apps/mobile/`
- [ ] Install and configure `@react-native-firebase/auth` in `apps/mobile/` (AC: #1)
  - [ ] Install `@react-native-firebase/app` and `@react-native-firebase/auth`
  - [ ] Configure `app.json` / `app.config.ts` with Firebase plugin settings
  - [ ] Verify Expo managed workflow compatibility with React Native Firebase
- [ ] Implement Firebase Auth service wrapper in `apps/mobile/src/services/auth.ts` (AC: #1, #2)
  - [ ] `signInWithGoogle()` — wraps `GoogleAuthProvider` flow
  - [ ] `signInWithApple()` — wraps `AppleAuthProvider` flow (iOS only)
  - [ ] `signOut()` — wraps `auth().signOut()`
  - [ ] `getIdToken(forceRefresh?)` — wraps `currentUser.getIdToken()`
  - [ ] Error mapping: translate Firebase error codes to user-facing messages
- [ ] Implement Zustand auth store in `apps/mobile/src/store/auth-store.ts` (AC: #1, #3, #6)
  - [ ] State: `user { uid, email, displayName, idToken } | null`, `isLoading`, `error`
  - [ ] Actions: `setUser`, `clearUser`, `setLoading`, `setError`
  - [ ] Selectors: `isAuthenticated`, `currentUserId`
- [ ] Implement `onAuthStateChanged` listener in app root (AC: #3)
  - [ ] Subscribe in `useEffect` on app mount
  - [ ] On user: call `setUser` with uid, email, displayName; fetch fresh ID token
  - [ ] On null: call `clearUser`
  - [ ] Unsubscribe on unmount
- [ ] Implement loading and error state UI (AC: #4, #5)
  - [ ] Loading spinner overlay during auth operations
  - [ ] Disable form submission while loading
  - [ ] Toast notifications for errors using Gluestack `<Toast>`
  - [ ] Error messages include recovery path (e.g., "Check your connection" or "Try again")

## Dev Notes

### Architecture Compliance
- Auth state lives in a Zustand store (`apps/mobile/src/store/auth-store.ts`) per architecture.md frontend state model
- `@react-native-firebase/auth` is the sole auth client library per architecture.md
- Firebase ID tokens are short-lived (1 hour); client manages refresh via `getIdToken(true)` — server never handles refresh
- Auth service wrapper is in `apps/mobile/src/services/` per project structure convention
- No direct Firebase SDK calls from UI components — all auth operations go through the service wrapper
- Social login only (Google + Apple Sign-In) — no email/password authentication

### TDD Requirements (Tests First!)
- **Test 1:** Unit test `signInWithGoogle` — mock `GoogleAuthProvider`, assert `signInWithCredential` is called with the Google credential.
- **Test 2:** Unit test `signInWithApple` — mock `AppleAuthProvider` (conditionally skip on non-iOS in CI), assert credential flow completes.
- **Test 3:** Unit test Zustand auth store — call `setUser({ uid: 'test', email: 'a@b.com', displayName: 'Test' })`, assert `isAuthenticated` returns true. Call `clearUser()`, assert `isAuthenticated` returns false.
- **Test 4:** Unit test `onAuthStateChanged` listener — mock the listener callback firing with a user object, assert Zustand store updates. Mock it firing with null, assert store clears.
- **Test 5:** Unit test error mapping — pass Firebase error code `auth/network-request-failed`, assert human-readable message returned. Repeat for `auth/popup-closed-by-user`, `auth/cancelled-popup-request`.
- **Test 6:** Component test — render sign-in screen, trigger Google Sign-In, assert loading spinner appears and button is disabled. Mock auth failure, assert error toast appears.

### Technical Specifications
- **Package:** `@react-native-firebase/auth` v21.x with `@react-native-firebase/app` v21.x
- **Firebase providers:** Google OAuth (`GoogleAuthProvider`), Apple Sign-In (`OAuthProvider('apple.com')`)
- **Zustand version:** latest stable (5.x)
- **Token handling:** `getIdToken()` returns Firebase ID token (JWT); include in `Authorization: Bearer <token>` header for all API requests
- **ID token TTL:** 1 hour; client refreshes via `getIdToken(true)` before expiry
- **Platform notes:** Apple Sign-In required on iOS per App Store guidelines; optional on Android/web

### Anti-Patterns to Avoid
- DO NOT store Firebase ID tokens in AsyncStorage manually — `@react-native-firebase/auth` handles session persistence
- DO NOT call Firebase Auth directly from UI components — always go through the service wrapper
- DO NOT implement custom token refresh logic on the server — client manages refresh exclusively
- DO NOT hardcode Firebase config values — use `google-services.json` / `GoogleService-Info.plist` and environment config
- DO NOT skip error handling — every auth operation must handle and surface errors to the user
- DO NOT use `firebase/auth` (JS SDK) — use `@react-native-firebase/auth` (native SDK) for React Native
- DO NOT implement email/password authentication — social login only

### Project Structure Notes
- `apps/mobile/src/services/auth.ts` — Firebase Auth service wrapper
- `apps/mobile/src/services/auth.test.ts` — Unit tests for auth service
- `apps/mobile/src/store/auth-store.ts` — Zustand auth store
- `apps/mobile/src/store/auth-store.test.ts` — Unit tests for auth store
- `apps/mobile/google-services.json` — Android Firebase config (gitignored, provided via CI secrets)
- `apps/mobile/ios/GoogleService-Info.plist` — iOS Firebase config (gitignored, provided via CI secrets)

### References
- [Source: architecture.md#Authentication & Security — Firebase Authentication]
- [Source: architecture.md#Frontend Architecture — @react-native-firebase/auth]
- [Source: architecture.md#Core Architectural Decisions — Auth uses Firebase Authentication]
- [Source: epics.md#Story 2.1 — FR1a]
- [Source: CLAUDE.md#Tech Stack Quick Reference — Auth: Firebase Authentication (Google + Apple Sign-In only, no passwords)]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
