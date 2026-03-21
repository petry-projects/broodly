# Story 7.3: Health Status Cards

Status: ready-for-dev

## Story

As a beekeeper,
I want to see health status visualizations on apiary and hive cards using consistent semantic status indicators,
so that I can quickly identify which locations and colonies need attention without drilling into details.

**FRs:** FR3, FR4

## Acceptance Criteria (BDD)

1. GIVEN an apiary with hives of varying statuses WHEN the ApiaryHealthCard renders THEN the apiary-level status badge reflects the worst-case hive status within that apiary.
2. GIVEN a hive with a known status WHEN the HiveHealthCard renders THEN the status badge uses the correct Gluestack action mapping: healthy=success, attention=warning(outline), warning=warning(solid), critical=error.
3. GIVEN any health card WHEN rendered THEN status is indicated by icon + text label + color — never color alone.
4. GIVEN a HiveHealthCard WHEN focused by a screen reader THEN it announces hive name, status level, and next action date as a single accessible description.
5. GIVEN an ApiaryHealthCard WHEN focused by a screen reader THEN it announces apiary name, overall status, and hive count.
6. GIVEN a shared HealthStatusCardBase component WHEN used by both ApiaryHealthCard and HiveHealthCard THEN the `tva()` status variant drives all visual differences (background tint, badge color, icon).
7. GIVEN a healthy status WHEN the card renders THEN the background uses `bg-background-success`, the badge uses `<Badge action="success">`, and a checkmark icon displays.
8. GIVEN a critical status WHEN the card renders THEN the background uses `bg-background-error`, the badge uses `<Badge action="error">`, and a warning icon displays.
9. GIVEN an attention status WHEN the card renders THEN the badge uses `<Badge action="warning" variant="outline">` to visually distinguish it from the solid warning level.
10. GIVEN a card in any status WHEN rendered THEN all color pairings meet WCAG 2.1 AA contrast ratios (4.5:1 normal text, 3:1 large text).

## Tasks / Subtasks

