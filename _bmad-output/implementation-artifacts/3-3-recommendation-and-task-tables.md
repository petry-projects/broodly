# Story 3.3: Recommendation, Task, and Audit Tables

Status: ready-for-dev

## Story

As a developer,
I want tables for recommendations, tasks, user feedback, and an immutable append-only audit event log,
so that the recommendation engine can persist scored actions with evidence, the planning queue tracks task lifecycle, and all system actions are auditable for trust and support workflows.

## Acceptance Criteria (BDD)

1. GIVEN the migrations from Stories 3.1 and 3.2 have been applied WHEN I run the Story 3.3 migrations THEN they apply cleanly without errors.
2. GIVEN a `recommendations` table WHEN I attempt to insert a record with a NULL `action`, `rationale`, `confidence_level`, or `fallback_action` THEN a NOT NULL constraint violation is raised.
3. GIVEN a `recommendations` table WHEN I insert a record with `confidence_level` outside the range `0.0` to `1.0` THEN a CHECK constraint violation is raised.
4. GIVEN a `recommendations` table WHEN I insert a valid record THEN `evidence_context` and `source_versions` accept JSONB payloads and the row is retrievable.
5. GIVEN a `tasks` table WHEN I insert a record THEN `status` defaults to `pending` and links to `recommendation_id` and `hive_id`.
6. GIVEN a `tasks` table WHEN I update a task's `status` through the lifecycle `pending` -> `completed` THEN `completed_at` is set and the transition succeeds.
7. GIVEN an `audit_events` table WHEN I insert a record THEN the row is persisted with `event_type`, `actor_id`, `tenant_id`, `occurred_at`, `payload_version`, and `payload` JSONB.
8. GIVEN an `audit_events` table WHEN the sqlc-generated code is inspected THEN there are NO `UPDATE` or `DELETE` query functions — the table is append-only.
9. GIVEN a `user_feedback` table WHEN I insert a record referencing a `recommendation_id` THEN the feedback links to the correct recommendation and user.
10. GIVEN any generated recommendation/task query WHEN I inspect its SQL THEN it includes `WHERE user_id = $1` or `WHERE tenant_id = $1` tenant scoping.
11. GIVEN the `audit_events` table WHEN I query by `tenant_id` and `event_type` THEN an appropriate composite index is used.

## Tasks / Subtasks

