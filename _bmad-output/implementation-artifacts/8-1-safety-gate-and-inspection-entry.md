# Story 8.1: Safety Gate and Inspection Entry

Status: ready-for-dev

## Story

As a beekeeper,
I want to start an inspection on a selected hive with a safety checklist acknowledgment and scope confirmation (full vs quick),
so that I am properly prepared and know what to focus on before opening the hive.

## Acceptance Criteria (BDD)

1. GIVEN I tap "Start Inspection" on a hive detail screen WHEN the inspection entry flow loads THEN I see a ScopeConfirmationSheet (Actionsheet) with "Full Inspection" and "Quick Inspection" options, plus a pre-inspection context card showing last inspection date, active alerts, and current recommendations.
2. GIVEN I am a Newbie user who has completed fewer than 3 inspections WHEN the inspection entry flow loads THEN a non-skippable safety checklist is displayed covering protective equipment, sting allergy awareness, companion recommendation, and emergency contact accessibility, and I must acknowledge it before proceeding.
3. GIVEN I am a Newbie user who has completed 3 or more inspections WHEN the inspection entry flow loads THEN a condensed safety reminder appears that can be dismissed.
4. GIVEN I am an Amateur or Sideliner user WHEN the inspection entry flow loads THEN no safety checklist or reminder is shown.
5. GIVEN I select an inspection type (full or quick) and acknowledge safety (if required) WHEN the flow proceeds THEN an inspection record is created with status `in_progress`, the selected type, hive ID, and timestamp.
6. GIVEN I select "Quick Inspection" WHEN the guided flow begins THEN a reduced set of observation prompts is presented (abbreviated prompt set per FR25).
7. GIVEN a hive with active warnings or alerts WHEN the pre-inspection context card renders THEN warnings are displayed as non-blocking inline indicators with appropriate status semantics (warning/error icons + text + color).
8. GIVEN no network connectivity WHEN I attempt to start an inspection THEN I see an info banner ("You're offline. Your work is saved locally and will sync when you reconnect.") and the inspection cannot be started (MVP requires connectivity for saves).

## Tasks / Subtasks

- [ ] Create inspection feature module structure (AC: all)
  - [ ] Create `apps/mobile/src/features/inspection/` directory with `components/`, `hooks/`, `services/`, `types/`, `constants/` subdirectories
  - [ ] Create `InspectionEntryScreen` in `apps/mobile/app/(tabs)/hive/[hiveId]/inspect.tsx`
  - [ ] Create Zustand store: `apps/mobile/src/store/inspectionStore.ts` for in-progress inspection state
