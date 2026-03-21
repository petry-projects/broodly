# Story 10.5: Dynamic Priority Updates

Status: ready-for-dev

## Story

As a user,
I want my action queue to update when new context arrives (weather change, telemetry alert, completed inspection),
so that priorities always reflect current reality and I am acting on the most relevant information.

## Acceptance Criteria (BDD)

1. GIVEN a new telemetry reading is received (e.g., weight drop, temperature spike) WHEN the system processes it THEN the action queue is recomputed with updated priorities reflecting the new data.
2. GIVEN a completed inspection WHEN the results are saved THEN related tasks are automatically removed or updated and new tasks may be added based on inspection findings.
3. GIVEN a weather change affecting urgency (e.g., incoming frost, extended rain) WHEN the weather data updates THEN relevant tasks are bumped up in priority.
4. GIVEN a priority recomputation is in progress WHEN the user is viewing the queue THEN the UI remains responsive (recomputation is async and does not block interaction).
5. GIVEN the user is viewing the queue WHEN they pull to refresh THEN a fresh priority recomputation is triggered and results are displayed.
6. GIVEN a new high-priority item surfaces from recomputation WHEN the queue updates THEN the new item is visually highlighted and a notification is sent if the user is not actively viewing the queue.
7. GIVEN priority changes in the queue WHEN the UI updates THEN changed items animate to their new positions to make reordering visible.

## Tasks / Subtasks

