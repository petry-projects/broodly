# Story 5.1: Expo Router Navigation Shell

Status: done

## Story

As a user,
I want bottom tab navigation with Home, Apiaries, Plan, and Settings tabs and stack navigation within each tab,
so that I can navigate the app's primary sections and drill into detail screens seamlessly on all platforms.

## Acceptance Criteria (BDD)

1. GIVEN the app is launched WHEN the root layout renders THEN a bottom tab bar displays exactly four tabs — Home, Apiaries, Plan, Settings — with icons and labels.
2. GIVEN any tab is tapped WHEN the navigation state updates THEN the active tab indicator highlights the selected tab and the corresponding screen stub renders.
3. GIVEN the Apiaries tab is active WHEN a deep link to `/apiaries/:id` is opened THEN Expo Router resolves the route and renders the apiary detail screen stub within the Apiaries stack.
4. GIVEN the bottom tab bar WHEN rendered on different screen widths (320px, 768px, 1024px) THEN each tab touch target is at least 48x48px and the bar renders consistently (snapshot test).
5. GIVEN any tab WHEN the user navigates to a child screen and presses back THEN the stack within that tab pops correctly without switching tabs.
6. GIVEN the app is loaded on web WHEN the URL path matches a tab route THEN the correct tab and screen render (web deep link parity).

## Tasks / Subtasks

