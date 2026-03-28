# Story 6.4: Disclaimer and Onboarding Completion

Status: ready-for-dev

## Story

As a new user,
I want to review and accept the advisory-only disclaimer and see a summary of my setup before entering the app,
so that I understand guidance limitations and can verify my configuration is correct.

## Acceptance Criteria (BDD)

1. GIVEN the disclaimer screen loads WHEN I view it THEN it displays a warning icon, "Advisory-Only Guidance" heading, explanation text, and a bulleted list of what Broodly does not replace (veterinary advice, local association guidance, personal judgment, local regulations).
2. GIVEN the disclaimer screen WHEN the warning Alert is displayed THEN it reads: "Recommendations include confidence levels. Lower confidence means more uncertainty -- always consider the fallback guidance provided."
3. GIVEN the disclaimer screen WHEN the regional regulatory notice is displayed THEN it reads: "Treatment recommendations are filtered by your region's regulatory status where data is available."
4. GIVEN the disclaimer screen WHEN the acknowledgment checkbox is unchecked THEN the "I Understand" button is disabled.
5. GIVEN the disclaimer screen WHEN I check the acknowledgment checkbox ("I understand that Broodly provides advisory guidance, not professional advice") and tap "I Understand" THEN the disclaimer acceptance timestamp is stored and I proceed to the onboarding summary screen.
6. GIVEN the onboarding summary screen WHEN it loads THEN it displays all collected onboarding data: experience level, location, apiary name, hive count, goals, and sensor status in a summary card.
7. GIVEN the onboarding summary screen WHEN I review my setup THEN an info Alert reads: "You can change any of these anytime from Settings."
8. GIVEN the onboarding summary screen WHEN I tap "Start Using Broodly" THEN all onboarding data is persisted via GraphQL mutations (createUserProfile, createApiary, createHives), onboarding is marked complete, and I navigate to the Happy Context Homepage.
9. GIVEN the onboarding summary screen WHEN the GraphQL mutations fail (network error) THEN data remains in Zustand local store, an error Alert is shown, and a retry option is available.
10. GIVEN the disclaimer screen WHEN I have not yet accepted THEN the onboarding summary screen is not accessible (disclaimer blocks forward progress).

## Tasks / Subtasks

