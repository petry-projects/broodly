# Story 5.4: Auth Screens and Protected Routes

Status: ready-for-dev

## Story

As a user,
I want polished sign-in, sign-up, and password reset screens with route protection that redirects unauthenticated users,
so that I have a smooth and secure entry into the app.

## Acceptance Criteria (BDD)

1. GIVEN the sign-in screen WHEN I enter a valid email and password and tap "Sign In" THEN Firebase authenticates me and I am redirected to the Home tab.
2. GIVEN the sign-in form WHEN I submit with an invalid email format or empty password THEN inline validation errors display before any network request.
3. GIVEN the sign-up screen WHEN I enter email, password, confirm password, and tap "Sign Up" THEN Firebase creates my account and I am redirected to onboarding.
4. GIVEN the sign-up form WHEN the password and confirm password do not match THEN an inline validation error displays.
5. GIVEN the password reset screen WHEN I enter my email and tap "Send Reset Link" THEN Firebase sends a recovery email and a success message displays.
6. GIVEN any auth operation WHEN Firebase returns an error THEN a user-friendly error message displays in an `<Alert action="error">` component (not raw Firebase error codes).
7. GIVEN an unauthenticated user WHEN they attempt to access any `(tabs)` route THEN they are redirected to the sign-in screen.
8. GIVEN an authenticated user WHEN they access the `(auth)` routes THEN they are redirected to the Home tab.
9. GIVEN any auth form WHEN an operation is in progress THEN submit buttons show a loading state and are disabled.

## Tasks / Subtasks

