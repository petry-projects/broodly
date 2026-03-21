# Story 6.1: Welcome and Account Creation Screens

Status: ready-for-dev

## Story

As a new user,
I want to see a clear value proposition on the welcome screen and create my account with email or social auth,
so that I can begin the onboarding flow with a personalized identity.

## Acceptance Criteria (BDD)

1. GIVEN the app is opened for the first time WHEN the welcome screen loads THEN the Broodly logo, tagline ("Make the right decision at the right moment with confidence"), "Get Started" primary button, and "Sign In" outline button are displayed.
2. GIVEN the welcome screen WHEN I tap "Get Started" THEN I navigate to the account creation screen with progress dots showing step 1 of 5.
3. GIVEN the account creation screen WHEN I enter a valid email, password, and display name and tap "Create Account" THEN a Firebase Auth account is created and I proceed to step 2.
4. GIVEN the account creation screen WHEN I tap "Apple" or "Google" social auth buttons THEN OAuth flow completes via Firebase Auth and I proceed to step 2.
5. GIVEN the account creation screen WHEN I do not check the Terms of Service and Privacy Policy checkbox THEN the "Create Account" button is disabled.
6. GIVEN the account creation screen WHEN email or password validation fails THEN inline error messages appear below the respective form field using Gluestack FormControl error styling.
7. GIVEN no network connectivity WHEN I am on the welcome screen and tap "Get Started" THEN local-only onboarding begins with a subtle info banner explaining account creation will complete when online.
8. GIVEN the welcome screen WHEN I tap "Sign In" THEN I navigate to the existing sign-in screen (Epic 5 auth flow).

## Tasks / Subtasks

- [ ] Create welcome screen route at `apps/mobile/app/(onboarding)/index.tsx` (AC: #1, #2)
  - [ ] Render Broodly logo (72px), app name (Heading 5xl, primary-500), tagline (Text md, typography-500)
  - [ ] Render "Get Started" button (`Button action="primary" variant="solid" size="xl"`)
  - [ ] Render "Sign In" button (`Button action="primary" variant="outline" size="lg"`)
  - [ ] Render field-first descriptor text (Text xs, typography-400)
  - [ ] Add navigation to onboarding step 1 and sign-in screen
- [ ] Create account creation screen at `apps/mobile/app/(onboarding)/create-account.tsx` (AC: #3, #4, #5, #6)
  - [ ] Render progress dots component showing step 1 of 5 (dot-active for step 1)
  - [ ] Render email FormControl with InputField, validation, and error display
  - [ ] Render password FormControl with InputField, validation (min 8 chars), and error display
  - [ ] Render display name FormControl with InputField
  - [ ] Render divider and "or continue with" text
  - [ ] Render social auth row: Apple and Google buttons (44px height, outline style)
  - [ ] Render "Create Account" primary xl button, disabled when ToS unchecked
  - [ ] Render ToS/Privacy checkbox using Gluestack Checkbox with linked text
  - [ ] Implement Firebase Auth email/password createUserWithEmailAndPassword
  - [ ] Implement Firebase Auth social OAuth (Apple, Google) sign-in
  - [ ] On success, call `createUserProfile` GraphQL mutation and navigate to step 2
- [ ] Create reusable OnboardingProgressDots component in `packages/ui/` (AC: #2)
  - [ ] Accept `totalSteps` and `currentStep` props
  - [ ] Render dots: done (success-500), active (primary-500), pending (outline-200)
  - [ ] 8px diameter dots with 6px gap, centered horizontally
- [ ] Implement offline-safe local account deferral (AC: #7)
  - [ ] Detect connectivity via NetInfo
  - [ ] When offline, store credentials in Zustand onboarding store and show info Alert
  - [ ] Proceed with local-only onboarding; queue account creation for when online
- [ ] Write unit tests (AC: all)
  - [ ] Test: Welcome screen renders logo, tagline, and both buttons
  - [ ] Test: "Get Started" navigates to create-account screen
  - [ ] Test: "Sign In" navigates to auth sign-in screen
  - [ ] Test: Create Account button is disabled when ToS checkbox is unchecked
  - [ ] Test: Valid form submission triggers Firebase Auth call
  - [ ] Test: Validation errors render inline below fields
  - [ ] Test: Social auth buttons trigger OAuth flows
  - [ ] Test: Offline mode shows info banner and proceeds locally

## Dev Notes

### Architecture Compliance

- Welcome screen is the entry point for the `(onboarding)` route group in Expo Router
- Firebase Auth integration from Epic 2; this story depends on auth infrastructure being available or mocked
- Zustand onboarding store persisted via MMKV for offline resilience (see Story 6.5)

### TDD Requirements (Tests First!)

- Write component render tests before implementing screens
- Mock Firebase Auth module for unit tests
- Mock GraphQL client for mutation tests
- Test offline detection and local state fallback

### Technical Specifications

- **Screens:** `apps/mobile/app/(onboarding)/index.tsx`, `apps/mobile/app/(onboarding)/create-account.tsx`
- **Shared component:** `packages/ui/src/OnboardingProgressDots/index.tsx`
- **Zustand store:** `apps/mobile/src/store/onboardingStore.ts` (created here, extended in 6.5)
- **GraphQL mutation:** `createUserProfile(input: CreateUserProfileInput!): UserProfile!`
- **Firebase methods:** `createUserWithEmailAndPassword`, `signInWithPopup` (Apple/Google providers)
- **Screen designs:** screens-batch1-onboarding.html screens 1 (Welcome) and 2 (Account Creation)
- **FRs:** FR1a, FR2b

### Anti-Patterns to Avoid

- Do NOT request microphone, camera, or location permissions on these screens
- Do NOT use hardcoded hex colors; use Gluestack design tokens (primary-500, typography-500, etc.)
- Do NOT skip ToS checkbox validation; it must block account creation
- Do NOT build custom input components; use Gluestack FormControl + Input + InputField

### Project Structure Notes

- Onboarding screens live under `apps/mobile/app/(onboarding)/` route group
- Shared UI components go in `packages/ui/src/`
- Feature-specific logic in `apps/mobile/src/features/onboarding/`

### References

- Screen designs: `/home/donpetry/broodly/_bmad-output/planning-artifacts/screens-batch1-onboarding.html` (screens 1-2)
- UX spec: `/home/donpetry/broodly/_bmad-output/planning-artifacts/ux-design-specification.md` (Journey 0, lines 451-480)
- Design system: `/home/donpetry/broodly/CLAUDE.md` (Gluestack Button, FormControl, Input patterns)
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` (Epic 6)

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
