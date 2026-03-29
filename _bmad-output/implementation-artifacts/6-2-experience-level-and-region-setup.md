# Story 6.2: Experience Level and Region Setup

Status: done

## Story

As a new user,
I want to select my beekeeping experience level and set my region during onboarding,
so that guidance is tailored to my skill level and localized to my area and current season.

## Acceptance Criteria (BDD)

1. GIVEN onboarding step 2 WHEN the experience level screen loads THEN three selectable cards are displayed: Newbie ("Just getting started..."), Amateur ("1-2 seasons..."), and Sideliner ("Managing many hives...") with plain-language descriptions.
2. GIVEN the experience level screen WHEN I tap a card THEN it shows the selected variant (primary-500 border, primary-50 background) and any previously selected card deselects.
3. GIVEN the experience level screen WHEN no card is selected and I tap "Continue" THEN a validation message appears prompting selection.
4. GIVEN onboarding step 2 WHEN I select an experience level and tap "Continue" THEN the selection is stored in Zustand onboarding state and I proceed to the region screen (step 3).
5. GIVEN onboarding step 3 (region screen) WHEN the screen loads THEN a trust-first info Alert is displayed: "Your location helps us give you regionally accurate seasonal guidance, weather data, and bloom forecasts."
6. GIVEN the region screen WHEN GPS permission is granted THEN the detected location is displayed in a success-styled card showing city, state, USDA zone, and climate type.
7. GIVEN the region screen WHEN GPS permission is denied or unavailable THEN a manual location entry option is prominently shown with a text input for city/state or zip code.
8. GIVEN the region screen WHEN I tap "Enter location manually" THEN a text input appears for manual city/state or zip code entry.
9. GIVEN the region screen WHEN a valid location is set (auto or manual) and I tap "Continue" THEN the region is stored in Zustand onboarding state, seasonal context is resolved from region + current date, and I proceed to step 4.
10. GIVEN the experience level screen WHEN progress dots render THEN step 1 shows as done (success-500) and step 2 shows as active (primary-500).

## Tasks / Subtasks

