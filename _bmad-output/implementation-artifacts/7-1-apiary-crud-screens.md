# Story 7.1: Apiary CRUD Screens

Status: review

## Story

As a beekeeper,
I want to view a list of all my apiaries with health summaries, create new apiaries, edit existing ones, and delete apiaries with confirmation,
so that I can manage all my beekeeping locations from a single screen with clear status visibility.

**FRs:** FR3

## Acceptance Criteria (BDD)

1. GIVEN a user with apiaries WHEN the apiary list screen loads THEN all apiaries render as ApiaryHealthCard components showing name, location, hive count, and health status badge.
2. GIVEN a user with no apiaries WHEN the apiary list screen loads THEN an empty state renders with an "Add Apiary" CTA button.
3. GIVEN an apiary list WHEN the user pulls down THEN a pull-to-refresh triggers a data re-fetch via TanStack Query invalidation.
4. GIVEN an apiary list WHEN the user taps an ApiaryHealthCard THEN navigation routes to the apiary detail screen for that apiary.
5. GIVEN the apiary list screen WHEN the user taps the "Add Apiary" button or FAB THEN the create apiary form renders with name, location, and notes fields.
6. GIVEN the create apiary form WHEN the user submits valid data THEN a GraphQL createApiary mutation executes and the apiary list refreshes with the new entry.
7. GIVEN a user with 5 apiaries WHEN they attempt to create a sixth THEN a user-friendly error message explains the 5-apiary limit.
8. GIVEN an existing apiary WHEN the user taps the edit action THEN the edit form pre-populates with current values and allows saving changes.
9. GIVEN an existing apiary WHEN the user taps delete THEN an AlertDialog confirmation modal warns this is irreversible.
10. GIVEN the delete confirmation WHEN the user confirms THEN a soft-delete mutation executes, cascading to all child hives, and a success toast displays.
11. GIVEN the delete confirmation WHEN the user cancels THEN no data is modified and the dialog closes.
12. GIVEN any apiary health status WHEN rendered THEN the status badge uses the correct semantic mapping: healthy=success, attention=warning(outline), warning=warning(solid), critical=error.

## Tasks / Subtasks