- [ ] Create migration `000009_create_recommendations_table.up.sql` (AC: #1, #2, #3, #4)
  - [ ] Define `recommendations` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `hive_id UUID NOT NULL REFERENCES hives(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `inspection_id UUID REFERENCES inspections(id)`, `action TEXT NOT NULL`, `rationale TEXT NOT NULL`, `confidence_level DOUBLE PRECISION NOT NULL`, `confidence_type VARCHAR(30) NOT NULL`, `fallback_action TEXT NOT NULL`, `evidence_context JSONB NOT NULL DEFAULT '{}'::jsonb`, `source_versions JSONB NOT NULL DEFAULT '{}'::jsonb`, `skill_adapted_explanation TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `expires_at TIMESTAMPTZ`
  - [ ] Add CHECK constraint on `confidence_level`: `0.0 <= value <= 1.0`
  - [ ] Add CHECK constraint on `confidence_type`: `high`, `moderate`, `low`, `insufficient_data`, `conflicting_evidence`, `limited_experience`
  - [ ] Add index `idx_recommendations_hive_id` on `hive_id`
  - [ ] Add index `idx_recommendations_user_id` on `user_id`
  - [ ] Add index `idx_recommendations_user_id_created_at` on `(user_id, created_at DESC)` for recent recommendations
  - [ ] Add index `idx_recommendations_inspection_id` on `inspection_id`
- [ ] Create migration `000010_create_tasks_table.up.sql` (AC: #1, #5, #6)
  - [ ] Define `tasks` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `recommendation_id UUID REFERENCES recommendations(id)`, `hive_id UUID NOT NULL REFERENCES hives(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `title TEXT NOT NULL`, `description TEXT`, `priority VARCHAR(20) NOT NULL DEFAULT 'medium'`, `status VARCHAR(20) NOT NULL DEFAULT 'pending'`, `due_date DATE`, `deferred_reason TEXT`, `deferred_until DATE`, `completed_at TIMESTAMPTZ`, `dismissed_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `priority`: `urgent`, `high`, `medium`, `low`
  - [ ] Add CHECK constraint on `status`: `pending`, `in_progress`, `completed`, `deferred`, `dismissed`
  - [ ] Add index `idx_tasks_user_id` on `user_id`
  - [ ] Add index `idx_tasks_hive_id` on `hive_id`
  - [ ] Add index `idx_tasks_user_id_status` on `(user_id, status)` for active task queries
  - [ ] Add index `idx_tasks_user_id_due_date` on `(user_id, due_date)` for planning queries
  - [ ] Attach `set_updated_at` trigger
- [ ] Create migration `000011_create_audit_events_table.up.sql` (AC: #1, #7, #8, #11)
  - [ ] Define `audit_events` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `event_type VARCHAR(100) NOT NULL`, `actor_id UUID NOT NULL`, `tenant_id UUID NOT NULL`, `occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `payload_version INTEGER NOT NULL DEFAULT 1`, `payload JSONB NOT NULL DEFAULT '{}'::jsonb`
  - [ ] Add index `idx_audit_events_tenant_id_occurred_at` on `(tenant_id, occurred_at DESC)`
  - [ ] Add index `idx_audit_events_tenant_id_event_type` on `(tenant_id, event_type)`
  - [ ] Add index `idx_audit_events_actor_id` on `actor_id`
  - [ ] **NO** `updated_at` column — append-only, rows are never modified
  - [ ] **NO** `deleted_at` column — audit events are permanent
  - [ ] Consider partitioning by month on `occurred_at` (add PARTITION BY RANGE comment for future implementation)
- [ ] Create migration `000012_create_user_feedback_table.up.sql` (AC: #1, #9)
  - [ ] Define `user_feedback` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `recommendation_id UUID NOT NULL REFERENCES recommendations(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `outcome_report VARCHAR(50) NOT NULL`, `outcome_notes TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `outcome_report`: `helpful`, `not_helpful`, `followed_alternative`, `not_applicable`, `too_advanced`, `too_basic`
  - [ ] Add index `idx_user_feedback_recommendation_id` on `recommendation_id`
  - [ ] Add index `idx_user_feedback_user_id` on `user_id`
  - [ ] Add UNIQUE constraint on `(recommendation_id, user_id)` — one feedback per recommendation per user
- [ ] Write sqlc query file `apps/api/internal/repository/queries/recommendations.sql` (AC: #10)
  - [ ] `CreateRecommendation` — INSERT RETURNING full row
  - [ ] `GetRecommendationByID` — SELECT WHERE `id = $1 AND user_id = $2`
  - [ ] `ListRecommendationsByHive` — SELECT WHERE `hive_id = $1 AND user_id = $2` ORDER BY `created_at DESC`
  - [ ] `ListRecentRecommendationsByUser` — SELECT WHERE `user_id = $1` ORDER BY `created_at DESC` LIMIT $2
  - [ ] `ListActiveRecommendations` — SELECT WHERE `user_id = $1 AND (expires_at IS NULL OR expires_at > now())` ORDER BY `confidence_level DESC`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/tasks.sql` (AC: #10)
  - [ ] `CreateTask` — INSERT RETURNING full row
  - [ ] `GetTaskByID` — SELECT WHERE `id = $1 AND user_id = $2`
  - [ ] `ListTasksByUser` — SELECT WHERE `user_id = $1 AND status IN ('pending', 'in_progress')` ORDER BY `priority, due_date`
  - [ ] `ListTasksByHive` — SELECT WHERE `hive_id = $1 AND user_id = $2` ORDER BY `priority, due_date`
  - [ ] `CompleteTask` — UPDATE SET `status = 'completed'`, `completed_at = now()` WHERE `id = $1 AND user_id = $2`
  - [ ] `DeferTask` — UPDATE SET `status = 'deferred'`, `deferred_reason = $3`, `deferred_until = $4` WHERE `id = $1 AND user_id = $2`
  - [ ] `DismissTask` — UPDATE SET `status = 'dismissed'`, `dismissed_at = now()` WHERE `id = $1 AND user_id = $2`
  - [ ] `CountActiveTasksByUser` — SELECT COUNT WHERE `user_id = $1 AND status IN ('pending', 'in_progress')`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/audit_events.sql` (AC: #8, #10)
  - [ ] `InsertAuditEvent` — INSERT RETURNING full row (**only INSERT, no UPDATE/DELETE**)
  - [ ] `ListAuditEventsByTenant` — SELECT WHERE `tenant_id = $1` ORDER BY `occurred_at DESC` LIMIT $2 OFFSET $3
  - [ ] `ListAuditEventsByTenantAndType` — SELECT WHERE `tenant_id = $1 AND event_type = $2` ORDER BY `occurred_at DESC` LIMIT $3
  - [ ] `GetAuditEventByID` — SELECT WHERE `id = $1 AND tenant_id = $2`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/user_feedback.sql` (AC: #10)
  - [ ] `CreateUserFeedback` — INSERT RETURNING full row
  - [ ] `GetFeedbackByRecommendation` — SELECT WHERE `recommendation_id = $1 AND user_id = $2`
  - [ ] `ListFeedbackByUser` — SELECT WHERE `user_id = $1` ORDER BY `created_at DESC` LIMIT $2
- [ ] Run `sqlc generate` and verify compilation (AC: #8)
  - [ ] Confirm audit_events has **no** Update or Delete functions generated
- [ ] Write migration integration tests using testcontainers-go (AC: #1, #2, #3, #5, #6, #7, #8, #9, #11)
  - [ ] Test: Story 3.3 migrations apply after Stories 3.1 + 3.2 migrations
  - [ ] Test: `recommendations` NOT NULL constraints on `action`, `rationale`, `confidence_level`, `fallback_action`
  - [ ] Test: `recommendations` CHECK constraint on `confidence_level` range
  - [ ] Test: `recommendations` CHECK constraint on `confidence_type` values
  - [ ] Test: `tasks` default status is `pending`
  - [ ] Test: `tasks` status lifecycle transition
  - [ ] Test: `audit_events` insert succeeds with valid data
  - [ ] Test: `audit_events` — verify no sqlc-generated UPDATE/DELETE functions exist (compile-time check)
  - [ ] Test: `user_feedback` unique constraint on `(recommendation_id, user_id)`
  - [ ] Test: `user_feedback` FK constraint on `recommendation_id`
- [ ] Write sqlc-generated repository integration tests (AC: #4, #5, #6, #9, #10)
  - [ ] Test: full recommendation lifecycle — create recommendation, create linked task, complete task, add feedback
  - [ ] Test: tenant isolation on all queries
  - [ ] Test: `ListActiveRecommendations` excludes expired recommendations
  - [ ] Test: `ListTasksByUser` returns only pending/in_progress tasks sorted by priority
  - [ ] Test: audit event pagination with LIMIT/OFFSET
  - [ ] Test: JSONB `evidence_context` stores and retrieves complex evidence structures

## Dev Notes

### Architecture Compliance

- Recommendation contract fields are all NOT NULL, matching the mandatory GraphQL contract: `action + rationale + confidence + fallback` (architecture.md: "Recommendation contract is mandatory").
- Audit event table is append-only with no UPDATE/DELETE — enforced at sqlc query level and verified by test (architecture.md: "immutable audit event log in PostgreSQL with append-only table").
- Audit event envelope matches architecture spec: `event_id`, `event_type`, `actor_id`, `tenant_id`, `occurred_at`, `payload_version`, `payload` (JSONB).
- Event naming convention for `event_type`: `domain.entity.action.v1` (e.g., `recommendation.generated.v1`, `task.completed.v1`).

### TDD Requirements (Tests First!)

Write ALL tests before implementing migrations and queries:

1. **Append-only enforcement tests** (critical):
   - Verify at compile-time that sqlc generates NO `Update` or `Delete` functions for `audit_events`.
   - Write a test that inspects the generated Go source for audit_events and asserts absence of update/delete methods.
   - Consider adding a database trigger `BEFORE UPDATE OR DELETE ON audit_events` that raises an exception as defense-in-depth.

2. **Recommendation contract tests**:
   - Attempt INSERT with each NOT NULL field set to NULL individually — all must fail.
   - Test confidence_level boundary values: 0.0 (valid), 1.0 (valid), -0.01 (invalid), 1.01 (invalid).

3. **Task lifecycle tests**:
   - Test each status transition via the sqlc query functions.
   - Verify `completed_at` is set only when status becomes `completed`.
   - Verify `deferred_reason` is stored when deferring.

4. **Audit event tests**:
   - Insert multiple events, verify ordering by `occurred_at DESC`.
   - Test pagination with LIMIT/OFFSET.
   - Test filtering by `event_type`.

### Technical Specifications

- **Audit table partitioning**: the migration includes a comment noting future `PARTITION BY RANGE (occurred_at)` by month. Not implemented in MVP but schema is designed for it.
- **Confidence types**: map to the GraphQL `ConfidenceType` enum. The database uses lowercase snake_case; the GraphQL layer maps to SCREAMING_SNAKE_CASE.
- **Evidence context JSONB schema** (application-level, not enforced in DB):
  ```json
  {
    "sources": [
      {"type": "inspection", "id": "uuid", "weight": 0.8},
      {"type": "weather", "provider": "openweather", "fetched_at": "iso8601"},
      {"type": "knowledge_base", "chunk_id": "uuid", "similarity": 0.92}
    ]
  }
  ```
- **Task priority ordering**: `urgent` > `high` > `medium` > `low`. Enforced in ORDER BY via CASE expression or enum ordering in sqlc query.

### Anti-Patterns to Avoid

- **NO** UPDATE or DELETE queries on `audit_events` — append-only is a hard architectural constraint.
- **NO** mutable `confidence_level` after recommendation creation — recommendations are immutable records; new recommendations supersede old ones.
- **NO** storing recommendation text in tasks — tasks reference `recommendation_id`; title is a denormalized summary for display.
- **NO** cascade delete of tasks when recommendation is deleted — tasks have independent lifecycle.
- **NO** skipping the `payload_version` field on audit events — this enables backward-compatible payload evolution.

### Project Structure Notes

```
apps/api/
├── migrations/
│   ├── 000009_create_recommendations_table.up.sql
│   ├── 000010_create_tasks_table.up.sql
│   ├── 000011_create_audit_events_table.up.sql
│   └── 000012_create_user_feedback_table.up.sql
├── internal/
│   └── repository/
│       ├── queries/
│       │   ├── recommendations.sql
│       │   ├── tasks.sql
│       │   ├── audit_events.sql
│       │   └── user_feedback.sql
│       └── db/
│           ├── recommendations.sql.go
│           ├── tasks.sql.go
│           ├── audit_events.sql.go
│           └── user_feedback.sql.go
```

### References

- Architecture: `/home/donpetry/broodly/_bmad-output/planning-artifacts/architecture.md` — Authentication & Security (Auditability), Recommendation Engine Architecture, Communication Patterns (event envelope)
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` — Story 3.3
- FRs: FR13 (recommendation display), FR14 (confidence signaling), FR50 (audit trail), FR51 (support case replay), FR53 (data export)
- Depends on: Story 3.1 (users, hives), Story 3.2 (inspections)

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
