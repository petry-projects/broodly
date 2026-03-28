# Story 7.6: Operation Dashboard — Sideliner View

Status: ready-for-dev

## Story

As a sideliner-level beekeeper managing multiple apiaries and many hives,
I want an operational dashboard that provides a high-level overview of all my apiaries with aggregated health status, hive counts, and quick-action navigation,
so that I can efficiently triage across locations without navigating into each apiary individually.

**FRs:** FR3, FR4

## Acceptance Criteria (BDD)

1. GIVEN a user with multiple apiaries WHEN they navigate to the operations dashboard THEN a summary bar displays total apiary count, total hive count, and count of hives in each status category (healthy, attention, warning, critical).
2. GIVEN the operations dashboard WHEN it loads THEN apiaries are listed in priority order with critical/warning apiaries sorted to the top.
3. GIVEN an apiary row on the dashboard WHEN rendered THEN it shows apiary name, location, hive count, worst-case status badge, and count of hives needing attention (attention + warning + critical).
4. GIVEN an apiary row WHEN the user taps it THEN navigation routes directly to the apiary detail screen (Story 7.2).
5. GIVEN the summary bar WHEN a status category count is tapped THEN the apiary list filters to show only apiaries containing hives in that status.
6. GIVEN the dashboard WHEN data is loading THEN skeleton placeholder cards render to indicate loading state.
7. GIVEN the dashboard WHEN the user pulls down THEN a pull-to-refresh triggers re-fetch of all apiary and hive status data.
8. GIVEN a user with only one apiary WHEN they view the dashboard THEN it still renders correctly with the summary bar and single apiary row (no minimum apiary count required).
9. GIVEN the dashboard WHEN viewed on tablet or desktop THEN the layout adapts to show a multi-column grid of apiary summary cards.
10. GIVEN the dashboard WHEN focused by a screen reader THEN the summary bar announces total counts and each apiary row announces name, status, and hive count.

## Tasks / Subtasks

