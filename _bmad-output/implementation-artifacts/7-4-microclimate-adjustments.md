# Story 7.4: Microclimate Adjustments

Status: ready-for-dev

## Story

As a beekeeper,
I want to apply microclimate adjustments to my apiaries including elevation offset and bloom timing offset, and receive location divergence prompts and regional baseline resets,
so that seasonal guidance is accurately tuned to my specific apiary conditions rather than generic regional defaults.

**FRs:** FR8a, FR8b, FR11a, FR11b

## Acceptance Criteria (BDD)

1. GIVEN the apiary create or edit form WHEN the microclimate section renders THEN it displays elevation offset and bloom timing offset fields with clear labels and help text explaining their effect.
2. GIVEN the elevation offset field WHEN the user adjusts the value THEN the UI previews how this shifts the seasonal timing context (e.g., "+200m elevation = ~1 week later bloom").
3. GIVEN the bloom timing offset field WHEN the user adjusts the value THEN the offset is stored on the apiary record in days relative to regional baseline.
4. GIVEN a user creating an apiary in a new region WHEN the region differs from existing apiaries THEN an informational message explains that seasonal context resets to the new region's baseline and personal history from the prior region will not apply (FR8b).
5. GIVEN a user's device location WHEN it significantly diverges from their registered apiary locations THEN a prompt asks the user to confirm their location or re-register (FR8a).
6. GIVEN the microclimate adjustment fields WHEN the form is saved THEN the offsets persist on the apiary record and are available to the recommendation engine for seasonal timing adjustments.
7. GIVEN a user who consistently overrides regionally-timed recommendations WHEN a pattern is detected THEN the system suggests a microclimate adjustment (FR11b) — this story provides the UI surface for that suggestion.
8. GIVEN the microclimate section WHEN rendered on a small screen THEN the layout is responsive with clear grouping and adequate touch targets.
9. GIVEN any microclimate field WHEN focused by a screen reader THEN an accessible label describes the field purpose and current value.

## Tasks / Subtasks

