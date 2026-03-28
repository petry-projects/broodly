# Story 10.2: Weekly Action Queue by Apiary

Status: ready-for-dev

## Story

As a user,
I want a prioritized weekly action queue grouped by apiary,
so that I can plan my week efficiently and focus on the most important tasks first.

## Acceptance Criteria (BDD)

1. GIVEN a user with active tasks WHEN they navigate to the weekly planning view THEN tasks render grouped by apiary using the ApiaryAccordionQueue component.
2. GIVEN tasks within an apiary group WHEN the accordion section is expanded THEN tasks are ordered by priority (urgency x impact) with highest priority first.
3. GIVEN overdue tasks exist WHEN the queue renders THEN overdue tasks appear at the top of their apiary group flagged with a warning badge and catch-up guidance (FR16).
4. GIVEN an apiary with more than 20 tasks WHEN the queue renders THEN tasks are paginated or grouped by action type with counts rather than rendered as a flat list (NFR17b).
5. GIVEN a user with multiple apiaries WHEN the queue loads THEN the highest-priority apiary renders within 2 seconds and remaining apiaries load in background (NFR17c).
6. GIVEN the weekly queue WHEN the user pulls to refresh THEN priorities are recalculated and the queue re-renders with updated ordering.
7. GIVEN each task in the queue WHEN it renders THEN it displays: title, hive name, priority badge, due date, and recommended action summary.

## Tasks / Subtasks

- [ ] Create `ApiaryAccordionQueue` component (AC: #1)
  - [ ] Build on Gluestack `<Accordion>` compound component per CLAUDE.md
  - [ ] Each `<AccordionItem>` represents one apiary
  - [ ] `<AccordionTrigger>` shows apiary name, task count badge, and highest-priority status
  - [ ] `<AccordionContent>` renders task list for that apiary
  - [ ] Default state: all apiaries collapsed; auto-expand first apiary on initial load
- [ ] Create `QueueTaskCard` component (AC: #7)
  - [ ] Display task title as `<Heading size="xl">`
  - [ ] Display hive name, due date, and recommended action as `<Text size="sm">`
  - [ ] Priority badge using `<Badge>` with action variant mapped from priority level
  - [ ] Overdue indicator: `<Badge action="warning">` with time-since-due text
  - [ ] Tap to expand task detail (action + rationale + confidence + fallback)
- [ ] Implement priority ordering logic (AC: #2)
  - [ ] Sort tasks by computed priority score (urgency x impact) descending
  - [ ] Overdue tasks float to top of each group regardless of score
  - [ ] Priority score sourced from recommendation engine via GraphQL
- [ ] Implement overdue task handling (AC: #3)
  - [ ] Identify overdue tasks (due date < today)
  - [ ] Render overdue tasks at top with `<Alert action="warning">` catch-up guidance
  - [ ] Catch-up guidance: constructive tone, specific next step
- [ ] Implement pagination for large queues (AC: #4)
  - [ ] When apiary has > 20 tasks, group by action type with counts
  - [ ] "Show more" button to load next page
  - [ ] Action type grouping: inspection, feeding, treatment, monitoring, etc.
- [ ] Implement progressive loading (AC: #5)
  - [ ] Load highest-priority apiary first (server sorts by max task urgency)
  - [ ] Background-load remaining apiaries after initial render
  - [ ] Skeleton loaders for apiaries still loading
- [ ] Implement pull-to-refresh (AC: #6)
  - [ ] Wire `RefreshControl` to TanStack Query invalidation
  - [ ] Server recomputes priorities on refetch
  - [ ] Optimistic UI: show loading indicator during recomputation
- [ ] Wire up GraphQL queries
  - [ ] Query: `weeklyActionQueue` — returns tasks grouped by apiary, sorted by priority
  - [ ] Query supports pagination: `first`, `after` cursor per apiary
  - [ ] Include fields: taskId, title, hiveName, priority, dueDate, recommendedAction, isOverdue
- [ ] Register planning screen in Expo Router
  - [ ] Navigation from homepage "Start Today's Plan" CTA

## Dev Notes

### Architecture Compliance
- ApiaryAccordionQueue is a custom domain component built on Gluestack `<Accordion>` per CLAUDE.md component mapping
- Feature component lives in `apps/mobile/src/features/planning/components/`
- Priority computation is server-side (recommendation engine); client only displays and sorts
- Follows summary-before-detail pattern: collapsed accordions show high-signal summary
- Navigation: reached via "Start Today's Plan" CTA from Happy Context Homepage

### TDD Requirements (Tests First!)
- Test 1: **Accordion renders apiary groups** — Given 3 apiaries with tasks, ApiaryAccordionQueue renders 3 AccordionItems with correct apiary names and task counts.
- Test 2: **Priority ordering** — Given tasks with different priority scores, tasks within an expanded apiary are ordered descending by priority.
- Test 3: **Overdue tasks flagged** — Given tasks with due dates in the past, overdue tasks render at the top with warning badges and catch-up guidance.
- Test 4: **Pagination threshold** — Given an apiary with 25 tasks, only 20 render initially with a "Show more" control; tasks are grouped by action type.
- Test 5: **Progressive loading** — Given 5 apiaries, the first apiary renders within 2 seconds; remaining apiaries show skeleton loaders until loaded.
- Test 6: **Pull-to-refresh** — Pulling to refresh triggers TanStack Query invalidation and re-fetches the queue.
- Test 7: **Task card content** — Each task card displays title, hive name, priority badge, due date, and recommended action.

### Technical Specifications
- **Component:** `ApiaryAccordionQueue` — Gluestack `<Accordion>` compound component
- **Component:** `QueueTaskCard` — `<Card variant="elevated">` with priority badge
- **Routing:** `/planning` or `/(tabs)/planning` in Expo Router
- **State:** TanStack Query for queue data; Zustand for UI state (expanded accordions)
- **GraphQL:** `weeklyActionQueue(userId, week)` with cursor-based pagination per apiary
- **Performance:** First apiary in < 2s (NFR17c); progressive loading for accounts > 100 hives

### Anti-Patterns to Avoid
- DO NOT compute priority scores on the client — priority is server-computed
- DO NOT render a flat list for large queues — use pagination/grouping per NFR17b
- DO NOT block initial render waiting for all apiaries to load — use progressive loading
- DO NOT use a custom accordion — use Gluestack `<Accordion>` compound component
- DO NOT use `<AlertDialog>` for overdue warnings — use inline `<Alert>` (non-blocking)
- DO NOT skip the catch-up guidance for overdue tasks — always provide constructive next steps

### Project Structure Notes
- Screen: `apps/mobile/app/(tabs)/planning.tsx`
- Feature components: `apps/mobile/src/features/planning/components/ApiaryAccordionQueue/index.tsx`
- Feature components: `apps/mobile/src/features/planning/components/QueueTaskCard/index.tsx`
- Tests co-located: `ApiaryAccordionQueue/ApiaryAccordionQueue.test.tsx`
- GraphQL queries: `apps/mobile/src/features/planning/queries/weeklyActionQueue.ts`

### References
- [Source: epics.md#Story 10.2 — Weekly Action Queue by Apiary]
- [Source: prd.md#FR13, FR14, FR16, NFR17b, NFR17c]
- [Source: ux-design-specification.md#Journey 2 — Amateur Weekly Planning]
- [Source: CLAUDE.md#Custom Domain Components — ApiaryAccordionQueue]
- [Source: CLAUDE.md#Gluestack Component Compound Pattern — Accordion]
- [Source: CLAUDE.md#Layout Principles — Summary-before-detail]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