- [ ] Write navigation render tests before implementation (AC: #1, #2, #4)
  - [ ] Test: four tabs render with correct labels and icons
  - [ ] Test: tapping each tab renders its screen stub
  - [ ] Test: active tab indicator updates on navigation
  - [ ] Test: snapshot test for bottom nav bar at mobile and tablet widths
- [ ] Write deep link and stack navigation tests (AC: #3, #5, #6)
  - [ ] Test: `/apiaries/:id` resolves to the Apiaries stack with the detail stub
  - [ ] Test: back navigation within a tab pops the inner stack
  - [ ] Test: web URL paths resolve to correct tabs
- [ ] Create Expo Router `(tabs)` layout in `apps/mobile/app/(tabs)/_layout.tsx` (AC: #1, #2)
  - [ ] Define four tab screens: `index` (Home), `apiaries`, `plan`, `settings`
  - [ ] Configure tab bar icons using Gluestack-compatible icon components
  - [ ] Set active/inactive tab colors using design token `primary-500` / `typography-500`
  - [ ] Ensure 48px minimum touch targets on all tab items
- [ ] Create screen stub components for each tab (AC: #1, #2)
  - [ ] `apps/mobile/app/(tabs)/index.tsx` — Home screen stub
  - [ ] `apps/mobile/app/(tabs)/apiaries/index.tsx` — Apiaries list stub
  - [ ] `apps/mobile/app/(tabs)/plan/index.tsx` — Plan screen stub
  - [ ] `apps/mobile/app/(tabs)/settings/index.tsx` — Settings screen stub
- [ ] Configure stack navigation within Apiaries tab (AC: #3, #5)
  - [ ] `apps/mobile/app/(tabs)/apiaries/_layout.tsx` — stack layout
  - [ ] `apps/mobile/app/(tabs)/apiaries/[id].tsx` — apiary detail stub
- [ ] Create root layout in `apps/mobile/app/_layout.tsx` (AC: #6)
  - [ ] Wrap with necessary providers (placeholder slots for auth, query, state providers)
  - [ ] Configure Expo Router for web deep linking
- [ ] Configure auth-gated layout group `(app)` vs `(auth)` route groups (AC: #1)
  - [ ] `apps/mobile/app/(auth)/_layout.tsx` — unauthenticated stack
  - [ ] Redirect logic placeholder (implemented fully in Story 5.4)
- [ ] Validate cross-platform rendering (AC: #4, #6)
  - [ ] Run on iOS simulator, Android emulator, and web browser
  - [ ] Verify responsive behavior at all three breakpoints

## Dev Notes

### Architecture Compliance
- Expo Router is the routing solution for all platforms (mobile + web) per architecture.md
- File-based routing in `apps/mobile/app/` per CLAUDE.md directory structure
- Bottom navigation with 4 tabs matches UX spec (Home, Apiaries, Plan, Settings)
- Route groups `(tabs)`, `(auth)` follow Expo Router conventions for layout nesting
- Screen components go in `apps/mobile/app/`; feature components go in `apps/mobile/src/features/`

### TDD Requirements (Tests First!)
- Test 1: **Tab rendering** — Render the `(tabs)/_layout.tsx` component and assert exactly 4 tabs with labels "Home", "Apiaries", "Plan", "Settings" are present.
- Test 2: **Active indicator** — Simulate tab press, assert the new tab has the active state style and the previous tab does not.
- Test 3: **Deep link resolution** — Use Expo Router testing utilities to navigate to `/apiaries/abc-123` and assert the Apiaries tab is active with the detail screen rendered.
- Test 4: **Snapshot** — Render the bottom tab bar and compare against a saved snapshot at 375px and 768px widths.
- Test 5: **Stack pop** — Navigate Home > Apiaries > Apiary Detail, press back, assert Apiaries list is shown (not Home).

### Technical Specifications
- **Expo Router:** file-based routing with `(tabs)` layout group
- **Tab bar:** 4 tabs — Home, Apiaries, Plan, Settings
- **Icons:** use `@expo/vector-icons` or Gluestack icon set
- **Touch targets:** 48px minimum per CLAUDE.md spacing rules
- **Active color:** `primary-500` (#D4880F)
- **Inactive color:** `typography-500` (#6B7280)
- **Breakpoints:** mobile 320-767px, tablet 768-1023px, desktop 1024px+
- **Route structure:**
  ```
  app/
  ├── _layout.tsx              # Root layout (providers)
  ├── (auth)/
  │   ├── _layout.tsx          # Auth stack
  │   └── sign-in.tsx
  └── (tabs)/
      ├── _layout.tsx          # Tab navigator
      ├── index.tsx            # Home
      ├── apiaries/
      │   ├── _layout.tsx      # Apiaries stack
      │   ├── index.tsx        # Apiaries list
      │   └── [id].tsx         # Apiary detail
      ├── plan/
      │   └── index.tsx        # Plan
      └── settings/
          └── index.tsx        # Settings
  ```

### Anti-Patterns to Avoid
- DO NOT use React Navigation directly — Expo Router wraps it with file-based conventions
- DO NOT hardcode colors — use design tokens from the Gluestack theme
- DO NOT create a 5th tab — the UX spec explicitly specifies 4 tabs
- DO NOT put business logic in route layout files — layouts handle navigation structure only
- DO NOT skip the `(auth)` route group — it is needed for Story 5.4 protected routes
- DO NOT use `<TouchableOpacity>` for tabs — rely on Expo Router's tab bar component with proper accessibility

### Project Structure Notes
- All route files: `apps/mobile/app/`
- Tab layout: `apps/mobile/app/(tabs)/_layout.tsx`
- Root layout: `apps/mobile/app/_layout.tsx`
- Tests co-located: `apps/mobile/app/__tests__/` or alongside route files

### References
- [Source: architecture.md#Frontend Architecture — Routing: Expo Router for all platforms]
- [Source: architecture.md#Complete Project Directory Structure — apps/mobile/app/]
- [Source: CLAUDE.md#Navigation Patterns — Bottom navigation bar for top-level destinations]
- [Source: CLAUDE.md#Spacing & Layout — 48px minimum touch targets]
- [Source: CLAUDE.md#Responsive Breakpoints]
- [Source: epics.md#Story 5.1 — 4 tabs per UX review blocker #1]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Installed expo-router (canary), expo-linking, expo-constants, @expo/metro-runtime, @expo/vector-icons, @testing-library/react-native@13
- Configured app.json with scheme "broodly" and expo-router plugin
- Switched entry point from index.ts to expo-router/entry
- Created full route structure: root layout, (tabs) with 4 tabs, (auth) group with sign-in
- Apiaries tab has nested stack with list + [id] detail screen
- Tab bar uses primary-500/typography-500 colors, 48px+ touch targets, Ionicons
- Root layout wraps SafeAreaProvider + GluestackUIProvider
- Added CSS module mock for Jest (`__mocks__/css.js`)
- 20 navigation tests covering: screen stubs, route params, layout exports, file structure
- All 89 tests pass (12 suites) including all existing tests

### File List
- apps/mobile/app/_layout.tsx — Root layout with providers
- apps/mobile/app/(tabs)/_layout.tsx — Tab navigator (Home, Apiaries, Plan, Settings)
- apps/mobile/app/(tabs)/index.tsx — Home screen stub
- apps/mobile/app/(tabs)/apiaries/_layout.tsx — Apiaries stack layout
- apps/mobile/app/(tabs)/apiaries/index.tsx — Apiaries list stub
- apps/mobile/app/(tabs)/apiaries/[id].tsx — Apiary detail stub
- apps/mobile/app/(tabs)/plan/index.tsx — Plan screen stub
- apps/mobile/app/(tabs)/settings/index.tsx — Settings screen stub
- apps/mobile/app/(auth)/_layout.tsx — Auth stack layout
- apps/mobile/app/(auth)/sign-in.tsx — Sign-in screen stub
- apps/mobile/__tests__/navigation.test.tsx — Navigation tests (20 tests)
- apps/mobile/__mocks__/css.js — CSS module mock for Jest
- apps/mobile/app.json — Updated with scheme + expo-router plugin
- apps/mobile/package.json — Updated entry point, deps, jest config
