# Story 6.5: Mid-Season Catch-up and State Persistence

Status: ready-for-dev

## Story

As a user who onboards mid-season or who abandoned onboarding partway through,
I want to capture my current colony state through a guided catch-up checklist and resume onboarding from where I left off,
so that recommendations begin immediately with reasonable context and I never have to restart from scratch.

## Acceptance Criteria (BDD)

1. GIVEN a user onboards outside the typical season start window WHEN the system detects mid-season timing (based on region and date) THEN a "Catch-up Assessment" screen is inserted into the onboarding flow after apiary setup.
2. GIVEN the catch-up assessment screen WHEN it loads THEN a warning Alert displays: "You're joining mid-season. Let's capture where your colonies are now so we can give accurate guidance right away."
3. GIVEN the catch-up assessment screen WHEN the checklist is displayed THEN it shows five items with checkboxes: (a) Queen present and laying, (b) Colony strength: moderate or strong, (c) Treatments applied this season, (d) Honey supers on, (e) Any health concerns observed -- each with a descriptive subtitle.
4. GIVEN the catch-up assessment screen WHEN I check or uncheck items THEN the selections are stored in Zustand onboarding state as the synthetic baseline.
5. GIVEN the catch-up assessment screen WHEN the footer note is displayed THEN it reads: "Past milestones will show as 'not tracked' rather than 'missed.'"
6. GIVEN the catch-up assessment screen WHEN I tap "Save Baseline & Continue" THEN the baseline data is stored and I proceed to the disclaimer screen.
7. GIVEN the catch-up assessment is not needed (user onboards at season start) WHEN the onboarding flow progresses past goal selection THEN the catch-up screen is skipped and the user goes directly to the disclaimer.
8. GIVEN a user closes the app during onboarding WHEN they reopen the app THEN the onboarding resumes at the last completed step with all previous selections intact.
9. GIVEN a user has completed steps 1-3 and closed the app WHEN they reopen THEN step 4 (apiary setup) loads with progress dots showing steps 1-3 as done.
10. GIVEN the onboarding Zustand store WHEN the app launches THEN it checks `onboardingCompletedAt`; if null and steps exist, it routes to the appropriate resume step.
11. GIVEN an incomplete onboarding profile on the server WHEN the user reaches the homepage without completing onboarding THEN a "limited guidance" info banner is displayed indicating some features are restricted.
12. GIVEN the onboarding store persisted via MMKV WHEN the app is force-closed and reopened THEN all partial state is recovered without data loss.

## Tasks / Subtasks

