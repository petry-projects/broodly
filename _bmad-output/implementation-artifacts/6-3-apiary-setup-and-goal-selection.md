# Story 6.3: Apiary Setup and Goal Selection

Status: done

## Story

As a new user,
I want to set up my first apiary with name, location, and hive count, and select my management goals and interaction preference,
so that I get relevant, personalized recommendations immediately after onboarding.

## Acceptance Criteria (BDD)

1. GIVEN onboarding step 4 WHEN the apiary setup screen loads THEN it displays a name input (pre-filled "Backyard Apiary"), a location map placeholder (defaulting to the region set in step 3), and a hive count stepper.
2. GIVEN the apiary setup screen WHEN I enter an apiary name THEN it validates (non-empty, max 50 characters) with inline error messaging.
3. GIVEN the apiary setup screen WHEN I use the hive count stepper THEN the value increments/decrements between 1 and 99 with the current count displayed prominently (24px semibold).
4. GIVEN the apiary setup screen WHEN I tap the location map area THEN I can adjust the apiary pin location (or it defaults to the region location from step 3).
5. GIVEN the apiary setup screen WHEN I tap "Continue" with a valid apiary name and hive count >= 1 THEN the apiary data is stored in Zustand onboarding state and I proceed to step 5.
6. GIVEN the apiary setup screen WHEN the info Alert is displayed THEN it reads: "Don't worry about naming individual hives now -- you can do that from the apiary view."
7. GIVEN onboarding step 5 WHEN the goal selection screen loads THEN a chip grid displays four goals: Colony Health, Honey Production, Learning, and Growth, with multi-select behavior.
8. GIVEN the goal selection screen WHEN I tap a goal chip THEN it toggles between selected (primary-500 border, primary-50 bg) and unselected states.
9. GIVEN the goal selection screen WHEN at least one goal is selected THEN the "Continue" button is enabled.
10. GIVEN the goal selection screen WHEN interaction preference cards are displayed THEN I can select between "Voice-first" and "Tap & read" (single-select, Card with selected variant).
11. GIVEN the goal selection screen WHEN I tap "Continue" with goals and interaction preference selected THEN selections are stored in Zustand and I proceed to the disclaimer/summary screens.
12. GIVEN the apiary setup screen WHEN progress dots render THEN steps 1-3 show as done and step 4 shows as active.

## Tasks / Subtasks

