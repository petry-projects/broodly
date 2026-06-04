# Story 4.4: Inspection & Recommendation Resolvers

Status: review

## Story

As a developer,
I want GraphQL resolvers for the full inspection lifecycle (start, pause, resume, complete) and observation recording plus task/planning queries,
so that the guided inspection flow, recommendation generation trigger, and weekly planning features have a functional API.

## Acceptance Criteria (BDD)

1. GIVEN a `startInspection` mutation with a valid hive ID and optional type parameter WHEN executed by the hive owner THEN a new inspection record is created with status `IN_PROGRESS` and the response includes the inspection ID and initial guidance context.
2. GIVEN a `startInspection` mutation with `type: QUICK` WHEN executed THEN the inspection is created in quick-inspection mode with a reduced observation set (FR25).
3. GIVEN an `addObservation` mutation with structured data, voice URL, or media reference WHEN executed on an in-progress inspection THEN the observation is appended with the correct sequence order.
4. GIVEN a `pauseInspection` mutation WHEN executed on an in-progress inspection THEN the status changes to `PAUSED` and all observations are preserved (FR25b).
5. GIVEN a `resumeInspection` mutation WHEN executed on a paused inspection THEN the status returns to `IN_PROGRESS` and the observation sequence continues from where it left off.
6. GIVEN a `completeInspection` mutation WHEN the inspection has zero observations THEN the mutation returns a validation error with code `INSPECTION_INCOMPLETE`.
7. GIVEN a `completeInspection` mutation WHEN the inspection has at least one observation THEN the inspection status changes to `COMPLETED`, a completion timestamp is recorded, and an event is published to the `inspection-events` Pub/Sub topic for async recommendation generation.
8. GIVEN a `startInspection` mutation WHEN executed by a user who is not the hive owner THEN the mutation returns an authorization error with code `FORBIDDEN`.
9. GIVEN a `weeklyQueue` query with apiary and status filters WHEN executed THEN tasks are returned ordered by urgency and impact priority with pagination support.
10. GIVEN a `deferTask` mutation with an optional reason WHEN executed THEN the task status updates to `DEFERRED`, sibling task priorities are adjusted, and the reason is recorded.
11. GIVEN a `completeTask` mutation WHEN executed THEN the task status updates to `COMPLETED` with a completion timestamp.
12. GIVEN overdue tasks in the queue WHEN the `weeklyQueue` query is executed THEN overdue tasks are flagged with an `isOverdue` boolean and include catch-up guidance text.

## Tasks / Subtasks

