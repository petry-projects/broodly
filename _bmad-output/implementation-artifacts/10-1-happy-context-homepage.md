# Story 10.1: Happy Context Homepage

Status: ready-for-dev

## Story

As a user,
I want a home screen that shows my current context (weather, bloom, seasonal phase) and clear CTAs,
so that I know what matters today without digging through menus or data screens.

## Acceptance Criteria (BDD)

1. GIVEN a logged-in user with at least one apiary WHEN the app opens THEN the Happy Context Homepage renders HomepageContextCards for weather, bloom status, and seasonal phase.
2. GIVEN the homepage WHEN it renders THEN two primary CTAs are visible: "View My Apiaries" (outline) and "Start Today's Plan" (solid primary).
3. GIVEN seasonal risk signals are active for the user's region (swarm, starvation, pest pressure, queen risk) WHEN the homepage renders THEN appropriate risk-themed seasonal signals display with status badges (FR17).
4. GIVEN a user with a configured skill level WHEN the homepage renders THEN a skill-adaptive greeting and tone are displayed (e.g., "Good morning, Hannah" for newbies vs. operational summary for sideliners).
5. GIVEN previously cached context data WHEN the homepage loads THEN cached data renders immediately (cache-first via TanStack Query) and fresh data replaces it when the fetch completes.
6. GIVEN the homepage WHEN measured THEN it loads and becomes interactive within 2 seconds (NFR1).
7. GIVEN a user returning after more than 7 days of inactivity WHEN the homepage renders THEN a "Welcome back" header appears with a summary of changes during absence and a priority "Catch up" CTA replaces the standard CTAs.

## Tasks / Subtasks

