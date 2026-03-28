# Story 5.5: Offline Indicator and Staleness UX

Status: ready-for-dev

## Story

As a user,
I want clear visual indicators when data is stale or I am offline,
so that I understand the reliability of what I am seeing and can make informed decisions in the field.

## Acceptance Criteria (BDD)

1. GIVEN cached data is less than 24 hours old WHEN it renders on screen THEN a subtle staleness badge displays (muted text, small font) indicating time since last refresh.
2. GIVEN cached data is between 24 and 72 hours old WHEN it renders on screen THEN an amber warning badge displays with `<Badge action="warning" variant="outline">` indicating staleness.
3. GIVEN cached data is more than 72 hours old WHEN it renders on screen THEN a red banner displays with `<Alert action="error">` warning that data may be significantly outdated, and conservative defaults messaging appears.
4. GIVEN the device loses connectivity WHEN the offline banner appears THEN it renders within 2 seconds as a Sky Blue `<Alert action="info">` with a cloud-offline icon.
5. GIVEN weather data has a per-source staleness threshold of 24 hours WHEN the weather data is older than 24 hours THEN a source-specific staleness indicator displays on weather-derived context cards.
6. GIVEN flora data has a per-source staleness threshold of 7 days WHEN the flora data is older than 7 days THEN a source-specific staleness indicator displays on flora-derived context cards.
7. GIVEN any data source is stale beyond its threshold WHEN it contributes to a recommendation THEN the recommendation card shows a confidence downgrade message explaining reduced reliability.
8. GIVEN the device regains connectivity WHEN fresh data is fetched THEN staleness indicators update or disappear accordingly.

## Tasks / Subtasks

