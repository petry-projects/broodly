# Story 7.2: Hive CRUD Screens

Status: ready-for-dev

## Story

As a beekeeper,
I want to view the hive list within an apiary, create new hives, edit hive details, and delete hives with confirmation,
so that I can track each colony individually within its apiary location.

**FRs:** FR3, FR4

## Acceptance Criteria (BDD)

1. GIVEN an apiary detail screen WHEN it loads THEN the apiary header shows name, location, hive count, and overall status, followed by a list of HiveHealthCard components for each hive.
2. GIVEN the apiary detail screen WHEN the user views the top of the screen THEN a breadcrumb label shows the Organization > Apiary navigation context.
3. GIVEN the hive list WHEN the user taps a HiveHealthCard THEN navigation routes to the hive detail screen.
4. GIVEN the apiary detail screen WHEN the user taps "Add Hive" THEN the create hive form renders with name, type selector, status, and notes fields.
5. GIVEN the create hive form WHEN the user selects a hive type THEN the type selector offers Langstroth, Top Bar, Warre, and Other with icons and descriptions.
6. GIVEN valid hive form data WHEN the user submits THEN a GraphQL createHive mutation executes linked to the parent apiary and the hive list refreshes.
7. GIVEN a user with 100 hives across all apiaries WHEN they attempt to create another THEN a user-friendly error message explains the 100-hive-per-account limit.
8. GIVEN an existing hive name within the same apiary WHEN the user tries to create a duplicate THEN a validation error displays for duplicate name.
9. GIVEN an existing hive WHEN the user taps edit THEN the form pre-populates with current values including type, status, and notes.
10. GIVEN the hive edit form WHEN the user saves changes THEN an updateHive mutation executes and the hive detail refreshes.
11. GIVEN an existing hive WHEN the user taps delete THEN an AlertDialog confirmation warns this is irreversible.
12. GIVEN the hive delete confirmation WHEN confirmed THEN a soft-delete mutation executes and a success toast displays.
13. GIVEN the hive delete confirmation WHEN cancelled THEN no data is modified.

## Tasks / Subtasks