- [ ] Create operations dashboard screen at `apps/mobile/app/(tabs)/dashboard/index.tsx` (AC: #1, #2, #6)
  - [ ] Implement TanStack Query hook `useDashboardSummary()` fetching all apiaries with aggregated hive status counts
  - [ ] Render summary bar: total apiaries, total hives, status category counts with color-coded badges
  - [ ] Render apiary list sorted by priority (critical first, then warning, attention, healthy)
  - [ ] Implement skeleton loading placeholders during data fetch
- [ ] Create `DashboardSummaryBar` component (AC: #1, #5)
  - [ ] Display total apiary count, total hive count
  - [ ] Display per-status counts as tappable badges: healthy (success), attention (warning outline), warning (warning solid), critical (error)
  - [ ] On badge tap, filter apiary list to matching status
  - [ ] Use `<HStack>` layout with consistent spacing
- [ ] Create `DashboardApiaryRow` component (AC: #3, #4)
  - [ ] Display apiary name, location, hive count, worst-case status badge
  - [ ] Display count of hives needing attention (attention + warning + critical combined)
  - [ ] Make row tappable with navigation to apiary detail screen
  - [ ] Use `<Card variant="outline">` for row styling with status accent
- [ ] Implement status filtering (AC: #5)
  - [ ] Maintain filter state in component state or Zustand store
  - [ ] Apply filter to apiary list when a status badge is tapped
  - [ ] Highlight active filter badge; tap again to clear filter
  - [ ] Show "No apiaries with {status} hives" empty state when filter yields no results
- [ ] Implement pull-to-refresh (AC: #7)
  - [ ] Wrap dashboard in `ScrollView` with `RefreshControl`
  - [ ] On refresh, invalidate all dashboard-related queries
- [ ] Implement responsive layout (AC: #8, #9)
  - [ ] Single column on mobile (320px-767px)
  - [ ] Two-column grid on tablet (768px-1023px)
  - [ ] Three-column grid on desktop (1024px+)
  - [ ] Use platform-aware responsive styles per CLAUDE.md breakpoints
- [ ] Implement accessibility (AC: #10)
  - [ ] Summary bar: accessible label "Dashboard summary: {n} apiaries, {m} hives, {k} critical, {j} warning"
  - [ ] Each apiary row: accessible label "{name}, {status}, {hiveCount} hives"
  - [ ] Status filter badges: accessible role "button" with "Filter by {status}" label

## Dev Notes

### Architecture Compliance
- The operations dashboard is a top-level tab destination, accessible from bottom navigation
- Data is fetched via a single aggregation query to minimize network round trips
- Server state managed via TanStack Query with cache-first reads for fast dashboard load
- Priority sorting (critical-first) is computed client-side from the aggregated status data
- Status filtering is client-side on already-fetched data — no additional network requests
- Responsive breakpoints follow CLAUDE.md: mobile 320-767px, tablet 768-1023px, desktop 1024px+

### TDD Requirements (Tests First!)
- Test 1: **Summary bar rendering** — Given aggregated data (5 apiaries, 42 hives, 2 critical, 5 warning, 8 attention, 27 healthy), the summary bar renders all counts correctly.
- Test 2: **Priority sorting** — Given apiaries with mixed worst-case statuses, the list sorts critical first, then warning, attention, healthy.
- Test 3: **Apiary row rendering** — Given an apiary with 3 critical and 2 warning hives, the row shows worst-case=critical and attention-count=5.
- Test 4: **Status filter** — Given a tap on the "critical" badge, only apiaries with critical hives display.
- Test 5: **Filter clear** — Given an active filter, tapping the same badge again clears it and shows all apiaries.
- Test 6: **Empty filter state** — Given a filter that matches no apiaries, an appropriate empty state renders.
- Test 7: **Pull-to-refresh** — Given a rendered dashboard, pull-to-refresh triggers query invalidation.
- Test 8: **Skeleton loading** — Given a loading state, skeleton placeholders render for the summary bar and apiary rows.
- Test 9: **Single apiary** — Given one apiary, the dashboard renders correctly without layout issues.
- Test 10: **Accessible labels** — Given the summary bar and apiary rows, screen reader labels include all required information.

### Technical Specifications
- **Summary bar:** `<HStack>` with `<Badge>` components for each status, total counts in `<Text size="md" bold>`
- **Apiary rows:** `<Card variant="outline">` with `<Pressable>` wrapper for navigation
- **Status badges:** Same Gluestack action mapping as health cards (success, warning outline, warning solid, error)
- **Priority sort order:** critical (0) > warning (1) > attention (2) > healthy (3)
- **Skeleton placeholders:** Use Gluestack `<Skeleton>` or custom placeholder matching card dimensions
- **Responsive grid:** `flex-wrap` with percentage widths: 100% mobile, 50% tablet, 33.3% desktop
- **GraphQL query:** Single `dashboardSummary` query returning apiaries with nested hive status aggregations
- **Touch targets:** minimum 48x48px for all tappable elements

### Anti-Patterns to Avoid
- DO NOT fetch each apiary's hives separately — use a single aggregation query for the dashboard
- DO NOT implement server-side filtering for status categories — client-side filter on fetched data is sufficient for MVP scale
- DO NOT hardcode column counts — use responsive breakpoints with flexible grid
- DO NOT skip skeleton loading states — dashboard is a primary entry point and must feel responsive
- DO NOT duplicate health status logic — reuse status constants and color mappings from Story 7.3 health cards
- DO NOT use color alone for status counts — badges include icon and text label

### Project Structure Notes
- Screen: `apps/mobile/app/(tabs)/dashboard/index.tsx`
- Feature components: `apps/mobile/src/features/dashboard/components/DashboardSummaryBar.tsx`, `DashboardApiaryRow.tsx`
- Hooks: `apps/mobile/src/features/dashboard/hooks/useDashboardSummary.ts`
- GraphQL operations: `apps/mobile/src/services/graphql/dashboard.ts`
- Shared status constants: reuse from `packages/domain-types/src/` (status priority, status labels)

### References
- [Source: epics.md#Epic 7 — Stories 7.1, 7.2]
- [Source: CLAUDE.md#Responsive Breakpoints — Mobile, Tablet, Desktop]
- [Source: CLAUDE.md#Status Semantics — Gluestack Action Mapping]
- [Source: CLAUDE.md#Layout Principles — Summary-before-detail, Context before controls]
- [Source: CLAUDE.md#Navigation Patterns — Bottom navigation for top-level destinations]
- [Source: architecture.md#Frontend Architecture — Route/screen code splitting, query prefetching]
- [Source: prd.md#FR3 — Manage multiple apiary locations]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