- [ ] Write staleness tier rendering tests before implementation (AC: #1, #2, #3)
  - [ ] Test: `<StalenessIndicator>` with `dataUpdatedAt` 2 hours ago renders subtle badge with "2h ago" text
  - [ ] Test: `<StalenessIndicator>` with `dataUpdatedAt` 36 hours ago renders amber warning badge
  - [ ] Test: `<StalenessIndicator>` with `dataUpdatedAt` 80 hours ago renders red alert banner
  - [ ] Test: `<StalenessIndicator>` with `dataUpdatedAt` just now renders nothing (data is fresh)
- [ ] Write per-source staleness tests (AC: #5, #6)
  - [ ] Test: weather staleness indicator appears when weather data is > 24 hours old
  - [ ] Test: flora staleness indicator appears when flora data is > 7 days old
  - [ ] Test: telemetry staleness uses configurable threshold
  - [ ] Test: fresh source data does not show staleness indicator
- [ ] Write confidence downgrade tests (AC: #7)
  - [ ] Test: `<ConfidenceDowngradeNotice>` renders when any contributing source is stale
  - [ ] Test: downgrade notice lists which sources are stale
  - [ ] Test: downgrade notice does not render when all sources are fresh
- [ ] Write offline banner timing test (AC: #4)
  - [ ] Test: offline banner renders within 2 seconds of connectivity store reporting offline
  - [ ] Test: offline banner disappears when connectivity is restored (AC: #8)
- [ ] Create staleness calculation utility (AC: #1, #2, #3)
  - [ ] Create `apps/mobile/src/services/staleness/staleness-utils.ts`
  - [ ] `getStalenessLevel(dataUpdatedAt: Date): 'fresh' | 'subtle' | 'warning' | 'critical'`
  - [ ] Thresholds: fresh (< staleTime), subtle (< 24h), warning (24-72h), critical (> 72h)
  - [ ] `getRelativeTimeLabel(dataUpdatedAt: Date): string` — "2h ago", "2 days ago", etc.
- [ ] Create per-source staleness configuration (AC: #5, #6)
  - [ ] Create `apps/mobile/src/services/staleness/source-thresholds.ts`
  - [ ] Define thresholds: `weather: 24h`, `flora: 7d`, `telemetry: configurable (default 1h)`
  - [ ] `getSourceStalenessLevel(source: DataSource, dataUpdatedAt: Date): StalenessLevel`
- [ ] Create `<StalenessIndicator>` component (AC: #1, #2, #3)
  - [ ] Create `apps/mobile/src/features/staleness/components/StalenessIndicator/index.tsx`
  - [ ] Props: `dataUpdatedAt: Date`, `source?: DataSource`
  - [ ] **Fresh:** render nothing
  - [ ] **Subtle (<24h):** `<Text size="xs" className="text-typography-500">` with relative time
  - [ ] **Warning (24-72h):** `<Badge action="warning" variant="outline"><BadgeText>` with relative time
  - [ ] **Critical (>72h):** `<Alert action="error"><AlertIcon /><AlertText>` with warning message
  - [ ] Accessible: announce staleness level to screen readers
- [ ] Create `<SourceStalenessIndicator>` component (AC: #5, #6)
  - [ ] Create `apps/mobile/src/features/staleness/components/SourceStalenessIndicator/index.tsx`
  - [ ] Props: `source: DataSource`, `dataUpdatedAt: Date`
  - [ ] Uses per-source thresholds from `source-thresholds.ts`
  - [ ] Renders inline on context cards (weather, flora, telemetry)
- [ ] Create `<ConfidenceDowngradeNotice>` component (AC: #7)
  - [ ] Create `apps/mobile/src/features/staleness/components/ConfidenceDowngradeNotice/index.tsx`
  - [ ] Props: `staleSources: Array<{ source: DataSource; dataUpdatedAt: Date }>`
  - [ ] Renders `<Alert action="warning" variant="outline">` listing stale sources
  - [ ] Message pattern: "Recommendation confidence is reduced because [weather data, flora data] are outdated."
  - [ ] Renders nothing if `staleSources` is empty
- [ ] Create `useStaleness` hook (AC: #1, #2, #3, #8)
  - [ ] Create `apps/mobile/src/features/staleness/hooks/use-staleness.ts`
  - [ ] Accepts TanStack Query `dataUpdatedAt` timestamp
  - [ ] Returns `{ level, label, isStale }` reactive to time passing
  - [ ] Re-evaluates when data is refetched (AC: #8)
- [ ] Create `useSourceStaleness` hook (AC: #5, #6)
  - [ ] Create `apps/mobile/src/features/staleness/hooks/use-source-staleness.ts`
  - [ ] Accepts source type and data timestamp
  - [ ] Returns staleness level based on source-specific thresholds
- [ ] Integrate offline banner from Story 5.3 into root layout (AC: #4)
  - [ ] Verify `OfflineBanner` from Story 5.3 renders globally in `_layout.tsx`
  - [ ] Verify 2-second appearance timing from connectivity store update
  - [ ] Verify banner disappears on reconnection (AC: #8)
- [ ] Create staleness feature barrel export (AC: all)
  - [ ] Create `apps/mobile/src/features/staleness/index.ts`
  - [ ] Export all components and hooks for use by feature screens

## Dev Notes

### Architecture Compliance
- Cache-first reads with stale-while-revalidate per architecture.md MVP connectivity model
- Three-tier staleness display per CLAUDE.md: <24h subtle, 24-72h amber, >72h red
- Offline banner: Sky Blue `<Alert action="info">` per CLAUDE.md status semantics
- Per-source staleness for weather (24h), flora (7d), telemetry (configurable) per epics.md FR48a/FR48c
- Confidence downgrade messaging per FR48b
- Staleness hooks consume TanStack Query `dataUpdatedAt` — the bridge between server cache and staleness UX
- Status is NEVER color-only — always pair with icons, labels, and text per CLAUDE.md accessibility rules

### TDD Requirements (Tests First!)
- Test 1: **Staleness tier logic** — Assert `getStalenessLevel(now - 2h)` returns `subtle`, `getStalenessLevel(now - 36h)` returns `warning`, `getStalenessLevel(now - 80h)` returns `critical`.
- Test 2: **Subtle badge render** — Render `StalenessIndicator` with 2-hour-old data, assert muted text with "2h ago" is present.
- Test 3: **Amber warning render** — Render `StalenessIndicator` with 36-hour-old data, assert `Badge action="warning"` renders.
- Test 4: **Red critical render** — Render `StalenessIndicator` with 80-hour-old data, assert `Alert action="error"` renders with warning text.
- Test 5: **Per-source thresholds** — Assert weather at 25h is stale, weather at 23h is not. Assert flora at 8d is stale, flora at 6d is not.
- Test 6: **Confidence downgrade** — Render `ConfidenceDowngradeNotice` with stale weather source, assert warning lists "weather data".

### Technical Specifications
- **Staleness tiers:**
  - Fresh: `dataUpdatedAt` within TanStack Query `staleTime` (5 min default)
  - Subtle: < 24 hours — `<Text size="xs">` in `text-typography-500`
  - Warning: 24-72 hours — `<Badge action="warning" variant="outline">`
  - Critical: > 72 hours — `<Alert action="error">`
- **Per-source thresholds:**
  - Weather: 24 hours (FR48c)
  - Flora: 7 days (FR48c)
  - Telemetry: configurable, default 1 hour (FR48c)
- **Offline banner:**
  - Color: Sky Blue `info-500` (#4A90C4)
  - Component: `<Alert action="info"><AlertIcon as={CloudOff} /><AlertText>You are offline. Showing cached data.</AlertText></Alert>`
  - Timing: appears within 2 seconds of connectivity loss
- **Confidence downgrade message pattern:** "Recommendation confidence is reduced because {source list} {is/are} outdated."
- **TanStack Query integration:** use `dataUpdatedAt` from query result metadata

### Anti-Patterns to Avoid
- DO NOT use color alone for staleness indication — always include text labels and icons per CLAUDE.md accessibility rules
- DO NOT use blocking modals or dialogs for staleness — use inline indicators per CLAUDE.md (warnings are ALWAYS non-blocking inline)
- DO NOT hardcode staleness thresholds in components — centralize in `source-thresholds.ts` for configurability
- DO NOT re-implement offline detection — consume the connectivity store from Story 5.3
- DO NOT use `setInterval` for staleness re-evaluation — use reactive hooks that respond to data changes
- DO NOT show staleness indicators for truly fresh data — the "fresh" state renders nothing
- DO NOT panic the user with critical staleness messaging — tone should be calm and recovery-oriented per CLAUDE.md emotional design

### Project Structure Notes
- Staleness utils: `apps/mobile/src/services/staleness/staleness-utils.ts`
- Source thresholds: `apps/mobile/src/services/staleness/source-thresholds.ts`
- StalenessIndicator: `apps/mobile/src/features/staleness/components/StalenessIndicator/index.tsx`
- SourceStalenessIndicator: `apps/mobile/src/features/staleness/components/SourceStalenessIndicator/index.tsx`
- ConfidenceDowngradeNotice: `apps/mobile/src/features/staleness/components/ConfidenceDowngradeNotice/index.tsx`
- useStaleness hook: `apps/mobile/src/features/staleness/hooks/use-staleness.ts`
- useSourceStaleness hook: `apps/mobile/src/features/staleness/hooks/use-source-staleness.ts`
- Feature barrel: `apps/mobile/src/features/staleness/index.ts`
- Tests co-located with each file

### References
- [Source: architecture.md#MVP Connectivity & Caching Strategy — Clear "offline" indicator when connectivity is lost]
- [Source: architecture.md#Frontend Architecture — cache-first reads via TanStack Query persistent cache]
- [Source: CLAUDE.md#Offline & Sync Patterns — Staleness escalation: <24h subtle badge, 24-72h amber warning, >72h red banner]
- [Source: CLAUDE.md#Status Semantics — Offline state uses Alert action="info"]
- [Source: CLAUDE.md#Accessibility Requirements — Status ALWAYS includes icon + text + color]
- [Source: epics.md#Story 5.5 — FR48a per-source staleness, FR48b confidence downgrade, FR48c configurable thresholds]
- [Source: CLAUDE.md#Color Token System — info-500 Sky Blue #4A90C4]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