- [ ] Implement server-side priority recomputation triggers (AC: #1, #2, #3)
  - [ ] Pub/Sub event handler: `telemetry-reading-received` triggers queue recomputation for affected hives
  - [ ] Pub/Sub event handler: `inspection-completed` removes related tasks and generates new tasks from findings
  - [ ] Pub/Sub event handler: `weather-update-received` adjusts urgency scores for weather-sensitive tasks
  - [ ] Recomputation is async — writes updated priorities to database, publishes `queue-updated` event
- [ ] Implement client-side queue refresh (AC: #4, #5)
  - [ ] TanStack Query `refetchInterval` for background polling (configurable, default 5 minutes)
  - [ ] Pull-to-refresh triggers immediate `invalidateQueries` for `weeklyActionQueue`
  - [ ] Background refetch does not block or flash the UI — uses `keepPreviousData` option
  - [ ] Loading indicator only on pull-to-refresh, not on background polls
- [ ] Implement new high-priority item surfacing (AC: #6)
  - [ ] Compare previous and current queue state to detect newly surfaced high-priority items
  - [ ] Visual highlight: new items render with a brief attention animation (respecting `prefers-reduced-motion`)
  - [ ] If user is not on the planning screen, send an in-app notification via notification center
  - [ ] Notification: `<ActionableNotificationCard>` with task summary and "View" action
- [ ] Implement animated reordering (AC: #7)
  - [ ] Use `LayoutAnimation` or equivalent for smooth position transitions
  - [ ] Respect `prefers-reduced-motion`: skip animation and use instant update
  - [ ] Items moving up show upward animation; items moving down show downward animation
  - [ ] New items fade in; removed items fade out
- [ ] Implement inspection-completion task cascade (AC: #2)
  - [ ] When inspection is completed, GraphQL subscription or polling detects task updates
  - [ ] Completed inspection tasks are removed from queue
  - [ ] New tasks generated from inspection findings (e.g., "Queen not spotted — schedule re-check") appear in queue
  - [ ] Task additions include rationale linking back to the inspection
- [ ] Wire up GraphQL queries and subscriptions
  - [ ] Query: `weeklyActionQueue` with `lastUpdated` timestamp for change detection
  - [ ] Optional: GraphQL subscription `onQueueUpdated(userId)` for real-time push (post-MVP)
  - [ ] MVP approach: polling with TanStack Query refetch intervals
- [ ] Implement background recomputation safeguards
  - [ ] Debounce rapid consecutive triggers (e.g., multiple telemetry readings within seconds)
  - [ ] Recomputation timeout: 30 seconds max; if exceeded, serve cached priorities
  - [ ] Rate limit: max 1 recomputation per user per 2 minutes

## Dev Notes

### Architecture Compliance
- Priority recomputation is entirely server-side via Pub/Sub event handlers in `apps/api/internal/event/`
- Client uses TanStack Query polling for MVP; real-time subscriptions are post-MVP
- Event-driven architecture: telemetry, inspection, and weather events are published to Pub/Sub topics
- Recomputation writes to database; client polls for updated data
- Notifications for off-screen updates go through the notification dispatch system (Epic 12 dependency — for MVP, use in-app toast fallback)

### TDD Requirements (Tests First!)
- Test 1: **Telemetry triggers recomputation** — A new telemetry reading event triggers the `queue-recomputation` handler, and the resulting queue has updated priority scores for affected tasks.
- Test 2: **Inspection completion cascades** — Completing an inspection removes related tasks and adds new tasks generated from findings.
- Test 3: **Weather change bumps priority** — A weather update increases the urgency score of weather-sensitive tasks.
- Test 4: **Async recomputation does not block UI** — While recomputation is in progress, the queue remains interactive and previous data is displayed.
- Test 5: **Pull-to-refresh triggers recomputation** — Pulling to refresh invalidates the TanStack Query cache and fetches fresh priorities.
- Test 6: **New high-priority item highlighted** — When a new high-priority item appears in the queue after refresh, it renders with a visual highlight.
- Test 7: **Animated reordering** — When task positions change, LayoutAnimation (or equivalent) is triggered for smooth transitions.
- Test 8: **Debounce rapid triggers** — Multiple telemetry events within 5 seconds result in a single recomputation, not multiple.

### Technical Specifications
- **Server:** Pub/Sub event handlers in `apps/api/internal/event/` for telemetry, inspection, weather triggers
- **Server:** Recomputation service in `apps/api/internal/service/priority/` — computes urgency x impact scores
- **Client polling:** TanStack Query `refetchInterval: 300000` (5 minutes) for background updates
- **Client:** `keepPreviousData: true` to avoid flash on background refetch
- **Animation:** React Native `LayoutAnimation` with `prefers-reduced-motion` check
- **Debounce:** Server-side 5-second debounce window per user; max 1 recomputation per 2 minutes
- **Timeout:** Recomputation capped at 30 seconds; fallback to cached priorities

### Anti-Patterns to Avoid
- DO NOT compute priorities on the client — all priority logic is server-side
- DO NOT use WebSocket subscriptions in MVP — use TanStack Query polling; subscriptions are post-MVP
- DO NOT block UI during recomputation — always show cached/previous data
- DO NOT ignore `prefers-reduced-motion` — provide static alternatives for all animations
- DO NOT trigger unlimited recomputations — debounce and rate-limit server-side
- DO NOT flash or re-render the entire queue on every poll — use `keepPreviousData` and diff for changes
- DO NOT send push notifications for every priority change — only notify for newly surfaced high-priority items

### Project Structure Notes
- Server event handlers: `apps/api/internal/event/queue_recomputation.go`
- Server service: `apps/api/internal/service/priority/recompute.go`
- Client hooks: `apps/mobile/src/features/planning/hooks/useQueuePolling.ts`
- Client components: `apps/mobile/src/features/planning/components/QueueUpdateHighlight/index.tsx`
- Client animation: `apps/mobile/src/features/planning/utils/queueAnimation.ts`
- Tests co-located with each module (Go tests in `_test.go`, TS tests in `.test.tsx`)

### References
- [Source: epics.md#Story 10.5 — Dynamic Priority Updates]
- [Source: prd.md#FR18]
- [Source: CLAUDE.md#Offline & Sync Patterns — TanStack Query, staleness escalation]
- [Source: CLAUDE.md#Accessibility Requirements — prefers-reduced-motion]
- [Source: architecture.md#Event-driven architecture, Pub/Sub]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