- [ ] Create `HealthStatusCardBase` component with `tva()` variants in `packages/ui/src/` (AC: #6)
  - [ ] Define `tva()` with status variants: healthy, attention, warning, critical
  - [ ] Map each variant to background color, badge action/variant, and icon
  - [ ] Implement shared layout: card header (name + badge), metadata row, optional action hint
  - [ ] Export from `packages/ui/src/index.ts`
- [ ] Create `ApiaryHealthCard` component extending `HealthStatusCardBase` (AC: #1, #5)
  - [ ] Accept props: apiary name, location, hive count, overall status, onPress
  - [ ] Derive status from worst-case hive status (critical > warning > attention > healthy)
  - [ ] Display hive count summary (e.g., "8 hives")
  - [ ] Add accessible description: "{name}, {status}, {hiveCount} hives"
  - [ ] Use `<Card variant="elevated">` as base
- [ ] Create `HiveHealthCard` component extending `HealthStatusCardBase` (AC: #2, #4)
  - [ ] Accept props: hive name, type, status, last inspection date, next action date, onPress
  - [ ] Display hive type icon and last inspection relative time
  - [ ] Add accessible description: "{name}, {status}, next action {date}"
  - [ ] Use `<Card variant="elevated">` as base
- [ ] Implement status icon mapping (AC: #3, #7, #8)
  - [ ] healthy: checkmark-circle icon + "Healthy" label
  - [ ] attention: info-circle icon + "Needs Attention" label
  - [ ] warning: alert-triangle icon + "Warning" label
  - [ ] critical: alert-octagon icon + "Critical" label
- [ ] Implement semantic background tinting per status (AC: #7, #8, #9)
  - [ ] healthy: `bg-background-success` (#E8F5E9)
  - [ ] attention: `bg-background-warning` (#FFF3E0) with outline badge variant
  - [ ] warning: `bg-background-warning` (#FFF3E0) with solid badge variant
  - [ ] critical: `bg-background-error` (#FEE2E2)
- [ ] Validate WCAG contrast ratios for all status/background pairings (AC: #10)
  - [ ] Test primary-500 on background-50, typography-500 on background-50
  - [ ] Test each status color on its corresponding semantic background
  - [ ] Document verified contrast ratios in component comments

## Dev Notes

### Architecture Compliance
- Health cards are shared UI components in `packages/ui/src/` — not feature-specific
- Both `ApiaryHealthCard` and `HiveHealthCard` extend a shared `HealthStatusCardBase` using `tva()` composition
- Status semantic mapping is defined in CLAUDE.md and must be followed exactly
- Cards use `<Card variant="elevated">` as the Gluestack base per CLAUDE.md Custom Domain Components table
- All accessibility labels follow CLAUDE.md Accessibility Requirements for health cards

### TDD Requirements (Tests First!)
- Test 1: **HealthStatusCardBase variants** — Given each status value, the correct background, badge, and icon render.
- Test 2: **ApiaryHealthCard status derivation** — Given hives with mixed statuses, the apiary card shows worst-case status.
- Test 3: **HiveHealthCard rendering** — Given hive data, the card renders name, type, status badge, and last inspection date.
- Test 4: **Accessible descriptions** — Given a HiveHealthCard, the accessible description includes hive name, status, and next action date.
- Test 5: **Accessible descriptions (apiary)** — Given an ApiaryHealthCard, the accessible description includes name, status, and hive count.
- Test 6: **Attention vs Warning distinction** — Given attention status, badge renders `variant="outline"`; given warning, badge renders `variant="solid"` (both action="warning").
- Test 7: **Icon + text + color** — Given any status, the card renders all three indicators (not color alone).
- Test 8: **Snapshot tests** — Snapshot each card variant to catch unintended visual regressions.

### Technical Specifications
- **HealthStatusCardBase:** `tva()` with status: healthy|attention|warning|critical
- **ApiaryHealthCard:** `<Card variant="elevated">` with apiary-specific layout (name, location, hive count, status)
- **HiveHealthCard:** `<Card variant="elevated">` with hive-specific layout (name, type icon, status, last inspection, next action)
- **Status priority order:** critical > warning > attention > healthy (for worst-case derivation)
- **Badge mapping:** healthy=`action="success"`, attention=`action="warning" variant="outline"`, warning=`action="warning"`, critical=`action="error"`
- **Minimum touch target:** 48x48px for card press area
- **Typography:** Card title `<Heading size="xl">`, metadata `<Text size="sm">`, timestamps `<Text size="xs">`

### Anti-Patterns to Avoid
- DO NOT use color alone for status — always pair icon + text + color (CLAUDE.md mandate)
- DO NOT hardcode hex values — use Gluestack semantic background tokens
- DO NOT duplicate status logic between ApiaryHealthCard and HiveHealthCard — share via HealthStatusCardBase
- DO NOT skip accessible descriptions — health cards must be screen-reader friendly
- DO NOT create separate card components for each status — use `tva()` variants on a single base
- DO NOT use `<Alert>` for card status — cards use `<Badge>` and background tint, not inline alerts

### Project Structure Notes
- `packages/ui/src/HealthStatusCardBase/index.tsx` — shared base component with tva()
- `packages/ui/src/ApiaryHealthCard/index.tsx` — apiary-specific card
- `packages/ui/src/HiveHealthCard/index.tsx` — hive-specific card
- `packages/ui/src/HealthStatusCardBase/HealthStatusCardBase.test.tsx` — base component tests
- `packages/ui/src/ApiaryHealthCard/ApiaryHealthCard.test.tsx` — apiary card tests
- `packages/ui/src/HiveHealthCard/HiveHealthCard.test.tsx` — hive card tests
- Export all from `packages/ui/src/index.ts`

### References
- [Source: CLAUDE.md#Status Semantics — Gluestack Action Mapping]
- [Source: CLAUDE.md#Custom Domain Components — ApiaryHealthCard, HiveHealthCard]
- [Source: CLAUDE.md#Accessibility Requirements — Health card announcements]
- [Source: CLAUDE.md#Color Token System — Semantic Background Tokens]
- [Source: CLAUDE.md#Contrast Requirements — WCAG 2.1 AA]
- [Source: epics.md#Epic 7 — Stories 7.1, 7.2]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