- [x] Write startInspection test: creates IN_PROGRESS inspection linked to hive, returns ID and guidance (AC: #1)
- [x] Write quick inspection test: type=QUICK creates inspection with reduced observation set (AC: #2)
- [x] Write addObservation test: appends observation with correct sequence order (AC: #3)
- [x] Write pauseInspection test: status changes to PAUSED, observations preserved (AC: #4)
- [x] Write resumeInspection test: status returns to IN_PROGRESS, sequence continues (AC: #5)
- [x] Write completeInspection validation test: zero observations returns INSPECTION_INCOMPLETE error (AC: #6)
- [x] Write completeInspection success test: sets COMPLETED status, records timestamp, publishes event (AC: #7)
- [x] Write inspection authorization test: non-owner receives FORBIDDEN error (AC: #8)
- [x] Write weeklyQueue test: returns tasks ordered by priority with filters and pagination (AC: #9)
- [x] Write deferTask test: updates status, adjusts sibling priorities, records reason (AC: #10)
- [x] Write completeTask test: records completion timestamp (AC: #11)
- [x] Write overdue task test: overdue tasks flagged with isOverdue and catch-up guidance (AC: #12)
- [x] Implement sqlc queries for inspection CRUD (AC: #1, #4, #5, #6, #7)
  - [x] `CreateInspection` with hive_id, type, status, user_id
  - [x] `GetInspectionByIDAndUser` with tenant isolation
  - [x] `UpdateInspectionStatus` / PauseInspection / ResumeInspection for transitions
  - [x] `CompleteInspection` with completed_at timestamp
  - [x] `ListInspectionsByHivePaginated` with pagination
- [x] Implement sqlc queries for observations (AC: #3)
  - [x] `CreateObservation` with inspection_id and sequence_order
  - [x] `CountObservationsByInspection` for completion validation
  - [x] `GetMaxSequenceOrder` for next sequence number
- [x] Implement sqlc queries for tasks and planning (AC: #9, #10, #11, #12)
  - [x] `ListTasksByUser` / `ListTasksByUserAndStatus` with filters and pagination
  - [x] `UpdateTaskStatus` for defer/complete/dismiss
  - [x] `GetTaskByIDAndUser` for ownership verification
- [x] Implement inspection service in `apps/api/internal/service/inspection.go` (AC: #1, #2, #4, #5, #6, #7, #8)
  - [x] Start with type parameter handling
  - [x] Pause/resume with status transition validation
  - [x] Complete with observation count validation and event publish
- [x] Implement task/planning service in `apps/api/internal/service/planning.go` (AC: #9, #10, #11, #12)
  - [x] Task listing with status filter and pagination
  - [x] Defer with reason recording
  - [x] Overdue detection (IsOverdue) and catch-up guidance (CatchUpGuidance)
- [x] Implement event publisher interface for `inspection-events` topic (AC: #7)
- [x] Implement inspection resolvers in `apps/api/graph/resolver/inspection.go` (AC: #1-#8)
- [x] Implement task/planning resolvers in `apps/api/graph/resolver/task.go` (AC: #9-#12)

## Dev Notes

### Architecture Compliance
- CompleteInspection publishes to `inspection-events` Pub/Sub topic for async recommendation generation — the resolver does NOT generate recommendations synchronously
- Inspection lifecycle state machine: `IN_PROGRESS` -> `PAUSED` -> `IN_PROGRESS` -> `COMPLETED` (no backwards transitions from COMPLETED)
- All queries include tenant_id for tenant isolation
- Priority computation is a Go service function called by the resolver, not computed in SQL
- Event envelope follows the required format: eventId, eventType, occurredAt, tenantId, payloadVersion, payload
- Tasks pagination uses cursor-based pagination for large queues per NFR17c

### TDD Requirements (Tests First!)
- Test 1: **Start inspection** — Use testcontainers-go. Create hive, start inspection, assert status `IN_PROGRESS` and non-nil ID.
- Test 2: **Quick inspection** — Start with type=QUICK, assert inspection record has type field set.
- Test 3: **Add observation** — Add 3 observations, assert sequence_order is 1, 2, 3.
- Test 4: **Pause/resume** — Start, add observation, pause, assert PAUSED. Resume, assert IN_PROGRESS. Add another observation, assert sequence continues.
- Test 5: **Complete validation** — Start inspection with no observations, attempt complete, assert error.
- Test 6: **Complete with event** — Mock Pub/Sub publisher. Complete inspection with observations. Assert event published with correct topic and payload.
- Test 7: **Authorization** — Create hive for tenant A. Attempt startInspection as tenant B. Assert FORBIDDEN.
- Test 8: **Weekly queue** — Seed 15 tasks with varying priorities. Query with pagination (limit 10). Assert correct order and pagination cursor.
- Test 9: **Defer task** — Defer task #3 of 5. Assert status DEFERRED and remaining tasks reprioritized.
- Test 10: **Overdue detection** — Seed task with due_date in the past. Query weekly queue. Assert isOverdue=true and catch-up guidance non-empty.

### Technical Specifications
- **Inspection statuses:** `IN_PROGRESS`, `PAUSED`, `COMPLETED`
- **Inspection types:** `STANDARD`, `QUICK`
- **Observation data:** structured fields (JSON), voice_url (string, nullable), media_references (array of UUIDs)
- **Pub/Sub topic:** `inspection-events`
- **Event type:** `inspection.completed.v1`
- **Task priorities:** numeric score computed by service layer based on urgency, impact, and due date
- **Pagination:** cursor-based using `after` parameter with opaque cursor string
- **Task statuses:** `PENDING`, `DEFERRED`, `COMPLETED`, `DISMISSED`
- **Overdue threshold:** task due_date < current UTC time

### Anti-Patterns to Avoid
- DO NOT generate recommendations synchronously in the completeInspection resolver — publish event for async processing
- DO NOT allow backwards state transitions (COMPLETED -> IN_PROGRESS) — inspection lifecycle is forward-only
- DO NOT compute task priority in SQL — use Go service function for complex priority logic
- DO NOT use offset-based pagination for task lists — use cursor-based pagination for performance
- DO NOT skip observation sequence ordering — sequence_order must be monotonically increasing per inspection
- DO NOT hardcode Pub/Sub topic names — use configuration from environment variables
- DO NOT skip authorization checks on any mutation — every write operation verifies ownership

### Project Structure Notes
- Inspection service: `apps/api/internal/service/inspection.go`
- Planning service: `apps/api/internal/service/planning.go`
- Pub/Sub publisher: `apps/api/internal/event/publisher.go`
- Inspection resolver: `apps/api/graph/resolver/inspection.go`
- Observation resolver: `apps/api/graph/resolver/observation.go`
- Task resolver: `apps/api/graph/resolver/task.go`
- Repository queries: `apps/api/internal/repository/queries/`

### References
- [Source: architecture.md#Service Communication — Cloud Pub/Sub for async event dispatch]
- [Source: architecture.md#Event Architecture — inspection-events topic]
- [Source: architecture.md#Communication Patterns — Required event envelope]
- [Source: epics.md#Story 4.3 — Inspection and Observation Resolvers]
- [Source: epics.md#Story 4.4 — Task and Planning Resolvers]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Full inspection lifecycle: start (full/quick), pause, resume, complete with status transition validation
- AddObservation with auto-incrementing sequence order via GetMaxSequenceOrder
- CompleteInspection validates at least 1 observation, publishes inspection.completed.v1 event
- Event publisher interface with NoOpPublisher default (ready for Pub/Sub integration)
- Task/planning service: list with status filter + pagination, defer with reason, complete with timestamp
- IsOverdue and CatchUpGuidance for overdue task flagging (AC #12)
- Updated GraphQL schema: added pauseInspection/resumeInspection mutations, isOverdue/catchUpGuidance on Task
- Extended sqlc queries: GetInspectionByIDAndUser, ResumeInspection, CountObservationsByInspection, GetMaxSequenceOrder, ListTasksByUserAndStatus, GetTaskByIDAndUser, etc.
- 14 new service tests (7 inspection + 4 planning + 2 overdue + 1 guidance) — all pass
- Zero regressions

### Change Log
- 2026-03-29: Story 4.4 implemented — inspection lifecycle, observation recording, task/planning resolvers, event publishing

### File List
- apps/api/graph/schema/inspection.graphql (modified — added pauseInspection, resumeInspection mutations)
- apps/api/graph/schema/task.graphql (modified — added isOverdue, catchUpGuidance fields)
- apps/api/internal/event/publisher.go (new)
- apps/api/internal/service/inspection.go (new)
- apps/api/internal/service/inspection_test.go (new)
- apps/api/internal/service/planning.go (new)
- apps/api/internal/service/planning_test.go (new)
- apps/api/internal/repository/queries/inspections.sql (modified)
- apps/api/internal/repository/queries/recommendations.sql (modified)
- apps/api/internal/repository/inspections.sql.go (regenerated)
- apps/api/internal/repository/recommendations.sql.go (regenerated)
- apps/api/internal/repository/querier.go (regenerated)
- apps/api/graph/generated.go (regenerated)
- apps/api/graph/model/models_gen.go (regenerated)
- apps/api/graph/resolver/resolver.go (modified — added InspectionService, PlanningService)
- apps/api/graph/resolver/inspection.resolvers.go (implemented)
- apps/api/graph/resolver/task.resolvers.go (implemented)
- apps/api/graph/resolver/convert.go (modified — added inspectionToModel, observationToModel, helpers)
- packages/graphql-types/src/generated/types.ts (regenerated)