- [ ] Write form validation tests before implementation (AC: #2, #4)
  - [ ] Test: sign-in form rejects empty email field
  - [ ] Test: sign-in form rejects invalid email format
  - [ ] Test: sign-in form rejects empty password field
  - [ ] Test: sign-up form rejects password shorter than 8 characters
  - [ ] Test: sign-up form rejects mismatched password and confirm password
  - [ ] Test: sign-up form accepts valid inputs and enables submit
- [ ] Write auth operation tests (AC: #1, #3, #5, #6, #9)
  - [ ] Test: successful sign-in updates auth store and navigates to Home
  - [ ] Test: successful sign-up updates auth store and navigates to onboarding
  - [ ] Test: password reset sends email and shows success alert
  - [ ] Test: Firebase `auth/wrong-password` error displays "Incorrect email or password"
  - [ ] Test: Firebase `auth/user-not-found` error displays "No account found with this email"
  - [ ] Test: Firebase `auth/email-already-in-use` error displays "An account with this email already exists"
  - [ ] Test: loading state shown during auth operations
- [ ] Write route protection tests (AC: #7, #8)
  - [ ] Test: unauthenticated user accessing `/` is redirected to `/sign-in`
  - [ ] Test: authenticated user accessing `/sign-in` is redirected to `/`
  - [ ] Test: auth state loading shows a splash/loading screen (not a redirect flash)
- [ ] Create sign-in screen (AC: #1, #2, #6, #9)
  - [ ] Create `apps/mobile/app/(auth)/sign-in.tsx`
  - [ ] Email input: Gluestack `<Input><InputField>` with email keyboard type
  - [ ] Password input: Gluestack `<Input><InputField>` with secure text and show/hide toggle
  - [ ] Sign-in button: `<Button action="primary" variant="solid" size="xl">`
  - [ ] Social auth buttons: Google, Apple (placeholders, wired in Epic 2)
  - [ ] "Forgot password?" link: `<Button action="secondary" variant="link">`
  - [ ] "Don't have an account? Sign Up" link
  - [ ] Loading spinner overlay during auth operation
  - [ ] Error display: `<Alert action="error">` below form
- [ ] Create sign-up screen (AC: #3, #4, #6, #9)
  - [ ] Create `apps/mobile/app/(auth)/sign-up.tsx`
  - [ ] Email, password, confirm password inputs
  - [ ] Password strength indicator (minimum 8 chars, shown inline)
  - [ ] Sign-up button: `<Button action="primary" variant="solid" size="xl">`
  - [ ] Social auth buttons (placeholders)
  - [ ] "Already have an account? Sign In" link
  - [ ] Navigation to onboarding on successful sign-up
- [ ] Create password reset screen (AC: #5, #6, #9)
  - [ ] Create `apps/mobile/app/(auth)/reset-password.tsx`
  - [ ] Email input
  - [ ] Submit button: `<Button action="primary" variant="solid" size="xl">`
  - [ ] Success feedback: `<Alert action="success">` with "Check your email" message
  - [ ] "Back to Sign In" link
- [ ] Create Firebase error message mapper (AC: #6)
  - [ ] Create `apps/mobile/src/services/auth/error-messages.ts`
  - [ ] Map Firebase error codes to user-friendly strings
  - [ ] Default fallback: "Something went wrong. Please try again."
- [ ] Create form validation utilities (AC: #2, #4)
  - [ ] Create `apps/mobile/src/services/auth/validation.ts`
  - [ ] `validateEmail(email)` — format check
  - [ ] `validatePassword(password)` — minimum length, non-empty
  - [ ] `validatePasswordMatch(password, confirm)` — equality check
- [ ] Implement route protection (AC: #7, #8)
  - [ ] Update `apps/mobile/app/_layout.tsx` to check auth store `isAuthenticated`
  - [ ] Use Expo Router `Redirect` component for auth-based routing
  - [ ] Show splash/loading screen while `isLoading: true` (prevent redirect flash)
  - [ ] Unauthenticated -> redirect to `(auth)/sign-in`
  - [ ] Authenticated -> redirect to `(tabs)/`
  - [ ] First-time authenticated (onboardingComplete: false) -> redirect to onboarding (Story 6.x)
- [ ] Wire Firebase auth calls (AC: #1, #3, #5)
  - [ ] Create `apps/mobile/src/services/auth/auth-service.ts`
  - [ ] `signIn(email, password)` — `signInWithEmailAndPassword`
  - [ ] `signUp(email, password)` — `createUserWithEmailAndPassword`
  - [ ] `resetPassword(email)` — `sendPasswordResetEmail`
  - [ ] `signOut()` — `signOut`

## Dev Notes

### Architecture Compliance
- Firebase Authentication for email/password and OAuth per architecture.md
- Auth screens live in `(auth)` route group; protected screens in `(tabs)` per Story 5.1 route structure
- Gluestack UI components used exclusively per CLAUDE.md design system rules
- Button hierarchy follows CLAUDE.md: primary solid for main actions, secondary link for utility
- Error display uses `<Alert action="error">` per CLAUDE.md status semantics
- Auth service is a thin wrapper around Firebase — business logic stays in the auth store and listeners

### TDD Requirements (Tests First!)
- Test 1: **Email validation** — Assert `validateEmail("")` returns error, `validateEmail("bad")` returns error, `validateEmail("user@example.com")` returns valid.
- Test 2: **Password validation** — Assert `validatePassword("")` fails, `validatePassword("short")` fails, `validatePassword("validpass1")` passes.
- Test 3: **Sign-in flow** — Mock Firebase `signInWithEmailAndPassword`, render sign-in screen, fill form, submit, assert auth store updated and navigation occurred.
- Test 4: **Error mapping** — Assert `mapFirebaseError("auth/wrong-password")` returns "Incorrect email or password."
- Test 5: **Route protection** — Render root layout with `isAuthenticated: false`, assert redirect to sign-in. Set `isAuthenticated: true`, assert redirect to tabs.

### Technical Specifications
- **Firebase Auth methods:** `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`, `signOut`
- **Package:** `@react-native-firebase/auth`
- **Minimum password length:** 8 characters
- **Auth error code mapping:**
  - `auth/wrong-password` -> "Incorrect email or password."
  - `auth/user-not-found` -> "No account found with this email."
  - `auth/email-already-in-use` -> "An account with this email already exists."
  - `auth/too-many-requests` -> "Too many attempts. Please try again later."
  - `auth/network-request-failed` -> "Network error. Check your connection and try again."
  - default -> "Something went wrong. Please try again."
- **Touch targets:** 48px minimum on all buttons and inputs per CLAUDE.md
- **Loading state:** disable submit button, show spinner inside button or overlay

### Anti-Patterns to Avoid
- DO NOT display raw Firebase error codes (e.g., `auth/wrong-password`) to users
- DO NOT use `<AlertDialog>` for form errors — use inline `<Alert>` components
- DO NOT store passwords or sensitive auth data in Zustand or MMKV
- DO NOT skip the loading/splash screen during auth state resolution — it prevents redirect flashing
- DO NOT put auth logic directly in screen components — use the auth service and auth store
- DO NOT implement social auth (Google/Apple) in this story — add placeholder buttons only (wired in Epic 2)
- DO NOT validate on every keystroke — validate on blur and on submit
- DO NOT skip accessibility labels on form inputs

### Project Structure Notes
- Sign-in screen: `apps/mobile/app/(auth)/sign-in.tsx`
- Sign-up screen: `apps/mobile/app/(auth)/sign-up.tsx`
- Reset password screen: `apps/mobile/app/(auth)/reset-password.tsx`
- Auth layout: `apps/mobile/app/(auth)/_layout.tsx`
- Auth service: `apps/mobile/src/services/auth/auth-service.ts`
- Error mapper: `apps/mobile/src/services/auth/error-messages.ts`
- Validation utils: `apps/mobile/src/services/auth/validation.ts`
- Tests co-located with each file

### References
- [Source: architecture.md#Authentication & Security — Firebase Authentication email/password, Google OAuth, Apple Sign-In]
- [Source: architecture.md#Frontend Architecture — @react-native-firebase/auth for authentication]
- [Source: CLAUDE.md#Button Hierarchy — primary solid for main actions, secondary link for utility]
- [Source: CLAUDE.md#Status Semantics — error action for critical alerts]
- [Source: CLAUDE.md#Emotional Design & Tone — Error messages always include a recovery path]
- [Source: epics.md#Story 5.4 — Gluestack Input, Button, Alert; follow CLAUDE.md button hierarchy]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
