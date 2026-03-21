# Story 10.3: Task Resolution Actions

Status: ready-for-dev

## Story

As a user,
I want to mark tasks as done, defer them, or dismiss them with an optional reason,
so that I can manage my workload flexibly and keep my action queue relevant.

## Acceptance Criteria (BDD)

1. GIVEN a task in the weekly queue WHEN the user taps "Did It" THEN the task is marked as completed, removed from the active queue, and a success toast confirms the action.
2. GIVEN a task in the weekly queue WHEN the user taps "Defer" THEN a bottom sheet appears with an optional reason text field and a date picker for rescheduling.
3. GIVEN a task in the weekly queue WHEN the user taps "Dismiss" THEN an optional reason capture is shown and the task is removed from the queue upon confirmation.
4. GIVEN any task status change (complete, defer, dismiss) WHEN the mutation succeeds THEN the remaining tasks in the queue are rebalanced by priority (FR18).
5. GIVEN a completed task WHEN the completion is recorded THEN the user's skill progression task count is incremented (FR34).
6. GIVEN the "Did It" button WHEN it renders THEN it uses a context-rich accessible label (e.g., "Mark 'Add super to Hive 3' as done") not just "Did It".
7. GIVEN a deferred task with a new date WHEN the defer is confirmed THEN the task reappears in the queue on the new target date with its original priority recalculated.

## Tasks / Subtasks

- [ ] Implement "Did It" (complete) action (AC: #1, #5, #6)
  - [ ] `<Button action="positive" variant="solid">` with context-rich label
  - [ ] Accessible label format: "Mark '{task title} for {hive name}' as done"
  - [ ] GraphQL mutation: `completeTask(taskId)` — marks task complete, triggers priority rebalance
  - [ ] Optimistic UI: remove task from queue immediately, rollback on error
  - [ ] Success toast: `<Toast>` with `<ToastTitle>` "Nice work" and `<ToastDescription>` with task summary
  - [ ] Increment skill progression counter on success
- [ ] Implement "Defer" action (AC: #2, #7)
  - [ ] `<Button action="secondary" variant="outline">` with "Defer" label
  - [ ] Bottom sheet using `<Actionsheet>` per Gluestack pattern
  - [ ] Optional reason text field: `<Input><InputField placeholder="Why? (optional)" /></Input>`
  - [ ] Date picker for new target date (default: +7 days)
  - [ ] GraphQL mutation: `deferTask(taskId, reason?, newDate)` — reschedules and triggers rebalance
  - [ ] Optimistic UI: move task to deferred state, rollback on error
- [ ] Implement "Dismiss" action (AC: #3)
  - [ ] `<Button action="secondary" variant="link">` with "Not now" / "Dismiss" label
  - [ ] Optional reason capture inline or via small bottom sheet
  - [ ] GraphQL mutation: `dismissTask(taskId, reason?)` — removes task, triggers rebalance
  - [ ] Optimistic UI: remove task from queue, rollback on error
- [ ] Implement priority rebalancing on status change (AC: #4)
  - [ ] After any mutation, server recomputes remaining task priorities
  - [ ] Client invalidates TanStack Query cache for `weeklyActionQueue`
  - [ ] Animated reorder of remaining tasks to show new priority positions
- [ ] Implement success feedback (AC: #1)
  - [ ] `<Toast>` component with encouraging tone: "Nice work" not "Task complete"
  - [ ] Toast auto-dismisses after 3 seconds
  - [ ] Toast includes undo action for accidental completions
- [ ] Wire up GraphQL mutations
  - [ ] `completeTask(taskId: ID!): TaskResult!`
  - [ ] `deferTask(taskId: ID!, reason: String, newDate: Date!): TaskResult!`
  - [ ] `dismissTask(taskId: ID!, reason: String): TaskResult!`
  - [ ] All mutations return updated queue priorities for optimistic cache update
- [ ] Implement accessibility labels (AC: #6)
  - [ ] Context-rich labels on all action buttons per CLAUDE.md accessibility requirements
  - [ ] Screen reader announces: action + task title + hive context

## Dev Notes

### Architecture Compliance
- Task actions are mutations that trigger server-side priority rebalancing (FR18)
- Button hierarchy follows CLAUDE.md: positive for "Did It", secondary outline for "Defer", secondary link for "Dismiss"
- Bottom sheets use Gluestack `<Actionsheet>` — full modals only for irreversible operations
- Optimistic updates via TanStack Query mutation callbacks
- Skill progression update (FR34) is a side effect of task completion on the server

### TDD Requirements (Tests First!)
- Test 1: **"Did It" completes task** — Tapping "Did It" calls `completeTask` mutation and removes the task from the rendered queue.
- Test 2: **Defer shows bottom sheet** — Tapping "Defer" opens an Actionsheet with optional reason field and date picker.
- Test 3: **Dismiss removes task** — Tapping "Dismiss" with optional reason calls `dismissTask` mutation and removes the task.
- Test 4: **Priority rebalance after action** — After any task status change, the queue re-renders with updated priority ordering.
- Test 5: **Skill progression increment** — Completing a task triggers a skill progression counter update.
- Test 6: **Accessible button labels** — "Did It" button has accessible label "Mark '{task title} for {hive name}' as done", not just "Did It".
- Test 7: **Success toast** — After completing a task, a toast renders with encouraging "Nice work" message.
- Test 8: **Optimistic UI rollback** — If mutation fails, the task reappears in its original position in the queue.

### Technical Specifications
- **Buttons:** `<Button action="positive">` (Did It), `<Button action="secondary" variant="outline">` (Defer), `<Button action="secondary" variant="link">` (Dismiss)
- **Bottom sheet:** Gluestack `<Actionsheet>` with `<ActionsheetContent>`
- **Toast:** Gluestack `<Toast>` with auto-dismiss at 3 seconds
- **Mutations:** `completeTask`, `deferTask`, `dismissTask` — all return `TaskResult` with updated priorities
- **Optimistic updates:** TanStack Query `onMutate` for immediate UI feedback, `onError` for rollback

### Anti-Patterns to Avoid
- DO NOT use generic button labels like "Done" or "OK" — use context-rich labels per accessibility requirements
- DO NOT use `<AlertDialog>` for defer/dismiss — use `<Actionsheet>` (bottom sheet) for quick confirmations
- DO NOT skip optimistic updates — the queue must feel responsive even on slow connections
- DO NOT use punitive language in toasts — "Nice work" not "Task complete"
- DO NOT compute priority rebalancing on the client — server handles this via FR18
- DO NOT make the reason field required for defer/dismiss — it is always optional

### Project Structure Notes
- Feature components: `apps/mobile/src/features/planning/components/TaskActionButtons/index.tsx`
- Feature components: `apps/mobile/src/features/planning/components/DeferTaskSheet/index.tsx`
- Feature components: `apps/mobile/src/features/planning/components/DismissTaskSheet/index.tsx`
- Tests co-located with each component
- GraphQL mutations: `apps/mobile/src/features/planning/mutations/taskActions.ts`

### References
- [Source: epics.md#Story 10.3 — Task Actions: Complete, Defer, Dismiss]
- [Source: prd.md#FR16b, FR18, FR34]
- [Source: CLAUDE.md#Button Hierarchy — Positive, Secondary]
- [Source: CLAUDE.md#Accessibility Requirements — context-rich button labels]
- [Source: CLAUDE.md#Emotional Design & Tone — "Nice work" not "Task complete"]
- [Source: CLAUDE.md#Navigation Patterns — Bottom sheets for quick confirmations]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
