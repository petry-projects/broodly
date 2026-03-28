# Story 12.3: Notification Sensitivity Configuration

Status: ready-for-dev

## Story

As a user,
I want to configure notification sensitivity per apiary with a slider control, set quiet hours to suppress notifications during specific time windows, and have non-urgent notifications bundled automatically,
so that I am not overwhelmed by low-value alerts and can control when and how I receive notifications.

## Acceptance Criteria (BDD)

1. GIVEN the Settings screen WHEN I navigate to "Notification Preferences" THEN I see a global sensitivity slider with three levels: High (all alerts), Medium (attention + warning + critical), Low (critical only).
2. GIVEN the global sensitivity is set to Medium WHEN a `healthy` or `info`-level notification is generated THEN it is suppressed and not dispatched.
3. GIVEN an apiary detail screen WHEN I tap "Notification Settings" THEN I see a per-apiary sensitivity slider that overrides the global setting for that apiary only.
4. GIVEN a per-apiary sensitivity override is set to High WHEN the global sensitivity is Low THEN notifications for that specific apiary use the High sensitivity (per-apiary wins).
5. GIVEN the Notification Preferences screen WHEN I configure quiet hours (e.g., 22:00-07:00) THEN no push notifications are delivered during that window; they are queued and delivered when the window ends.
6. GIVEN quiet hours are active WHEN a `critical`-priority notification is generated THEN it is delivered immediately, bypassing quiet hours.
7. GIVEN multiple non-urgent notifications are generated within a 30-minute window for the same user WHEN they are not critical THEN they are bundled into a single digest notification with a summary.
8. GIVEN I change any notification preference WHEN I save the change THEN it takes effect immediately for all future notifications without requiring an app restart.
9. GIVEN a seasonal transition (e.g., spring buildup) WHEN the system detects increased risk patterns THEN the sensitivity auto-adjusts by suggesting the user increase sensitivity, without changing it automatically.

## Tasks / Subtasks