- [ ] Build SafetyChecklistSheet component (AC: #2, #3, #4)
  - [ ] Create `apps/mobile/src/features/inspection/components/SafetyChecklistSheet/index.tsx`
  - [ ] Implement full safety checklist with 4 items using Gluestack `Actionsheet` + `Checkbox` components
  - [ ] Implement condensed reminder variant (inspections 4+) with single acknowledge button
  - [ ] Implement skip logic: hide entirely for Amateur/Sideliner or Newbie with 3+ inspections acknowledged
  - [ ] Store safety acknowledgment state in user profile via GraphQL mutation
- [ ] Build ScopeConfirmationSheet component (AC: #1, #6)
  - [ ] Create `apps/mobile/src/features/inspection/components/ScopeConfirmationSheet/index.tsx`
  - [ ] Use Gluestack `<Actionsheet>` with `<ActionsheetContent>` containing two options: Full and Quick
  - [ ] Each option shows brief description of what is covered
  - [ ] Selection triggers inspection creation and navigates to guided flow
- [ ] Build PreInspectionContextCard component (AC: #1, #7)
  - [ ] Create `apps/mobile/src/features/inspection/components/PreInspectionContextCard/index.tsx`
  - [ ] Display last inspection date, active alerts (using `<Alert action="warning">` or `<Alert action="error">`), and current recommendations
  - [ ] Fetch hive context data via TanStack Query + GraphQL
- [ ] Implement inspection record creation (AC: #5)
  - [ ] Create `createInspection` GraphQL mutation call in `apps/mobile/src/features/inspection/services/inspectionService.ts`
  - [ ] Persist inspection ID, type, hiveId, status (`in_progress`), and startedAt in Zustand store
  - [ ] Persist in-progress state to MMKV for crash recovery
- [ ] Handle offline state (AC: #8)
  - [ ] Check connectivity via Zustand connectivity store before allowing inspection start
  - [ ] Show `<Alert action="info">` banner when offline

## Dev Notes

### Architecture Compliance
- Feature module lives in `apps/mobile/src/features/inspection/` per architecture.md mapping
- Screen route at `apps/mobile/app/(tabs)/hive/[hiveId]/inspect.tsx` using Expo Router file-based routing
- GraphQL mutation for inspection creation calls `apps/api/graph/resolver/inspection` resolvers
- Safety acknowledgment stored as user profile field (completedInspectionCount or safetyAcknowledgedAt)
- Zustand store for ephemeral UI/workflow state; TanStack Query for server state

### TDD Requirements (Tests First!)
- Test 1: **Safety checklist display** — Given a Newbie user with 0 completed inspections, render InspectionEntryScreen and assert the full safety checklist is visible with all 4 items and an acknowledge button.
- Test 2: **Safety checklist suppression** — Given a Newbie user with 3+ completed inspections, render InspectionEntryScreen and assert no full safety checklist is shown (condensed reminder only).
- Test 3: **Scope confirmation rendering** — Render ScopeConfirmationSheet and assert both "Full Inspection" and "Quick Inspection" options are visible with descriptions.
- Test 4: **Inspection record creation** — Given a user selects "Full Inspection" and acknowledges safety, assert `createInspection` mutation is called with correct hiveId, type `full`, and status `in_progress`.
- Test 5: **Quick mode flag** — Given a user selects "Quick Inspection", assert the inspection record is created with type `quick` and the prompt set loaded is the abbreviated variant.
- Test 6: **Pre-inspection context loads** — Render PreInspectionContextCard with mock hive data and assert last inspection date, active alerts, and recommendations are displayed.
- Test 7: **Offline guard** — Given no connectivity, attempt to start inspection and assert an info alert is shown and no mutation is fired.

### Technical Specifications
- **Gluestack components:** `Actionsheet`, `ActionsheetContent`, `ActionsheetItem`, `Checkbox`, `Card` (elevated), `Alert`, `Badge`, `Button` (primary solid xl), `Heading`, `Text`
- **Touch targets:** All buttons 48px minimum height; primary "Start" button 56x48px per CLAUDE.md field-use spec
- **State persistence:** MMKV for crash-recovery state of in-progress inspection
- **Safety checklist items:** (1) Protective equipment, (2) Sting allergy + epinephrine, (3) Companion for early inspections, (4) Emergency contact accessible
- **Inspection types:** `full` (complete prompt tree) and `quick` (abbreviated subset)

### Anti-Patterns to Avoid
- DO NOT use a full-screen modal for safety checklist — use Actionsheet (bottom sheet) pattern per UX spec
- DO NOT block the entire UI with a loading spinner during inspection creation — use optimistic state
- DO NOT hardcode safety checklist logic to inspection count — use the user profile's acknowledged field to allow future flexibility
- DO NOT skip connectivity check — MVP requires connectivity for mutations
- DO NOT use color-only status indicators — always pair with icon + text per CLAUDE.md accessibility rules

### Project Structure Notes
- `apps/mobile/src/features/inspection/components/SafetyChecklistSheet/index.tsx`
- `apps/mobile/src/features/inspection/components/ScopeConfirmationSheet/index.tsx`
- `apps/mobile/src/features/inspection/components/PreInspectionContextCard/index.tsx`
- `apps/mobile/src/features/inspection/services/inspectionService.ts`
- `apps/mobile/src/store/inspectionStore.ts`
- `apps/mobile/app/(tabs)/hive/[hiveId]/inspect.tsx`

### References
- [Source: epics.md#Story 8.1 — Start Inspection Scope Confirmation and Initial Guidance]
- [Source: ux-design-specification.md#Pre-Inspection Safety Gate (Newbie Persona)]
- [Source: ux-design-specification.md#Journey 1 — Newbie Guided Inspection]
- [Source: CLAUDE.md#Custom Domain Components — ScopeConfirmationSheet]
- [Source: CLAUDE.md#Navigation Patterns]
- [Source: CLAUDE.md#Offline & Sync Patterns]
- [Source: architecture.md#Requirements to Structure Mapping — Guided inspections]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
