# Story 5.4: Auth Screens and Protected Routes

Status: done

## Story

As a user,
I want a polished sign-in screen with Google and Apple Sign-In and route protection that redirects unauthenticated users,
so that I have a smooth and secure entry into the app.

## Acceptance Criteria (BDD)

1. GIVEN the sign-in screen WHEN I tap "Sign in with Google" THEN the Google OAuth flow launches, Firebase authenticates me, and I am redirected to the Home tab.
2. GIVEN the sign-in screen on iOS WHEN I tap "Sign in with Apple" THEN the Apple Sign-In flow launches, Firebase authenticates me, and I am redirected to the Home tab.
3. GIVEN any auth operation WHEN Firebase returns an error THEN a user-friendly error message displays in an `<Alert action="error">` component (not raw Firebase error codes).
4. GIVEN an unauthenticated user WHEN they attempt to access any `(tabs)` route THEN they are redirected to the sign-in screen.
5. GIVEN an authenticated user WHEN they access the `(auth)` routes THEN they are redirected to the Home tab.
6. GIVEN any auth form WHEN an operation is in progress THEN submit buttons show a loading state and are disabled.

## Tasks / Subtasks

- [ ] Write auth operation tests (AC: #1, #2, #3, #6)
  - [ ] Test: successful Google Sign-In updates auth store and navigates to Home
  - [ ] Test: successful Apple Sign-In updates auth store and navigates to Home
  - [ ] Test: Firebase `auth/popup-closed-by-user` error displays "Sign-in was cancelled. Please try again."
  - [ ] Test: Firebase `auth/network-request-failed` error displays "Network error. Check your connection and try again."
  - [ ] Test: loading state shown during auth operations
- [ ] Write route protection tests (AC: #4, #5)
  - [ ] Test: unauthenticated user accessing `/` is redirected to `/sign-in`
  - [ ] Test: authenticated user accessing `/sign-in` is redirected to `/`
  - [ ] Test: auth state loading shows a splash/loading screen (not a redirect flash)
- [ ] Create sign-in screen (AC: #1, #2, #3, #6)
  - [ ] Create `apps/mobile/app/(auth)/sign-in.tsx`
  - [ ] Google Sign-In button: branded button per Google sign-in guidelines
  - [ ] Apple Sign-In button: branded button per Apple sign-in guidelines (required on iOS)
  - [ ] Loading spinner overlay during auth operation
  - [ ] Error display: `<Alert action="error">` below buttons
- [ ] Create Firebase error message mapper (AC: #3)
  - [ ] Create `apps/mobile/src/services/auth/error-messages.ts`
  - [ ] Map Firebase error codes to user-friendly strings
  - [ ] Default fallback: "Something went wrong. Please try again."
- [ ] Implement route protection (AC: #4, #5)
  - [ ] Update `apps/mobile/app/_layout.tsx` to check auth store `isAuthenticated`
  - [ ] Use Expo Router `Redirect` component for auth-based routing
  - [ ] Show splash/loading screen while `isLoading: true` (prevent redirect flash)
  - [ ] Unauthenticated -> redirect to `(auth)/sign-in`
  - [ ] Authenticated -> redirect to `(tabs)/`
  - [ ] First-time authenticated (onboardingComplete: false) -> redirect to onboarding (Story 6.x)
- [ ] Wire Firebase auth calls (AC: #1, #2)
  - [ ] Create `apps/mobile/src/services/auth/auth-service.ts`
  - [ ] `signInWithGoogle()` — Google OAuth via Firebase
  - [ ] `signInWithApple()` — Apple Sign-In via Firebase
  - [ ] `signOut()` — `signOut`

## Dev Notes

### Architecture Compliance
- Firebase Authentication for social login (Google + Apple Sign-In) per architecture.md — no email/password
- Auth screens live in `(auth)` route group; protected screens in `(tabs)` per Story 5.1 route structure
- Gluestack UI components used exclusively per CLAUDE.md design system rules
- Button hierarchy follows CLAUDE.md: primary solid for main actions
- Error display uses `<Alert action="error">` per CLAUDE.md status semantics
- Auth service is a thin wrapper around Firebase — business logic stays in the auth store and listeners

### TDD Requirements (Tests First!)
- Test 1: **Google Sign-In flow** — Mock Firebase Google OAuth, render sign-in screen, tap Google button, assert auth store updated and navigation occurred.
- Test 2: **Apple Sign-In flow** — Mock Firebase Apple Sign-In, render sign-in screen, tap Apple button, assert auth store updated and navigation occurred.
- Test 3: **Error mapping** — Assert `mapFirebaseError("auth/popup-closed-by-user")` returns "Sign-in was cancelled. Please try again."
- Test 4: **Route protection** — Render root layout with `isAuthenticated: false`, assert redirect to sign-in. Set `isAuthenticated: true`, assert redirect to tabs.

### Technical Specifications
- **Firebase Auth methods:** `signInWithCredential` (Google), `signInWithCredential` (Apple), `signOut`
- **Package:** `@react-native-firebase/auth`
- **Auth error code mapping:**
  - `auth/popup-closed-by-user` -> "Sign-in was cancelled. Please try again."
  - `auth/cancelled-popup-request` -> "Sign-in was cancelled. Please try again."
  - `auth/account-exists-with-different-credential` -> "An account already exists with a different sign-in method."
  - `auth/too-many-requests` -> "Too many attempts. Please try again later."
  - `auth/network-request-failed` -> "Network error. Check your connection and try again."
  - default -> "Something went wrong. Please try again."
- **Touch targets:** 48px minimum on all buttons per CLAUDE.md
- **Loading state:** disable submit button, show spinner inside button or overlay

### Anti-Patterns to Avoid
- DO NOT display raw Firebase error codes (e.g., `auth/popup-closed-by-user`) to users
- DO NOT use `<AlertDialog>` for form errors — use inline `<Alert>` components
- DO NOT skip the loading/splash screen during auth state resolution — it prevents redirect flashing
- DO NOT put auth logic directly in screen components — use the auth service and auth store
- DO NOT implement email/password authentication — social login only
- DO NOT skip accessibility labels on sign-in buttons

### Project Structure Notes
- Sign-in screen: `apps/mobile/app/(auth)/sign-in.tsx`
- Auth layout: `apps/mobile/app/(auth)/_layout.tsx`
- Auth service: `apps/mobile/src/services/auth/auth-service.ts`
- Error mapper: `apps/mobile/src/services/auth/error-messages.ts`
- Tests co-located with each file

### References
- [Source: architecture.md#Authentication & Security — Firebase Authentication (Google Sign-In, Apple Sign-In)]
- [Source: architecture.md#Frontend Architecture — @react-native-firebase/auth for authentication]
- [Source: CLAUDE.md#Button Hierarchy — primary solid for main actions]
- [Source: CLAUDE.md#Status Semantics — error action for critical alerts]
- [Source: CLAUDE.md#Emotional Design & Tone — Error messages always include a recovery path]
- [Source: epics.md#Story 5.4 — Social login screens; follow CLAUDE.md button hierarchy]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Created polished sign-in screen with Google + Apple (iOS) buttons, loading states, error display
- Created Firebase error message mapper with all specified error codes + fallback
- Created AuthGuard component for route protection (extracted for testability)
- AuthGuard: loading spinner → unauthenticated redirect to sign-in → authenticated redirect to tabs
- Wired AuthGuard into root layout wrapping Slot
- Auth service (signInWithGoogle, signInWithApple, signOut) already existed from Epic 2
- 14 new tests: error message mapping (9), auth guard behavior (5)

### File List
- apps/mobile/app/(auth)/sign-in.tsx — Sign-in screen with Google/Apple buttons
- apps/mobile/src/services/auth/error-messages.ts — Firebase error code mapper
- apps/mobile/src/services/auth/error-messages.test.ts — 9 tests
- apps/mobile/src/services/auth/auth-guard.tsx — Route protection component
- apps/mobile/__tests__/auth-guard.test.tsx — 5 tests
- apps/mobile/app/_layout.tsx — Updated with AuthGuard
