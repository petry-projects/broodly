# Story 10.4: Seasonal Planning Calendar

Status: ready-for-dev

## Story

As a user,
I want a seasonal planning calendar showing recommended activities by month,
so that I can see what is coming and prepare ahead of time.

## Acceptance Criteria (BDD)

1. GIVEN a user with a configured region WHEN they navigate to the seasonal calendar THEN a SeasonalPlanningCalendar grid renders showing months with activity indicator badges.
2. GIVEN a month in the calendar WHEN the user taps it THEN a detail view shows recommended activities for that period with descriptions and timing guidance.
3. GIVEN known risk windows (swarm season, starvation period, pest pressure) WHEN the calendar renders THEN those periods are highlighted with appropriate status colors: swarm (warning), starvation (error), pest pressure (warning).
4. GIVEN the user's regional and seasonal context WHEN the calendar renders THEN activities and risk windows adapt to the user's specific region and climate zone.
5. GIVEN the user's skill level WHEN activity details render THEN guidance complexity adapts to the user's experience (newbie gets more explanation, sideliner gets concise operational notes).
6. GIVEN the current month WHEN the calendar renders THEN the current month is visually highlighted and the calendar scrolls to show it prominently.

## Tasks / Subtasks

- [ ] Create `SeasonalPlanningCalendar` component (AC: #1, #6)
  - [ ] Build on `<Box>` + grid layout per CLAUDE.md component mapping
  - [ ] Render 12-month grid with month labels
  - [ ] Each month cell contains activity count badge and risk indicator icons
  - [ ] Current month highlighted with `bg-primary-100` or similar emphasis
  - [ ] Seasonal phase labels as horizontal bands across relevant month ranges
- [ ] Create `MonthDetailView` component (AC: #2, #5)
  - [ ] Full-screen or bottom sheet view showing month's recommended activities
  - [ ] Activity list: feeding, treatment, inspection types, equipment prep, etc.
  - [ ] Each activity shows: title, description, timing window, priority level
  - [ ] Skill-adaptive detail: newbies get "why" explanations; sideliners get concise checklists
  - [ ] Link to current week's action queue when viewing current month
- [ ] Implement risk window highlighting (AC: #3)
  - [ ] Swarm risk window: `<Badge action="warning">` with warning-500 background band
  - [ ] Starvation risk window: `<Badge action="error">` with error-500 background band
  - [ ] Pest pressure window: `<Badge action="warning">` with warning-300 outline band
  - [ ] Queen risk window: `<Badge action="warning">` with distinct icon
  - [ ] Risk windows span multiple months as horizontal bands
  - [ ] Each risk includes icon + text (never color alone)
- [ ] Implement regional adaptation (AC: #4)
  - [ ] Fetch regional seasonal template based on user's configured region
  - [ ] Adjust activity timing based on latitude, climate zone, and microclimate offsets
  - [ ] Handle southern hemisphere month inversion
  - [ ] Display region context label on calendar header
- [ ] Implement skill-level adaptation (AC: #5)
  - [ ] Newbie: detailed explanations with "why" rationale for each activity
  - [ ] Amateur: balanced detail with tips
  - [ ] Sideliner: concise operational checklists, batch-oriented framing
- [ ] Wire up GraphQL queries
  - [ ] Query: `seasonalCalendar(userId, year)` — returns months with activities and risk windows
  - [ ] Query: `monthDetail(userId, year, month)` — returns detailed activities for a specific month
  - [ ] Data sourced from regional seasonal templates + user hive configuration
- [ ] Implement navigation and routing
  - [ ] Calendar accessible from planning tab or homepage
  - [ ] Month tap navigates to detail view
  - [ ] Current week link navigates to weekly action queue (Story 10.2)

## Dev Notes

### Architecture Compliance
- SeasonalPlanningCalendar is a custom domain component built on `<Box>` + `<Grid>` per CLAUDE.md
- Uses `<Pressable>` for month cells, `<Text>` for labels, `<Badge>` for indicators
- Calendar data is generated server-side from regional seasonal templates + user hive config
- Follows progressive reveal: calendar shows high-level overview, tap reveals detail
- Risk windows use status semantics from CLAUDE.md: warning for swarm/pest, error for starvation

### TDD Requirements (Tests First!)
- Test 1: **Calendar renders 12 months** — SeasonalPlanningCalendar renders a grid with 12 month cells, each with a label and activity badge.
- Test 2: **Month tap shows detail** — Tapping a month cell renders MonthDetailView with recommended activities for that month.
- Test 3: **Risk window highlighting** — Given risk windows in the data, corresponding months display warning/error badges with appropriate colors.
- Test 4: **Regional adaptation** — Given two users in different regions, their calendars show different activity timing and risk windows.
- Test 5: **Skill-level adaptation** — Given a newbie user, month detail shows expanded "why" explanations; given a sideliner, detail shows concise checklists.
- Test 6: **Current month highlighted** — The current month cell has a distinct visual highlight and is in the visible viewport on initial render.

### Technical Specifications
- **Component:** `SeasonalPlanningCalendar` — `<Box>` + flexbox grid layout
- **Component:** `MonthDetailView` — `<Card variant="elevated">` or full screen
- **Routing:** `/planning/calendar` in Expo Router; month detail as `/planning/calendar/[month]`
- **State:** TanStack Query for calendar data; no complex client state needed
- **GraphQL:** `seasonalCalendar`, `monthDetail` queries
- **Data:** Server generates from regional templates (latitude, climate zone, elevation offset)

### Anti-Patterns to Avoid
- DO NOT use a third-party calendar library — build on `<Box>` + `<Grid>` per CLAUDE.md spec
- DO NOT hardcode seasonal data on the client — all seasonal logic is server-generated from regional templates
- DO NOT use color alone for risk windows — always pair with icon, text, and badge
- DO NOT show all 12 months with equal weight — highlight current month and upcoming 3 months
- DO NOT render flat activity lists — group by activity type with visual hierarchy
- DO NOT ignore southern hemisphere — month-to-season mapping must account for user's hemisphere

### Project Structure Notes
- Screen: `apps/mobile/app/planning/calendar.tsx`
- Screen: `apps/mobile/app/planning/calendar/[month].tsx`
- Feature components: `apps/mobile/src/features/planning/components/SeasonalPlanningCalendar/index.tsx`
- Feature components: `apps/mobile/src/features/planning/components/MonthDetailView/index.tsx`
- Feature components: `apps/mobile/src/features/planning/components/RiskWindowBand/index.tsx`
- Tests co-located with each component
- GraphQL queries: `apps/mobile/src/features/planning/queries/seasonalCalendar.ts`

### References
- [Source: epics.md#Story 10.4 — Seasonal Planning Calendar]
- [Source: prd.md#FR15, FR17]
- [Source: ux-design-specification.md#Planning Components — SeasonalPlanningCalendar]
- [Source: CLAUDE.md#Custom Domain Components — SeasonalPlanningCalendar]
- [Source: CLAUDE.md#Status Semantics — warning/error mapping]
- [Source: CLAUDE.md#Layout Principles — Progressive reveal]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