- [ ] Create disclaimer screen at `apps/mobile/app/(onboarding)/disclaimer.tsx` (AC: #1, #2, #3, #4, #5, #10)
  - [ ] Render warning icon (36px, centered)
  - [ ] Render "Advisory-Only Guidance" heading (Heading lg, bold, centered)
  - [ ] Render explanation text (Text sm, typography-500, line-height 1.6)
  - [ ] Render bulleted list: veterinary advice, local association guidance, personal judgment, local regulations
  - [ ] Render warning Alert (action="warning"): confidence levels and fallback guidance message
  - [ ] Render regulatory notice text (Text xs, typography-500)
  - [ ] Render Checkbox with label: "I understand that Broodly provides advisory guidance, not professional advice"
  - [ ] Render "I Understand" Button (primary, xl), disabled until checkbox checked
  - [ ] On acceptance: store `disclaimerAcceptedAt: ISO timestamp` in Zustand, navigate to summary
- [ ] Create onboarding summary screen at `apps/mobile/app/(onboarding)/summary.tsx` (AC: #6, #7, #8, #9)
  - [ ] Render Broodly logo (48px, centered)
  - [ ] Render "Welcome to Broodly" heading (Heading xl, primary-500, centered)
  - [ ] Render "Here's your setup at a glance:" subheading (Text sm, typography-500, centered)
  - [ ] Render summary card (bg-background-100, radius-sm, padding 16px) with rows:
    - Experience level (with icon)
    - Location (city, state)
    - Apiary name
    - Hive count
    - Goals (comma-separated)
    - Sensors (status)
  - [ ] Each summary row: label (typography-500) left, value (semibold) right, bottom border
  - [ ] Render info Alert: "You can change any of these anytime from Settings."
  - [ ] Render "Start Using Broodly" Button (primary, xl) with right arrow
  - [ ] On tap: execute GraphQL mutations to persist all onboarding data
  - [ ] Handle mutation success: set `onboardingCompletedAt` in Zustand and server, navigate to homepage
  - [ ] Handle mutation failure: show error Alert with retry button, keep data in local store
- [ ] Implement onboarding completion GraphQL mutations (AC: #8)
  - [ ] `completeOnboarding(input: CompleteOnboardingInput!): OnboardingResult!` — batched mutation that creates/updates user profile, apiary, and hives in a single request
  - [ ] Input includes: experienceLevel, region, apiary (name, location, hiveCount), goals, interactionMode, disclaimerAcceptedAt
  - [ ] On success, returns user profile with `onboarding_completed_at` timestamp
- [ ] Write unit tests (AC: all)
  - [ ] Test: Disclaimer renders all required text, warning alert, and regulatory notice
  - [ ] Test: "I Understand" button is disabled when checkbox unchecked
  - [ ] Test: Checking checkbox enables the button
  - [ ] Test: Acceptance stores timestamp in Zustand
  - [ ] Test: Summary screen renders all onboarding data from Zustand store
  - [ ] Test: Summary rows display correct labels and values
  - [ ] Test: "Start Using Broodly" triggers GraphQL mutations
  - [ ] Test: Mutation success navigates to homepage and sets onboardingCompletedAt
  - [ ] Test: Mutation failure shows error alert with retry option
  - [ ] Test: Disclaimer blocks access to summary if not accepted

## Dev Notes

### Architecture Compliance

- Disclaimer acceptance is a compliance requirement; timestamp must be stored both locally and server-side
- The `completeOnboarding` mutation is a single batched call to reduce network round-trips and ensure atomicity
- After onboarding completes, the app launch flow (Story 6.5) will skip onboarding and go directly to the homepage
- Telemetry connection (screen 7 in designs) is intentionally deferred to post-onboarding settings to keep flow under 3 minutes

### TDD Requirements (Tests First!)

- Write checkbox-disabled-button interaction tests before implementing disclaimer
- Write Zustand store shape tests for all onboarding fields before implementing summary
- Mock GraphQL mutations and test success/failure paths
- Test navigation guard: disclaimer must be accepted before summary is accessible

### Technical Specifications

- **Screens:** `apps/mobile/app/(onboarding)/disclaimer.tsx`, `apps/mobile/app/(onboarding)/summary.tsx`
- **GraphQL mutation:** `completeOnboarding(input: CompleteOnboardingInput!): OnboardingResult!`
- **Zustand fields:** `disclaimerAcceptedAt: string | null`, `onboardingCompletedAt: string | null`
- **Summary row pattern:** flex row, justify-between, 10px vertical padding, outline-200 bottom border
- **Screen designs:** screens-batch1-onboarding.html screens 10 (Disclaimer) and 8 (Summary)
- **FRs:** FR19a, FR2b, FR12b, FR12c

### Anti-Patterns to Avoid

- Do NOT soften the disclaimer to the point of being dismissible without acknowledgment; checkbox is mandatory
- Do NOT fire individual mutations for each data piece; use the batched `completeOnboarding` mutation
- Do NOT navigate to homepage on mutation failure; keep user on summary with retry
- Do NOT store disclaimer acceptance only locally; it must sync to server
- Do NOT show telemetry connection screen in the onboarding flow; it is deferred to Settings

### Project Structure Notes

- Disclaimer screen enforces a navigation guard: cannot proceed without acceptance
- Summary screen is the final onboarding step and the trigger for server-side persistence
- After successful completion, the `(onboarding)` route group is bypassed on future app launches

### References

- Screen designs: `/home/donpetry/broodly/_bmad-output/planning-artifacts/screens-batch1-onboarding.html` (screens 8, 10)
- UX spec: `/home/donpetry/broodly/_bmad-output/planning-artifacts/ux-design-specification.md` (lines 471-480)
- Design system: `/home/donpetry/broodly/CLAUDE.md` (Alert, Checkbox, Button, Card patterns)
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` (Story 6.4)

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
