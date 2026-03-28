# Story 12.4: Alert Escalation Engine

Status: ready-for-dev

## Story

As a system,
I want to escalate unresolved high-priority alerts after 48 hours using stronger notification channels, with seasonal auto-adjustment of escalation thresholds and telemetry corroboration requirements,
so that critical risks are not silently ignored while avoiding false alarms from uncorroborated sensor data.

## Acceptance Criteria (BDD)

1. GIVEN a high-priority task is created WHEN it remains unresolved for 48 hours THEN an escalation notification is sent with higher FCM priority and a clear "ESCALATION" label in the title.
2. GIVEN an escalation notification is sent WHEN another 48 hours pass without resolution THEN a second escalation is sent. No more than one escalation per task per 48-hour window.
3. GIVEN the user has disabled escalation for an apiary WHEN a high-priority task for that apiary is unresolved THEN no escalation notification is sent.
4. GIVEN a telemetry-triggered alert (e.g., sudden weight drop) WHEN only a single sensor reading triggered it THEN the alert is marked as "unconfirmed" and escalation requires corroboration from at least one additional signal (FR47b).
5. GIVEN a telemetry alert WHEN corroboration exists (sustained trend over 3+ readings, corroborating sensor type, or seasonal plausibility) THEN the alert is confirmed and eligible for normal escalation.
6. GIVEN a seasonal transition to spring buildup WHEN escalation thresholds are evaluated THEN the system auto-adjusts by shortening the escalation window from 48 hours to 24 hours for swarm-risk and queen-related alerts, and generates a log entry documenting the adjustment.
7. GIVEN winter dormancy season WHEN escalation thresholds are evaluated THEN the system lengthens the escalation window to 72 hours for non-emergency alerts, reducing notification pressure during low-activity periods.
8. GIVEN an escalated notification WHEN the user views it THEN the ActionableNotificationCard displays the escalation count, original alert date, and a direct action button to resolve or dismiss the task.

## Tasks / Subtasks