- [ ] Extend `notification_preferences` table schema (AC: #1, #3, #5)
  - [ ] Verify existing schema from Story 3.5: user_id, apiary_id (nullable), sensitivity_level, suppression_window_start, suppression_window_end, escalation_enabled
  - [ ] Add `bundling_enabled` boolean column (default: true)
  - [ ] Add `quiet_hours_bypass_critical` boolean column (default: true)
  - [ ] Write sqlc queries: GetGlobalPreferences, GetApiaryPreferences, UpsertPreferences, ListPreferencesByUser
- [ ] Implement preference-checking middleware in notification dispatch (AC: #2, #4, #5, #6)
  - [ ] Create `internal/service/notification_filter.go` with `NotificationFilter` interface
  - [ ] `ShouldDispatch(ctx, userID, apiaryID, priority, notificationType) (bool, reason)`
  - [ ] Sensitivity filtering: map notification type to minimum sensitivity level; compare against effective preference (per-apiary overrides global)
  - [ ] Quiet hours check: compare current time (user's timezone) against suppression window; critical bypasses
  - [ ] Integrate filter into notification dispatch worker (Story 12.1) before FCM send
- [ ] Implement notification bundling service (AC: #7)
  - [ ] Create `internal/service/notification_bundler.go` (extends Story 12.1 bundler)
  - [ ] 30-minute bundling window for non-urgent notifications (vs. 5-minute same-apiary bundling in 12.1)
  - [ ] Bundle digest format: "You have X notifications" with summary of top items
  - [ ] Use Cloud Tasks scheduled delivery for bundle flush
- [ ] Implement quiet hours queue and delayed delivery (AC: #5, #6)
  - [ ] Queue suppressed notifications in `notification_audit` with status `queued_quiet_hours`
  - [ ] Cloud Tasks scheduled job at quiet hours end to flush queued notifications
  - [ ] Critical notifications bypass: check priority before queuing
- [ ] Add GraphQL mutations for preferences (AC: #8)
  - [ ] Define `updateNotificationPreferences` mutation: sensitivity_level, suppression_window_start, suppression_window_end, bundling_enabled
  - [ ] Define `updateApiaryNotificationPreferences` mutation: apiary_id, sensitivity_level
  - [ ] Define `notificationPreferences` query: returns global + per-apiary overrides
  - [ ] Generate resolvers and TypeScript types
- [ ] Build Notification Preferences settings screen (AC: #1, #3, #5, #8)
  - [ ] Create `apps/mobile/src/features/notifications/screens/NotificationPreferencesScreen.tsx`
  - [ ] Global sensitivity slider: three-position slider with labels (High / Medium / Low)
  - [ ] Quiet hours: time picker for start and end times
  - [ ] Bundling toggle: `<Switch>` for enabling/disabling digest bundling
  - [ ] Save button triggers `updateNotificationPreferences` mutation
  - [ ] Add route in Expo Router under settings tab
- [ ] Build per-apiary sensitivity override UI (AC: #3, #4)
  - [ ] Add "Notification Settings" section to apiary detail screen
  - [ ] Per-apiary sensitivity slider matching global slider design
  - [ ] "Use global default" option to clear per-apiary override
  - [ ] Save triggers `updateApiaryNotificationPreferences` mutation
- [ ] Implement seasonal sensitivity suggestion (AC: #9)
  - [ ] Create `internal/service/seasonal_sensitivity_advisor.go`
  - [ ] Evaluate current season + region against risk profile (spring buildup, fall prep, winter dormancy)
  - [ ] When risk increases, generate an `info`-level notification suggesting sensitivity increase
  - [ ] Max one suggestion per seasonal transition (tracked via `notification_audit` type)
  - [ ] Client displays suggestion as an ActionableNotificationCard with "Adjust Settings" action button

## Dev Notes

### Architecture Compliance
- Notification preferences stored in `notification_preferences` table (defined in Story 3.5 schema)
- Preference checking happens in the worker service before dispatch, not in the API service
- Cloud Tasks for delayed delivery (quiet hours flush, bundle flush) per architecture.md
- Seasonal auto-adjust is advisory only -- never changes user preferences without explicit consent (emotional design: calm, supportive, never punitive per CLAUDE.md)

### TDD Requirements (Tests First!)
- Test 1: **Sensitivity filtering** -- Given global sensitivity `Low` and notification type `warning`, assert `ShouldDispatch` returns false. Given `critical`, assert true.
- Test 2: **Per-apiary override** -- Given global sensitivity `Low` and apiary-specific `High`, assert all notification types for that apiary pass the filter.
- Test 3: **Quiet hours suppression** -- Given quiet hours 22:00-07:00 and current time 23:00, assert non-critical notification returns `ShouldDispatch=false` with reason `quiet_hours`. Assert critical notification returns true.
- Test 4: **Quiet hours flush** -- Integration test: queue 3 notifications during quiet hours. Simulate quiet hours end. Assert all 3 are dispatched.
- Test 5: **Bundling** -- Given 4 non-urgent notifications within 30 minutes, assert one bundled digest is produced with count 4.
- Test 6: **Preference mutation** -- GraphQL integration test: call `updateNotificationPreferences` with sensitivity `Medium`. Query preferences. Assert updated.
- Test 7: **Slider component** -- Render sensitivity slider with initial value `High`. Simulate change to `Low`. Assert mutation called with new value.
- Test 8: **Seasonal suggestion** -- Given spring season and user in temperate region with sensitivity `Low`, assert advisory notification generated. Assert it does not auto-change the preference.

### Technical Specifications
- **Sensitivity levels:** `high` (all), `medium` (attention + warning + critical), `low` (critical only)
- **Quiet hours:** stored as time-of-day (HH:MM) in user's local timezone; server converts to UTC for comparison
- **Bundling window:** 30 minutes for general digest (separate from 5-minute same-apiary bundling in Story 12.1)
- **Seasonal transitions:** spring buildup (Feb-Apr), summer flow (May-Jul), fall prep (Aug-Oct), winter dormancy (Nov-Jan) -- region-adjusted
- **Slider component:** Three-position discrete slider using Gluestack `<Slider>` with step marks and labels
- **Time picker:** Platform-native time picker via `@react-native-community/datetimepicker`

### Anti-Patterns to Avoid
- DO NOT auto-change user preferences -- seasonal adjustment is advisory only (suggest, never force)
- DO NOT check preferences in the API service -- preference filtering happens in the worker to keep the API service fast
- DO NOT use a continuous slider for sensitivity -- use a discrete three-position slider for clarity
- DO NOT silently drop notifications -- suppressed notifications must be logged in audit with reason
- DO NOT ignore timezone -- quiet hours must respect the user's local timezone
- DO NOT bundle critical notifications -- critical always delivered immediately and individually

### Project Structure Notes
- `apps/api/internal/service/notification_filter.go` -- Sensitivity and quiet hours filter logic
- `apps/api/internal/service/notification_bundler.go` -- Extended bundling logic (30-minute digest)
- `apps/api/internal/service/seasonal_sensitivity_advisor.go` -- Seasonal suggestion logic
- `apps/api/internal/repository/notification_preferences.go` -- sqlc queries for preferences
- `apps/api/graph/schema/notification_preferences.graphql` -- GraphQL schema for preferences
- `apps/mobile/src/features/notifications/screens/NotificationPreferencesScreen.tsx` -- Settings screen
- `apps/mobile/src/features/notifications/components/SensitivitySlider/index.tsx` -- Reusable slider component

### References
- [Source: epics.md#Story 12.3: Configurable Notification Sensitivity and Suppression]
- [Source: epics.md#Story 3.5 -- notification_preferences table schema]
- [Source: prd.md#FR40 -- Configure notification sensitivity and escalation behavior]
- [Source: prd.md#FR42 -- Suppress or reduce low-value notifications based on user settings]
- [Source: architecture.md#Event Architecture -- Cloud Tasks for notification delivery with suppression windows]
- [Source: CLAUDE.md#Emotional Design -- Calm, supportive, never punitive]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