- [ ] Add microclimate adjustment section to apiary create/edit form (AC: #1, #2, #3)
  - [ ] Add elevation offset input with numeric stepper or slider (unit: meters)
  - [ ] Add bloom timing offset input with numeric stepper (unit: days, +/- relative to regional baseline)
  - [ ] Add help text/tooltip explaining each field's effect on seasonal guidance
  - [ ] Implement preview of seasonal timing shift for elevation offset
- [ ] Implement region change detection (AC: #4)
  - [ ] Compare new apiary region against existing apiary regions during create flow
  - [ ] Display informational `<Alert action="info">` message when region differs
  - [ ] Explain regional baseline reset and history inapplicability clearly
- [ ] Implement device location divergence prompt (AC: #5)
  - [ ] On apiary create/edit, compare device GPS coordinates to apiary location
  - [ ] If divergence exceeds threshold (configurable, e.g., 50km), display confirmation prompt
  - [ ] Offer options: "Use my current location" or "Keep entered location"
  - [ ] Use `<Actionsheet>` (bottom sheet) for quick confirmation per CLAUDE.md patterns
- [ ] Persist microclimate offsets via GraphQL mutation (AC: #6)
  - [ ] Extend `createApiary` and `updateApiary` mutations to include `elevationOffset` and `bloomTimingOffset` fields
  - [ ] Store offsets on apiary record in database
  - [ ] Invalidate relevant queries after successful mutation
- [ ] Implement microclimate suggestion surface (AC: #7)
  - [ ] Create `MicroclimateSuggestionBanner` component for display when override pattern detected
  - [ ] Banner links to apiary edit form with microclimate section scrolled into view
  - [ ] Use `<Alert action="info">` with constructive, non-punitive tone per CLAUDE.md emotional design
- [ ] Ensure responsive layout and accessibility (AC: #8, #9)
  - [ ] Test on mobile widths (320px-767px) with adequate spacing and touch targets
  - [ ] Add ARIA labels to all microclimate fields
  - [ ] Ensure help text is associated with fields via `accessibilityHint`

## Dev Notes

### Architecture Compliance
- Microclimate offsets are stored on the apiary record — they are not a separate entity
- The recommendation engine consumes these offsets to adjust seasonal timing; this story provides the data capture UI only
- Region detection uses the apiary's location coordinates compared to the regional baseline database
- Device location access requires Expo location permissions (`expo-location`)
- Informational messages use `<Alert action="info">` — non-blocking inline indicators per CLAUDE.md
- The microclimate suggestion (FR11b) is triggered server-side; this story provides the UI surface to display it

### TDD Requirements (Tests First!)
- Test 1: **Microclimate fields render** — Given the apiary form, elevation offset and bloom timing offset fields are present with labels and help text.
- Test 2: **Elevation offset preview** — Given an elevation value of +200m, the preview text shows approximate seasonal shift.
- Test 3: **Bloom timing offset persistence** — Given a bloom offset of +5 days, the mutation includes the correct offset value.
- Test 4: **Region change detection** — Given existing apiaries in Region A and a new apiary in Region B, the informational message renders.
- Test 5: **No region message for same region** — Given all apiaries in the same region, no regional reset message renders.
- Test 6: **Device location divergence** — Given device coordinates >50km from apiary location, the confirmation prompt renders.
- Test 7: **No divergence prompt for close location** — Given device coordinates <50km from apiary, no prompt appears.
- Test 8: **Microclimate suggestion banner** — Given a server-side override pattern flag, the suggestion banner renders with link to edit form.
- Test 9: **Accessible labels** — Given each microclimate field, screen reader accessibility labels are present and descriptive.

### Technical Specifications
- **Elevation offset:** numeric input, unit meters, range -500 to +3000, default 0
- **Bloom timing offset:** numeric input, unit days, range -30 to +30, default 0
- **Device location divergence threshold:** configurable, default 50km (haversine distance)
- **Region change alert:** `<Alert action="info">` with non-blocking inline display
- **Location divergence prompt:** `<Actionsheet>` bottom sheet with two options
- **Suggestion banner:** `<Alert action="info">` with constructive tone and link
- **Location permissions:** `expo-location` for device GPS access
- **GraphQL fields:** `elevationOffset: Int` (meters), `bloomTimingOffset: Int` (days) on Apiary type

### Anti-Patterns to Avoid
- DO NOT block apiary creation on microclimate fields — they are optional enhancements
- DO NOT use punitive language for region changes — tone is "Here's what to know" not "Warning: you'll lose history"
- DO NOT auto-apply device location without user confirmation — always prompt
- DO NOT store microclimate data in a separate table — it belongs on the apiary record
- DO NOT implement the recommendation engine adjustment logic in this story — only the UI data capture
- DO NOT use `<AlertDialog>` for location divergence — use bottom sheet for quick non-destructive confirmations

### Project Structure Notes
- Microclimate section integrates into existing apiary form screens from Story 7.1
- `apps/mobile/src/features/apiary/components/MicroclimateSection.tsx` — form section component
- `apps/mobile/src/features/apiary/components/MicroclimateSuggestionBanner.tsx` — suggestion banner
- `apps/mobile/src/features/apiary/components/LocationDivergenceSheet.tsx` — bottom sheet prompt
- `apps/mobile/src/features/apiary/hooks/useDeviceLocation.ts` — device location hook

### References
- [Source: prd.md#FR8a — Device location divergence detection]
- [Source: prd.md#FR8b — Regional baseline reset on new region]
- [Source: prd.md#FR11a — Microclimate adjustments: elevation and bloom timing]
- [Source: prd.md#FR11b — Override pattern detection and microclimate suggestion]
- [Source: epics.md#Epic 7 — Story 7.3]
- [Source: CLAUDE.md#Emotional Design & Tone — Calm, supportive, recovery-oriented]
- [Source: CLAUDE.md#Navigation Patterns — Bottom sheets for quick confirmations]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