- [ ] Create `alert_escalation` database table and migration (AC: #1, #2)
  - [ ] Schema: id (UUID), task_id (FK), user_id (FK), apiary_id (FK), escalation_count, last_escalated_at, next_escalation_at, status (active/resolved/dismissed), corroboration_status (confirmed/unconfirmed/corroborated), created_at, updated_at
  - [ ] Index on (status, next_escalation_at) for scheduled escalation queries
  - [ ] Index on (task_id) for task resolution lookups
  - [ ] Write sqlc queries: InsertEscalation, GetPendingEscalations, UpdateEscalationStatus, IncrementEscalationCount
- [ ] Implement escalation scheduler (AC: #1, #2)
  - [ ] Create `internal/service/escalation_engine.go` with `EscalationEngine` interface
  - [ ] Cloud Tasks scheduled job: runs every 15 minutes, queries `alert_escalation` where `next_escalation_at <= now() AND status = 'active'`
  - [ ] For each pending escalation: publish to `notification-dispatch` topic with escalation metadata
  - [ ] Update `escalation_count`, `last_escalated_at`, compute `next_escalation_at` based on seasonal window
  - [ ] Cap: max 1 escalation per task per window (48h default)
- [ ] Implement escalation preference check (AC: #3)
  - [ ] Query `notification_preferences` for `escalation_enabled` per apiary
  - [ ] Skip escalation if disabled; log skip reason in audit
  - [ ] Global escalation toggle in user preferences
- [ ] Implement telemetry corroboration logic (AC: #4, #5)
  - [ ] Create `internal/service/telemetry_corroborator.go` with `CorroborationResult` type
  - [ ] Corroboration rules:
    - Sustained trend: 3+ readings in same direction within 24 hours
    - Cross-sensor: corroborating signal from different sensor type (e.g., weight + temperature)
    - Seasonal plausibility: alert type matches expected seasonal risk pattern
  - [ ] Single-reading anomalies: mark as `unconfirmed`, do not escalate until corroborated
  - [ ] Corroborated alerts: update `corroboration_status` to `corroborated`, eligible for escalation
  - [ ] Log corroboration evaluation details in structured audit event
- [ ] Implement seasonal escalation auto-adjustment (AC: #6, #7)
  - [ ] Create `internal/service/seasonal_escalation_config.go`
  - [ ] Season-to-window mapping (region-adjusted):
    - Spring buildup: 24h for swarm-risk, queen-related; 48h for others
    - Summer flow: 48h standard
    - Fall prep: 48h standard
    - Winter dormancy: 72h for non-emergency; 48h for emergency (starvation, moisture)
  - [ ] Compute `next_escalation_at` using seasonal window at escalation creation and on each escalation tick
  - [ ] Log seasonal adjustment decisions with season, region, alert type, and applied window
- [ ] Implement escalation notification payload (AC: #8)
  - [ ] Escalation notification includes: "ESCALATION: [Original Title]" format
  - [ ] Body includes: escalation count, original alert date, urgency reason
  - [ ] Deep link to task detail screen
  - [ ] ActionableNotificationCard rendered with `action="error"` variant for escalations
  - [ ] Include "Resolve" and "Dismiss" action buttons in notification data
- [ ] Create escalation trigger on task creation (AC: #1)
  - [ ] Subscribe to `inspection-events` Pub/Sub topic for new high-priority task events
  - [ ] When high-priority task created: insert `alert_escalation` record with computed `next_escalation_at`
  - [ ] Telemetry-triggered tasks: set initial `corroboration_status` to `unconfirmed`
- [ ] Implement task resolution listener (AC: #1, #2)
  - [ ] When a task is marked as done/dismissed: update corresponding `alert_escalation` status to `resolved`/`dismissed`
  - [ ] Cancel pending Cloud Tasks for that escalation

## Dev Notes

### Architecture Compliance
- Escalation checks run as Cloud Tasks scheduled jobs per architecture.md (Cloud Tasks for scheduled/delayed work)
- Telemetry corroboration implements FR47b requirement from the PRD
- Escalation notifications dispatched through the same `notification-dispatch` Pub/Sub topic as regular notifications (Story 12.1)
- Preference checking uses `notification_preferences.escalation_enabled` from Story 3.5 schema
- Seasonal configuration is region-aware, using the user's region from onboarding (Epic 6)

### TDD Requirements (Tests First!)
- Test 1: **Escalation trigger** -- Given a high-priority task created 49 hours ago, assert escalation engine produces an escalation notification with `ESCALATION:` prefix.
- Test 2: **Escalation cap** -- Given a task that was escalated 20 hours ago (within 48h window), assert no additional escalation is generated.
- Test 3: **Escalation disabled** -- Given escalation_enabled=false for apiary, assert escalation is skipped and reason logged.
- Test 4: **Telemetry corroboration required** -- Given a single weight-drop reading triggers an alert, assert corroboration_status is `unconfirmed` and escalation does not fire until corroborated.
- Test 5: **Corroboration via sustained trend** -- Given 3 weight-drop readings over 12 hours, assert corroboration_status updates to `corroborated` and escalation is eligible.
- Test 6: **Seasonal window spring** -- Given spring season and swarm-risk alert type, assert escalation window is 24 hours (not 48).
- Test 7: **Seasonal window winter** -- Given winter dormancy and non-emergency alert, assert escalation window is 72 hours.
- Test 8: **Task resolution cancels escalation** -- Given an active escalation, when the task is resolved, assert escalation status is `resolved` and no further escalation fires.
- Test 9: **Escalation notification payload** -- Assert escalation notification includes escalation_count, original_alert_date, and `action="error"` variant.

### Technical Specifications
- **Escalation windows:** 24h (spring high-risk), 48h (default), 72h (winter non-emergency)
- **Scheduler frequency:** Cloud Tasks job every 15 minutes querying pending escalations
- **Corroboration thresholds:** 3+ readings for sustained trend, 24-hour evaluation window
- **Max escalation cap:** 1 per task per escalation window; no upper limit on total escalations (continues until resolved/dismissed)
- **Seasonal regions:** Derived from user's latitude + hemisphere (set during onboarding)
- **Pub/Sub topic:** Reuses `notification-dispatch` with `is_escalation: true` flag
- **Cloud Tasks queue:** `escalation-check` for scheduled evaluation runs

### Anti-Patterns to Avoid
- DO NOT escalate unconfirmed telemetry alerts -- always require corroboration (FR47b)
- DO NOT auto-resolve escalations -- only user action (resolve/dismiss) stops escalation
- DO NOT change seasonal windows without logging the decision -- all adjustments must be auditable
- DO NOT send escalations during quiet hours for non-critical alerts -- respect quiet hours from Story 12.3 (critical escalations still bypass)
- DO NOT escalate in a tight loop -- minimum 15-minute scheduler granularity prevents runaway notifications
- DO NOT hardcode seasonal boundaries -- use configurable region-adjusted date ranges

### Project Structure Notes
- `apps/api/internal/service/escalation_engine.go` -- Core escalation scheduling and dispatch logic
- `apps/api/internal/service/telemetry_corroborator.go` -- Corroboration evaluation logic
- `apps/api/internal/service/seasonal_escalation_config.go` -- Season-to-window mapping
- `apps/api/internal/repository/alert_escalation.go` -- sqlc queries for escalation table
- `apps/api/internal/event/escalation_trigger.go` -- Pub/Sub listener for high-priority task events
- `apps/api/migrations/XXXXXX_create_alert_escalation.sql` -- Migration

### References
- [Source: epics.md#Story 12.4: Escalation for Unresolved High-Priority Alerts]
- [Source: prd.md#FR41 -- System can escalate unresolved high-priority alerts]
- [Source: prd.md#FR47b -- Telemetry-triggered alerts require corroboration]
- [Source: architecture.md#Event Architecture -- Cloud Tasks for scheduled work]
- [Source: architecture.md#Pub/Sub Topics -- notification-dispatch topic]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