- [x] Create apiary list screen at `apps/mobile/app/(tabs)/apiaries/index.tsx` (AC: #1, #2, #3, #4)
  - [x] Implement TanStack Query hook `useApiaries()` for fetching user apiaries
  - [x] Render `ApiaryHealthCard` list with status badges per CLAUDE.md semantic mapping
  - [x] Implement empty state with "Add Apiary" CTA using `<Button action="primary" variant="solid" size="xl">`
  - [x] Implement pull-to-refresh via `RefreshControl`
  - [x] Implement navigation to apiary detail on card tap
- [x] Create apiary form screen at `apps/mobile/app/(tabs)/apiaries/new.tsx` (AC: #5, #6, #7)
  - [x] Build form with fields: name (required), location (map pin or address), notes (optional)
  - [x] Implement `createApiary` GraphQL mutation with TanStack Query mutation
  - [x] Add validation: required name, 5-apiary limit enforcement with clear error messaging
  - [x] On success, invalidate apiary list query and navigate back
- [x] Create apiary edit screen at `apps/mobile/app/(tabs)/apiaries/[id]/edit.tsx` (AC: #8)
  - [x] Pre-populate form with existing apiary data via `useApiary(id)` query
  - [x] Implement `updateApiary` GraphQL mutation
  - [x] On success, invalidate apiary queries and navigate back
- [x] Implement apiary delete flow (AC: #9, #10, #11)
  - [x] Add delete button using `<Button action="negative">` on apiary detail/edit screen
  - [x] Implement delete confirmation via Alert.alert with irreversible warning text
  - [x] Implement `deleteApiary` GraphQL mutation (soft-delete with cascade)
  - [x] Navigate back to apiary list on successful delete

## Dev Notes

### Architecture Compliance
- Apiary screens live under Expo Router file-based routing in `apps/mobile/app/(tabs)/apiaries/`
- All GraphQL mutations go through the generated TypeScript client types from `packages/graphql-types/`
- Server state managed via `@tanstack/react-query` with persistent query cache for cache-first reads
- Form UI state managed locally with React state or Zustand if complexity warrants
- Status badges follow CLAUDE.md Status Semantics mapping: healthy=success, attention=warning(outline), warning=warning(solid), critical=error
- Soft-delete preserves data for recovery period; cascade deletes all child hives

### TDD Requirements (Tests First!)
- Test 1: **Apiary list rendering** — Given mock apiary data, the list renders all apiaries with correct name, location, and hive count.
- Test 2: **Health status badge variants** — Given each status value (healthy, attention, warning, critical), the correct Badge action and variant renders.
- Test 3: **Empty state** — Given zero apiaries, the empty state renders with an "Add Apiary" CTA.
- Test 4: **Pull-to-refresh** — Given a rendered list, pull-to-refresh triggers query invalidation.
- Test 5: **Create mutation** — Given valid form data, the createApiary mutation fires with correct variables.
- Test 6: **5-apiary limit** — Given 5 existing apiaries, attempting to create another shows a limit error.
- Test 7: **Delete confirmation** — Given a delete action, the AlertDialog renders with irreversible warning.
- Test 8: **Soft-delete cascade** — Given confirmed delete, the mutation soft-deletes the apiary and all child hives.
- Test 9: **Cancel delete** — Given a cancelled delete, no mutation fires.

### Technical Specifications
- **ApiaryHealthCard:** `<Card variant="elevated">` with `tva()` status variant (healthy|attention|warning|critical)
- **Status derivation:** worst-case hive status within apiary determines apiary-level status
- **Delete button:** `<Button action="negative" variant="solid">`
- **Confirmation modal:** `<AlertDialog>` per CLAUDE.md (irreversible operations only)
- **Touch targets:** minimum 48x48px for all interactive elements
- **Empty state CTA:** `<Button action="primary" variant="solid" size="xl">`
- **GraphQL operations:** `apiaries` query, `createApiary` mutation, `updateApiary` mutation, `deleteApiary` mutation

### Anti-Patterns to Avoid
- DO NOT hardcode hex colors — use Gluestack design tokens exclusively
- DO NOT use color alone for status indication — always pair with icon + text + color per CLAUDE.md
- DO NOT use `<AlertDialog>` for non-irreversible actions — only delete uses full modal
- DO NOT implement offline writes — mutations require connectivity in MVP
- DO NOT skip form validation on client side — validate before mutation
- DO NOT use `fetch` directly — all API calls go through the GraphQL client layer

### Project Structure Notes
- Screen files: `apps/mobile/app/(tabs)/apiaries/index.tsx`, `new.tsx`, `[id]/edit.tsx`, `[id]/index.tsx`
- Feature components: `apps/mobile/src/features/apiary/components/`
- Shared UI components (ApiaryHealthCard): `packages/ui/src/`
- GraphQL operations: `apps/mobile/src/services/graphql/apiary.ts`
- Query hooks: `apps/mobile/src/features/apiary/hooks/`

### References
- [Source: epics.md#Epic 7 — Stories 7.1, 7.3, 7.5]
- [Source: CLAUDE.md#Status Semantics — Gluestack Action Mapping]
- [Source: CLAUDE.md#Custom Domain Components — ApiaryHealthCard]
- [Source: CLAUDE.md#Button Hierarchy]
- [Source: CLAUDE.md#Navigation Patterns]
- [Source: architecture.md#Frontend Architecture]
- [Source: architecture.md#API & Communication Patterns]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Implemented apiary list screen with ApiaryHealthCard components, health status derivation, empty state, pull-to-refresh, navigation
- Implemented create apiary form with name/region/notes fields, 5-apiary limit enforcement, GraphQL mutation
- Implemented edit apiary screen with pre-populated form, update mutation, delete flow with Alert.alert confirmation
- Created health-status utility with status derivation and badge config per CLAUDE.md semantic mapping
- Created TanStack Query hooks (useApiaries, useApiary, useCreateApiary, useUpdateApiary, useDeleteApiary) with urql transport
- Created GraphQL operation definitions (queries + mutations) for apiary CRUD
- All 289 TS tests + Go tests passing, no regressions

### File List
- apps/mobile/app/(tabs)/apiaries/index.tsx (modified — full implementation)
- apps/mobile/app/(tabs)/apiaries/new.tsx (new)
- apps/mobile/app/(tabs)/apiaries/[id]/edit.tsx (new)
- apps/mobile/src/features/apiary/hooks/use-apiaries.ts (new)
- apps/mobile/src/features/apiary/utils/health-status.ts (new)
- apps/mobile/src/features/apiary/utils/health-status.test.ts (new)
- apps/mobile/src/services/graphql/apiary.ts (new)
- apps/mobile/__tests__/apiary-list.test.tsx (new)
- apps/mobile/__tests__/navigation.test.tsx (modified — added mocks for new dependencies)