- [ ] Create apiary detail / hive list screen at `apps/mobile/app/(tabs)/apiaries/[id]/index.tsx` (AC: #1, #2, #3)
  - [ ] Implement TanStack Query hook `useApiary(id)` fetching apiary with nested hives
  - [ ] Render apiary header: name, location, hive count, overall status badge
  - [ ] Render breadcrumb using `<Text size="sm">` with chevron separators
  - [ ] Render `HiveHealthCard` list for each hive with status badges
  - [ ] Implement navigation to hive detail on card tap
  - [ ] Add "Add Hive" button or FAB
- [ ] Create hive form screen at `apps/mobile/app/(tabs)/apiaries/[id]/hives/new.tsx` (AC: #4, #5, #6, #7, #8)
  - [ ] Build form with fields: name (required), type (required), status, notes
  - [ ] Implement hive type selector with Langstroth, Top Bar, Warre, Other options with icons
  - [ ] Implement `createHive` GraphQL mutation linked to parent apiary ID
  - [ ] Add validation: required name, name uniqueness within apiary, 100-hive limit
  - [ ] On success, invalidate apiary/hive queries and navigate back
- [ ] Create hive detail screen at `apps/mobile/app/(tabs)/apiaries/[id]/hives/[hiveId]/index.tsx` (AC: #3)
  - [ ] Display hive name, type, status, notes, and parent apiary context
  - [ ] Show edit and delete action buttons
- [ ] Create hive edit screen at `apps/mobile/app/(tabs)/apiaries/[id]/hives/[hiveId]/edit.tsx` (AC: #9, #10)
  - [ ] Pre-populate form with existing hive data via `useHive(hiveId)` query
  - [ ] Implement `updateHive` GraphQL mutation
  - [ ] On success, invalidate hive queries and navigate back
- [ ] Implement hive delete flow (AC: #11, #12, #13)
  - [ ] Add delete button using `<Button action="negative">` on hive detail screen
  - [ ] Implement `<AlertDialog>` confirmation modal with irreversible warning
  - [ ] Implement `deleteHive` GraphQL mutation (soft-delete)
  - [ ] Show success toast after deletion
  - [ ] Navigate back to apiary detail on successful delete

## Dev Notes

### Architecture Compliance
- Hive screens nest under the apiary route: `apps/mobile/app/(tabs)/apiaries/[id]/hives/`
- Breadcrumb navigation follows CLAUDE.md: Organization > Apiary > Hive with persistent context labeling
- All mutations require connectivity — no offline writes in MVP
- Hive types sourced from domain research: Langstroth, Top Bar, Warre, Other
- Soft-delete preserves hive data for recovery period
- Hive name uniqueness enforced at both client validation and server/DB constraint level

### TDD Requirements (Tests First!)
- Test 1: **Apiary detail rendering** — Given mock apiary data with hives, the header and hive list render correctly.
- Test 2: **Breadcrumb navigation** — Given an apiary context, the breadcrumb renders "Organization > Apiary Name" with correct separators.
- Test 3: **HiveHealthCard variants** — Given each hive status, the correct Badge action and variant renders.
- Test 4: **Create hive form** — Given valid form data, the createHive mutation fires with correct variables including parent apiary ID.
- Test 5: **Hive type selector** — Given the type selector, all four options (Langstroth, Top Bar, Warre, Other) render with icons.
- Test 6: **100-hive limit** — Given 100 existing hives, attempting to create another shows a limit error.
- Test 7: **Duplicate name validation** — Given an existing hive name in the same apiary, the form shows a uniqueness error.
- Test 8: **Edit pre-population** — Given an existing hive, the edit form pre-populates all fields correctly.
- Test 9: **Delete confirmation flow** — Given a delete action, AlertDialog renders; confirming fires mutation; cancelling does nothing.

### Technical Specifications
- **HiveHealthCard:** `<Card variant="elevated">` with `tva()` status variant (healthy|attention|warning|critical)
- **Breadcrumb:** `<Text size="sm">` with chevron separators per CLAUDE.md Navigation Patterns
- **Hive types:** Langstroth, Top Bar, Warre, Other — stored as enum on hive record
- **Type selector:** visual selector with icons and short descriptions for each type
- **Delete button:** `<Button action="negative" variant="solid">`
- **Touch targets:** minimum 48x48px for all interactive elements
- **GraphQL operations:** `apiary(id)` query (with hives), `createHive` mutation, `updateHive` mutation, `deleteHive` mutation

### Anti-Patterns to Avoid
- DO NOT allow duplicate hive names within the same apiary — enforce at validation and DB level
- DO NOT hardcode hex colors — use Gluestack design tokens
- DO NOT use color alone for status — always icon + text + color
- DO NOT skip breadcrumb context — users must always know where they are in the hierarchy
- DO NOT implement inline editing — use dedicated edit screens for form complexity
- DO NOT use `<AlertDialog>` for non-destructive actions

### Project Structure Notes
- Screen files: `apps/mobile/app/(tabs)/apiaries/[id]/index.tsx`, `hives/new.tsx`, `hives/[hiveId]/index.tsx`, `hives/[hiveId]/edit.tsx`
- Feature components: `apps/mobile/src/features/hive/components/`
- Shared UI (HiveHealthCard): `packages/ui/src/`
- GraphQL operations: `apps/mobile/src/services/graphql/hive.ts`
- Query hooks: `apps/mobile/src/features/hive/hooks/`

### References
- [Source: epics.md#Epic 7 — Stories 7.2, 7.4, 7.5]
- [Source: CLAUDE.md#Custom Domain Components — HiveHealthCard]
- [Source: CLAUDE.md#Status Semantics — Gluestack Action Mapping]
- [Source: CLAUDE.md#Navigation Patterns — Organization > Apiary > Hive]
- [Source: architecture.md#Data Architecture — Domain Schema]
- [Source: prd.md#FR3, FR4]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