- [ ] Create apiary setup screen at `apps/mobile/app/(onboarding)/apiary-setup.tsx` (AC: #1, #2, #3, #4, #5, #6, #12)
  - [ ] Render progress dots (step 4 of 5, steps 1-3 done)
  - [ ] Render heading: "Set up your first apiary" (Heading 2xl)
  - [ ] Render subheading: "You can always add more apiaries later from Settings." (Text sm, typography-500)
  - [ ] Render apiary name FormControl with Input (pre-filled "Backyard Apiary"), validation (non-empty, max 50 chars)
  - [ ] Render location map placeholder (100px height, bg-muted, dashed border, defaults to region from step 3)
  - [ ] Render "How many hives?" label with stepper component (minus/plus buttons, 36px circular, value display 24px semibold)
  - [ ] Stepper constraints: min 1, max 99
  - [ ] Render info Alert (action="info"): "Don't worry about naming individual hives now..."
  - [ ] "Continue" button stores apiary data in Zustand and navigates forward
- [ ] Create goal selection screen at `apps/mobile/app/(onboarding)/goal-selection.tsx` (AC: #7, #8, #9, #10, #11)
  - [ ] Render progress dots (step 5 of 5, steps 1-4 done)
  - [ ] Render heading: "What matters most to you?" (Heading 2xl)
  - [ ] Render subheading: "Select all that apply. This shapes which recommendations you see first." (Text sm, typography-500)
  - [ ] Render 2x2 chip grid with four goals: Colony Health, Honey Production, Learning, Growth
  - [ ] Multi-select chip behavior: toggle selected state (chip-selected pattern)
  - [ ] Render divider
  - [ ] Render "How do you prefer to learn?" label (Text md, semibold)
  - [ ] Render two interaction preference Cards (single-select): "Voice-first" (mic icon) and "Tap & read" (clipboard icon)
  - [ ] Card selected state: primary-500 border, primary-50 bg
  - [ ] "Continue" button enabled when >= 1 goal selected; stores in Zustand and navigates forward
- [ ] Create reusable HiveCountStepper component in `packages/ui/` (AC: #3)
  - [ ] Accept `value`, `onValueChange`, `min`, `max` props
  - [ ] Render circular minus/plus buttons (36px, outline-300 border) and center value (24px semibold)
  - [ ] Disable minus at min, plus at max
  - [ ] Minimum touch target 48x48px for buttons
- [ ] Create reusable GoalChip component in `packages/ui/` (AC: #8)
  - [ ] Accept `label`, `selected`, `onPress` props
  - [ ] Render with chip styling: 12px padding, outline-200 border, radius-sm
  - [ ] Selected state: primary-500 border, primary-50 bg, primary-600 text
- [ ] Write unit tests (AC: all)
  - [ ] Test: Apiary setup renders name input pre-filled with "Backyard Apiary"
  - [ ] Test: Name validation rejects empty string and strings > 50 chars
  - [ ] Test: Stepper increments and decrements correctly within 1-99 range
  - [ ] Test: Stepper minus button disabled at value 1, plus disabled at 99
  - [ ] Test: Continue stores apiary data in Zustand
  - [ ] Test: Goal selection renders four chips
  - [ ] Test: Chip tap toggles selected state (multi-select)
  - [ ] Test: Continue disabled when no goals selected
  - [ ] Test: Interaction preference is single-select between Voice-first and Tap & read
  - [ ] Test: All selections persist to Zustand onboarding store

## Dev Notes

### Architecture Compliance

- Apiary and hive records are created via GraphQL mutations after onboarding completes (Story 6.4 summary screen triggers server sync)
- Goals stored as JSONB array on user profile: `['colony_health', 'honey_production', 'learning', 'growth']`
- Interaction preference stored as `interaction_mode: 'voice_first' | 'tap_and_read'` on user profile
- Hive count creates N placeholder hives named "Hive 1", "Hive 2", etc. (user renames later from apiary view)

### TDD Requirements (Tests First!)

- Write stepper min/max boundary tests before implementing HiveCountStepper
- Write chip toggle tests before implementing GoalChip
- Write form validation tests before implementing apiary setup screen
- Mock Zustand store for state persistence tests

### Technical Specifications

- **Screens:** `apps/mobile/app/(onboarding)/apiary-setup.tsx`, `apps/mobile/app/(onboarding)/goal-selection.tsx`
- **Shared components:** `packages/ui/src/HiveCountStepper/index.tsx`, `packages/ui/src/GoalChip/index.tsx`
- **Zustand fields:** `apiary: { name, locationLat, locationLng, hiveCount }`, `goals: string[]`, `interactionMode: 'voice_first' | 'tap_and_read'`
- **Chip grid layout:** 2 columns, 8px gap, using NativeWind flex-wrap or grid pattern
- **Screen designs:** screens-batch1-onboarding.html screens 5 (First Apiary Setup) and 6 (Goal Selection)
- **FRs:** FR2, FR2b, FR3, FR4

### Anti-Patterns to Avoid

- Do NOT require naming individual hives during onboarding; only capture count
- Do NOT use a free-text input for hive count; use the stepper component for constrained input
- Do NOT make goals single-select; the spec requires multi-select
- Do NOT make interaction preference multi-select; it is single-select
- Do NOT trigger GraphQL mutations on this screen; defer to onboarding completion

### Project Structure Notes

- HiveCountStepper and GoalChip are reusable and go in `packages/ui/`
- Apiary setup screen reuses the map placeholder pattern from the region screen
- Goal chips use a consistent selected/unselected pattern shared with experience level cards

### References

- Screen designs: `/home/donpetry/broodly/_bmad-output/planning-artifacts/screens-batch1-onboarding.html` (screens 5-6)
- UX spec: `/home/donpetry/broodly/_bmad-output/planning-artifacts/ux-design-specification.md` (lines 461-467)
- Design system: `/home/donpetry/broodly/CLAUDE.md` (Card, FormControl, Button, spacing rules)
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` (Stories 6.2, 6.3)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Apiary setup with name input (50 char max) and hive count stepper (1-99), goal selection with multi-select chips (Colony Health, Honey Production, Learning, Growth), interaction mode single-select (Voice First, Tap & Read)

### File List
- apps/mobile/app/(onboarding)/apiary-setup.tsx
- apps/mobile/app/(onboarding)/goal-selection.tsx