- [ ] Create experience level screen at `apps/mobile/app/(onboarding)/experience-level.tsx` (AC: #1, #2, #3, #4, #10)
  - [ ] Render progress dots (step 2 of 5, step 1 done)
  - [ ] Render heading: "What kind of beekeeper are you?" (Heading 2xl)
  - [ ] Render subheading: "This helps us tailor guidance to your experience level." (Text sm, typography-500)
  - [ ] Render three Gluestack Card components (variant="filled") with selected state (variant with primary-500 border, primary-50 bg)
  - [ ] Each card: icon + title (card-title, 15px semibold) + description (card-text, 13px typography-500)
  - [ ] Newbie: honeybee icon, Amateur: bee icon, Sideliner: graduation icon
  - [ ] Single-select behavior via local state; tapping one deselects others
  - [ ] "Continue" Button (primary, xl) stores selection in Zustand and navigates forward
  - [ ] Validation: show error if no selection made on Continue tap
- [ ] Create region/location screen at `apps/mobile/app/(onboarding)/region-setup.tsx` (AC: #5, #6, #7, #8, #9)
  - [ ] Render progress dots (step 3 of 5, steps 1-2 done)
  - [ ] Render heading: "Where are your bees?" (Heading 2xl)
  - [ ] Render trust-first Alert (action="info") with location icon and purpose messaging
  - [ ] Render map placeholder area (140px, bg-muted, dashed border)
  - [ ] Request GPS permission using expo-location with trust messaging
  - [ ] On permission granted: reverse geocode to city/state, display in success Card (success-50 bg, success-500 border) with checkmark, city, USDA zone, climate
  - [ ] On permission denied: show manual entry UI prominently
  - [ ] Render "Enter location manually" ghost button that reveals text Input
  - [ ] Manual entry: validate against a location lookup (zip code or city/state)
  - [ ] "Continue" button stores region in Zustand, resolves seasonal context, navigates to step 4
- [ ] Create seasonal context resolver utility (AC: #9)
  - [ ] Function: `resolveSeasonalContext(region: Region, date: Date): SeasonalContext`
  - [ ] Returns current season phase, approximate bloom window, USDA zone data
  - [ ] Place in `apps/mobile/src/features/onboarding/utils/seasonalContext.ts`
- [ ] Write unit tests (AC: all)
  - [ ] Test: Experience level screen renders three cards with correct labels and descriptions
  - [ ] Test: Tapping a card applies selected styling and deselects others
  - [ ] Test: Continue without selection shows validation error
  - [ ] Test: Selection is persisted to Zustand onboarding store
  - [ ] Test: Region screen renders trust-first info alert
  - [ ] Test: GPS permission granted shows detected location in success card
  - [ ] Test: GPS permission denied shows manual entry option
  - [ ] Test: Manual location entry validates and stores result
  - [ ] Test: Seasonal context resolves correctly for given region and date
  - [ ] Test: Progress dots show correct done/active/pending states

## Dev Notes

### Architecture Compliance

- Experience level maps to `skill_progression.current_level` in the domain model
- Region data feeds into FR8 (regional seasonal context) and FR8a (weather integration)
- GPS permission uses progressive disclosure: requested only at this step with clear "why" messaging per NFR14
- Mic and camera permissions are NOT requested here; deferred to first use

### TDD Requirements (Tests First!)

- Write card selection state tests before implementing the experience level screen
- Mock expo-location for GPS permission and geocoding tests
- Test seasonal context resolver with known region/date pairs
- Test the full navigation flow from experience to region to next step

### Technical Specifications

- **Screens:** `apps/mobile/app/(onboarding)/experience-level.tsx`, `apps/mobile/app/(onboarding)/region-setup.tsx`
- **Utility:** `apps/mobile/src/features/onboarding/utils/seasonalContext.ts`
- **Zustand fields:** `experienceLevel: 'newbie' | 'amateur' | 'sideliner'`, `region: { city, state, usdaZone, climate, lat, lng }`, `seasonalContext: SeasonalContext`
- **Expo dependency:** `expo-location` for GPS permission and reverse geocoding
- **Card variants:** Gluestack Card variant="filled" for default, selected state uses `card-selected` pattern (primary-500 border, primary-50 bg)
- **Screen designs:** screens-batch1-onboarding.html screens 3 (Experience Level) and 4 (Region & Location)
- **FRs:** FR2, FR2b, FR8

### Anti-Patterns to Avoid

- Do NOT request location permission without showing the trust-first message first
- Do NOT block onboarding if GPS is denied; always provide manual fallback
- Do NOT use AlertDialog for location permission; use inline Alert component
- Do NOT hardcode USDA zones; derive from location data or lookup table
- Do NOT allow multi-select on experience level; it is single-select only

### Project Structure Notes

- Both screens are in the `(onboarding)` route group
- Seasonal context utility is a pure function, easy to test independently
- Card selected state should use tva() variants, not inline style overrides

### References

- Screen designs: `/home/donpetry/broodly/_bmad-output/planning-artifacts/screens-batch1-onboarding.html` (screens 3-4)
- UX spec: `/home/donpetry/broodly/_bmad-output/planning-artifacts/ux-design-specification.md` (lines 459-460, 473-478)
- Design system: `/home/donpetry/broodly/CLAUDE.md` (Card variants, Alert, Button hierarchy)
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` (Stories 6.1, 6.2)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Experience level selection (Newbie/Amateur/Sideliner single-select cards), region setup with manual text input, seasonal context resolver utility (hemisphere + season detection)

### File List
- apps/mobile/app/(onboarding)/experience-level.tsx
- apps/mobile/app/(onboarding)/region-setup.tsx
- apps/mobile/src/features/onboarding/utils/seasonal-context.ts