- [ ] Create `HomepageContextCard` component (AC: #1)
  - [ ] Build on `<Card variant="filled">` with semantic background colors per CLAUDE.md
  - [ ] Implement `type` tva() variant: `weather | bloom | seasonal`
  - [ ] Weather card: current conditions, high/low, next-week outlook
  - [ ] Bloom card: current bloom status, active flora
  - [ ] Seasonal card: current seasonal phase, relevant bee mindset narrative
- [ ] Implement risk-themed seasonal signal badges (AC: #3)
  - [ ] Swarm risk: `<Badge action="warning">` with swarm icon
  - [ ] Starvation risk: `<Badge action="error">` with starvation icon
  - [ ] Pest pressure: `<Badge action="warning">` with pest icon
  - [ ] Queen risk: `<Badge action="warning">` with queen icon
  - [ ] Each signal includes icon + text + color (never color alone)
- [ ] Build homepage screen layout (AC: #1, #2)
  - [ ] Skill-adaptive greeting at top
  - [ ] HomepageContextCards in horizontal scroll or stacked layout
  - [ ] Primary CTA: "Start Today's Plan" — `<Button action="primary" variant="solid" size="xl">`
  - [ ] Secondary CTA: "View My Apiaries" — `<Button action="primary" variant="outline">`
  - [ ] Minimum 48x48px touch targets for all interactive elements
- [ ] Implement skill-adaptive greeting (AC: #4)
  - [ ] Fetch user skill level from Zustand auth store
  - [ ] Newbie: warm personal greeting with encouraging tone
  - [ ] Amateur: summary of week's priorities
  - [ ] Sideliner: operational dashboard-style summary
- [ ] Implement cache-first data loading (AC: #5, #6)
  - [ ] Configure TanStack Query with persistent cache for context data
  - [ ] Stale-while-revalidate pattern for weather, bloom, seasonal data
  - [ ] Placeholder/skeleton state while initial load in progress
- [ ] Implement re-engagement flow (AC: #7)
  - [ ] Detect inactivity > 7 days from last session timestamp
  - [ ] Render "Welcome back" header with change summary
  - [ ] Replace standard CTAs with priority "Catch up on [X] hives" CTA
  - [ ] Recovery-oriented tone per emotional design guidelines
- [ ] Wire up GraphQL queries for homepage context data
  - [ ] Query: weather context by user region
  - [ ] Query: bloom/flora context by user region
  - [ ] Query: seasonal phase and risk signals
  - [ ] Query: user skill level and last session timestamp
- [ ] Register homepage as default route in Expo Router

## Dev Notes

### Architecture Compliance
- Homepage is the entry point for all user journeys — every session starts here
- Context cards use `<Card variant="filled">` with semantic backgrounds per CLAUDE.md component mapping
- CTAs follow the button hierarchy: solid primary for main action, outline for secondary
- Navigation: "View My Apiaries" navigates to apiary list; "Start Today's Plan" navigates to weekly action queue
- Screen file goes in `apps/mobile/app/` (Expo Router file-based routing)
- Feature components go in `apps/mobile/src/features/planning/components/`

### TDD Requirements (Tests First!)
- Test 1: **Context cards render** — Homepage renders three HomepageContextCards (weather, bloom, seasonal) with correct variant types and non-empty content.
- Test 2: **CTAs render correctly** — Two primary CTAs render with correct labels, actions, and variants. "Start Today's Plan" is solid primary; "View My Apiaries" is outline.
- Test 3: **Seasonal risk signals** — When risk signals are active, appropriate Badge components render with correct action variants (warning/error) and include both icon and text.
- Test 4: **Skill-adaptive greeting** — Greeting text adapts based on user skill level: newbie gets warm greeting, amateur gets weekly summary, sideliner gets operational summary.
- Test 5: **Cache-first loading** — Mock TanStack Query to verify stale cache renders immediately while fresh data is fetched in background.
- Test 6: **Re-engagement detection** — When last session > 7 days ago, "Welcome back" header and catch-up CTA render instead of standard CTAs.
- Test 7: **Performance** — Homepage renders initial content within 2 seconds using cached data (integration test).

### Technical Specifications
- **Component:** `HomepageContextCard` — `<Card variant="filled">` with tva() type variant
- **Routing:** Default route `/` or `/(tabs)/index` in Expo Router
- **State:** TanStack Query for server state (weather, bloom, seasonal); Zustand for UI state (last session)
- **GraphQL:** Queries for `weatherContext`, `bloomContext`, `seasonalPhase`, `seasonalRiskSignals`
- **Caching:** TanStack Query `staleTime` of 5 minutes for weather, 1 hour for bloom/seasonal

### Anti-Patterns to Avoid
- DO NOT hardcode hex colors — use Gluestack design tokens (`bg-background-success`, `bg-background-warning`, etc.)
- DO NOT use color alone for status indication — always pair with icon and text
- DO NOT block rendering on fresh data — always show cached data first
- DO NOT use punitive language — tone is calm, supportive, recovery-oriented
- DO NOT create a custom card component when `<Card variant="filled">` with tva() suffices
- DO NOT put homepage components in `packages/ui/` — these are feature-specific, go in `apps/mobile/src/features/planning/`

### Project Structure Notes
- Screen: `apps/mobile/app/(tabs)/index.tsx`
- Feature components: `apps/mobile/src/features/planning/components/HomepageContextCard/index.tsx`
- Feature components: `apps/mobile/src/features/planning/components/SeasonalRiskSignal/index.tsx`
- Feature components: `apps/mobile/src/features/planning/components/SkillGreeting/index.tsx`
- Tests co-located: `HomepageContextCard/HomepageContextCard.test.tsx`
- GraphQL queries: `apps/mobile/src/features/planning/queries/homepageContext.ts`

### References
- [Source: epics.md#Story 10.1 — Happy Context Homepage]
- [Source: prd.md#FR10, FR11, FR13, FR17]
- [Source: ux-design-specification.md#Journey Patterns — Happy Context Homepage first]
- [Source: ux-design-specification.md#Re-engagement After Inactivity]
- [Source: CLAUDE.md#Custom Domain Components — HomepageContextCard]
- [Source: CLAUDE.md#Button Hierarchy]
- [Source: CLAUDE.md#Navigation Patterns]
- [Source: CLAUDE.md#Emotional Design & Tone]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