- [ ] Create mid-season detection utility (AC: #1, #7)
  - [ ] Function: `isMidSeason(region: Region, date: Date): boolean`
  - [ ] Logic: compare current date against region's typical season start (e.g., if > 6 weeks past spring equinox for northern hemisphere)
  - [ ] Place in `apps/mobile/src/features/onboarding/utils/midSeasonDetection.ts`
- [ ] Create catch-up assessment screen at `apps/mobile/app/(onboarding)/catchup-assessment.tsx` (AC: #2, #3, #4, #5, #6)
  - [ ] Render warning Alert (action="warning") with calendar icon and mid-season messaging
  - [ ] Render heading: "Current colony state:" (Text md, semibold)
  - [ ] Render five Checkbox rows, each with:
    - Checkbox component (22px, primary-500 when checked)
    - Title text (Text sm, weight 500)
    - Subtitle text (Text xs, typography-500)
  - [ ] Checklist items:
    1. "Queen present and laying" / "Seen or evidence of fresh eggs"
    2. "Colony strength: moderate or strong" / "Bees covering 5+ frames"
    3. "Treatments applied this season" / "Varroa or other treatments"
    4. "Honey supers on" / "Active nectar collection"
    5. "Any health concerns observed" / "Disease, pest, or behavior issues"
  - [ ] Render footer note (Text xs, typography-500): past milestones message
  - [ ] Render "Save Baseline & Continue" Button (primary, xl)
  - [ ] Store checklist state in Zustand as `midSeasonBaseline` object
- [ ] Implement onboarding flow routing with mid-season conditional (AC: #1, #7)
  - [ ] After goal selection, check `isMidSeason()` to decide whether to show catch-up screen
  - [ ] If mid-season: route to catchup-assessment before disclaimer
  - [ ] If season start: route directly to disclaimer
- [ ] Implement Zustand onboarding store with MMKV persistence (AC: #8, #9, #10, #12)
  - [ ] Store in `apps/mobile/src/store/onboardingStore.ts`
  - [ ] State shape:
    ```typescript
    interface OnboardingState {
      currentStep: number; // 0-based index of last completed step
      email?: string;
      displayName?: string;
      experienceLevel?: 'newbie' | 'amateur' | 'sideliner';
      region?: { city: string; state: string; usdaZone: string; climate: string; lat: number; lng: number };
      seasonalContext?: SeasonalContext;
      apiary?: { name: string; locationLat: number; locationLng: number; hiveCount: number };
      goals?: string[];
      interactionMode?: 'voice_first' | 'tap_and_read';
      midSeasonBaseline?: MidSeasonBaseline;
      disclaimerAcceptedAt?: string;
      onboardingCompletedAt?: string;
    }
    ```
  - [ ] Persist with `zustand/middleware` persist using MMKV storage adapter
  - [ ] On each step completion, increment `currentStep` and persist
  - [ ] Expose `getResumeRoute()` selector that maps `currentStep` to the appropriate screen route
  - [ ] Expose `resetOnboarding()` action for dev/testing
- [ ] Implement app launch onboarding check (AC: #10)
  - [ ] In root layout (`apps/mobile/app/_layout.tsx`), check onboarding store
  - [ ] If `onboardingCompletedAt` is set: proceed to main app
  - [ ] If `onboardingCompletedAt` is null and `currentStep > 0`: route to resume step
  - [ ] If `onboardingCompletedAt` is null and `currentStep === 0`: route to welcome screen
- [ ] Implement limited guidance banner for incomplete profiles (AC: #11)
  - [ ] On the homepage, check if onboarding is incomplete or missing critical fields
  - [ ] If incomplete: render info Alert banner: "Complete your setup in Settings for personalized guidance"
  - [ ] Banner links to Settings where user can finish missing steps
- [ ] Write unit tests (AC: all)
  - [ ] Test: `isMidSeason` returns true for dates > 6 weeks past regional season start
  - [ ] Test: `isMidSeason` returns false for dates near season start
  - [ ] Test: Catch-up screen renders warning alert and all five checklist items
  - [ ] Test: Checkbox toggles update Zustand midSeasonBaseline
  - [ ] Test: "Save Baseline & Continue" stores data and navigates to disclaimer
  - [ ] Test: Flow skips catch-up screen when not mid-season
  - [ ] Test: Zustand store persists across simulated app close/reopen (MMKV mock)
  - [ ] Test: `getResumeRoute()` returns correct route for each step value
  - [ ] Test: App launch routes to resume step when onboarding is incomplete
  - [ ] Test: App launch routes to welcome when no onboarding state exists
  - [ ] Test: App launch routes to homepage when onboarding is complete
  - [ ] Test: Limited guidance banner renders when onboarding is incomplete

## Dev Notes

### Architecture Compliance

- Mid-season baseline creates a synthetic starting point so the recommendation engine (Epic 9) can begin with reasonable context
- The seasonal planning calendar (Epic 10) uses the baseline to show past milestones as "not tracked" rather than "missed"
- MMKV is the React Native persistence layer for Zustand; it survives app kills and device restarts
- The onboarding store is the single source of truth for all onboarding state across Stories 6.1-6.5

### TDD Requirements (Tests First!)

- Write `isMidSeason` tests with various date/region combinations before implementing
- Write Zustand store persistence tests with MMKV mock before implementing resume logic
- Write route resolution tests (`getResumeRoute`) before implementing app launch check
- Test catch-up checklist state independently from screen rendering

### Technical Specifications

- **Screen:** `apps/mobile/app/(onboarding)/catchup-assessment.tsx`
- **Store:** `apps/mobile/src/store/onboardingStore.ts` (central onboarding store for all stories)
- **Utilities:** `apps/mobile/src/features/onboarding/utils/midSeasonDetection.ts`
- **Persistence:** `zustand/middleware` persist with `react-native-mmkv` storage adapter
- **App launch check:** `apps/mobile/app/_layout.tsx` root layout
- **Limited guidance banner:** homepage component, conditionally rendered
- **Screen designs:** screens-batch1-onboarding.html screen 9 (Mid-Season Catch-up)
- **FRs:** FR2b, FR2c, FR12

### Anti-Patterns to Avoid

- Do NOT use AsyncStorage for onboarding persistence; use MMKV for performance and reliability
- Do NOT re-request already-completed onboarding steps on resume; skip to the next incomplete step
- Do NOT show "missed" language for past milestones; always use "not tracked"
- Do NOT block app usage entirely for incomplete onboarding; show degraded experience with guidance banner
- Do NOT store sensitive credentials (passwords) in the onboarding Zustand store; only store non-sensitive profile data

### Project Structure Notes

- The onboarding store (`onboardingStore.ts`) is created in Story 6.1 but fully specified here
- All five onboarding stories read from and write to this shared store
- The catch-up screen is conditionally inserted into the flow, not always present
- The root layout routing check is the entry point that determines the user's onboarding state

### References

- Screen designs: `/home/donpetry/broodly/_bmad-output/planning-artifacts/screens-batch1-onboarding.html` (screen 9)
- UX spec: `/home/donpetry/broodly/_bmad-output/planning-artifacts/ux-design-specification.md` (lines 482-484, mid-season variant)
- Design system: `/home/donpetry/broodly/CLAUDE.md` (Checkbox, Alert, Zustand + MMKV patterns)
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` (Story 6.5)

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
