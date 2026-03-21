# Story 9.3: Confidence Calibration and Evidence Tracing

Status: ready-for-dev

## Story

As a system,
I want every recommendation to include traceable evidence context and calibrated confidence that distinguishes between insufficient data and conflicting evidence,
so that support can replay decisions, users understand the basis for guidance, and negative-outcome feedback feeds back into calibration review.

**FRs:** FR50, FR51, FR53, FR54, FR54a, FR54b

## Acceptance Criteria (BDD)

1. GIVEN a recommendation is generated WHEN it is persisted THEN the recommendation record includes an `evidence_context` JSONB column containing all source references (source IDs, source types, freshness timestamps, and contribution weights).
2. GIVEN a recommendation has low confidence due to insufficient data WHEN the confidence type is set THEN it is `INSUFFICIENT_DATA` and the user-facing message communicates "Not enough information to be sure" (FR54a).
3. GIVEN a recommendation has low confidence due to conflicting evidence WHEN the confidence type is set THEN it is `CONFLICTING_EVIDENCE` and the user-facing message communicates "Mixed signals from your data" (FR54a).
4. GIVEN a user reports a negative outcome WHEN the feedback mutation is submitted THEN the feedback record is linked to the original recommendation ID and its evidence context, and stored for calibration review (FR54b).
5. GIVEN any recommendation is generated WHEN it is persisted THEN an immutable audit event of type `recommendation_generated` is appended to the audit log with the full payload (event_id, event_type, actor_id, tenant_id, occurred_at, payload_version, payload JSONB).
6. GIVEN a support role queries a user's recommendation history WHEN the query is executed THEN it returns the full chain: recommendation record + evidence context + user actions (accepted/dismissed/feedback) for the specified time range (FR50).
7. GIVEN multiple evidence sources with varying freshness WHEN the evidence context is stored THEN each source entry includes its `freshness_at` timestamp and its `contribution_weight` relative to the final confidence score.

## Tasks / Subtasks

- [ ] Extend recommendation DB schema with evidence tracing columns (AC: #1, #7)
  - [ ] Migration: add `evidence_context JSONB NOT NULL DEFAULT '{}'` to `recommendations` table
  - [ ] JSONB structure: `{ "sources": [{ "source_id": "...", "source_type": "inspection|weather|flora|telemetry|knowledge_base", "freshness_at": "ISO-8601", "contribution_weight": 0.0-1.0 }] }`
  - [ ] Add index on `recommendations.user_id` and `recommendations.hive_id` for support queries
- [ ] Implement confidence type classification logic (AC: #2, #3)
  - [ ] In `apps/api/internal/service/recommendation/confidence.go`
  - [ ] `ClassifyConfidence(recCtx *RecommendationContext, rawConfidence float64) (float64, ConfidenceType)`
  - [ ] Rules: if sources with data < minimum threshold -> `INSUFFICIENT_DATA`; if sources present conflicting signals -> `CONFLICTING_EVIDENCE`; if regional coverage low -> `LIMITED_EXPERIENCE` (from Story 9.2); else -> `STANDARD`
  - [ ] User-facing message templates per confidence type
- [ ] Implement evidence context serialization (AC: #1, #7)
  - [ ] Build `EvidenceContext` from `RecommendationContext` after scoring
  - [ ] Serialize to JSONB for storage alongside recommendation record
  - [ ] Contribution weights derived from scoring model or heuristic (configurable)
- [ ] Implement negative outcome feedback mutation (AC: #4)
  - [ ] GraphQL mutation: `reportNegativeOutcome(recommendationId: ID!, description: String!): ReportOutcomePayload`
  - [ ] Go resolver writes `recommendation_feedback` record linked to recommendation ID
  - [ ] Feedback record includes: `feedback_id`, `recommendation_id`, `user_id`, `description`, `created_at`, `evidence_snapshot` (copy of evidence_context at time of recommendation)
  - [ ] Audit event: `recommendation_feedback_submitted`
- [ ] Implement recommendation audit event (AC: #5)
  - [ ] On every recommendation generation, append to `audit_events` table
  - [ ] Event type: `recommendation_generated`
  - [ ] Payload: full recommendation struct + evidence context + context assembly metadata
  - [ ] Payload version: `1`
  - [ ] Audit table is append-only per architecture.md
- [ ] Implement support recommendation history query (AC: #6)
  - [ ] GraphQL query: `recommendationHistory(userId: ID!, hiveId: ID, from: DateTime, to: DateTime): [RecommendationHistoryEntry]`
  - [ ] `RecommendationHistoryEntry`: recommendation + evidence context + user actions (accepted, dismissed, feedback)
  - [ ] RBAC: restricted to `support` role
  - [ ] sqlc query joins recommendations, recommendation_feedback, and user_actions tables
- [ ] Implement `recommendation_feedback` DB table (AC: #4)
  - [ ] Migration: `recommendation_feedback(id UUID, recommendation_id UUID FK, user_id UUID FK, tenant_id UUID, description TEXT, evidence_snapshot JSONB, created_at TIMESTAMPTZ)`

## Dev Notes

### Architecture Compliance
- Audit events use the required envelope: `eventId`, `eventType`, `occurredAt`, `tenantId`, `payloadVersion`, `payload` per architecture.md "Communication Patterns"
- Audit table is append-only per architecture.md "Authentication & Security -- Auditability"
- Evidence context is the foundation for trust recovery per Epic 9 tech notes
- Support query implements FR50 and FR51: recommendation history with evidence for troubleshooting
- RBAC enforcement: support queries restricted to `support` role via chi middleware per architecture.md authorization model
- All database queries include `WHERE tenant_id = $1` per architecture.md

### TDD Requirements (Tests First!)
- Test 1: `TestEvidenceContext_StoredWithRecommendation` -- recommendation record includes `evidence_context` JSONB with all source references, freshness timestamps, and contribution weights.
- Test 2: `TestConfidenceType_InsufficientData` -- when data sources are below minimum threshold, confidence type is `INSUFFICIENT_DATA` with appropriate user-facing message.
- Test 3: `TestConfidenceType_ConflictingEvidence` -- when data sources present conflicting signals, confidence type is `CONFLICTING_EVIDENCE` with appropriate user-facing message.
- Test 4: `TestNegativeOutcomeFeedback_LinkedToRecommendation` -- feedback mutation stores a record linked to the original recommendation ID with evidence snapshot.
- Test 5: `TestAuditEvent_CreatedOnGeneration` -- every recommendation generation appends a `recommendation_generated` audit event with full payload.
- Test 6: `TestSupportQuery_ReturnsFullChain` -- support query returns recommendation + evidence context + user actions for the specified user and time range.
- Test 7: `TestSupportQuery_RestrictedToSupportRole` -- non-support roles receive authorization error when querying recommendation history.
- Use `testcontainers-go` for PostgreSQL integration tests. Mock Gemini client for unit tests.

### Technical Specifications
- **Database:** `recommendations` table extended with `evidence_context JSONB`; new `recommendation_feedback` table
- **Audit events:** append-only `audit_events` table; payload version `1`
- **GraphQL mutations:** `reportNegativeOutcome` in `apps/api/graph/schema/recommendation.graphql`
- **GraphQL queries:** `recommendationHistory` in `apps/api/graph/schema/recommendation.graphql`
- **Confidence types:** enum `STANDARD | INSUFFICIENT_DATA | CONFLICTING_EVIDENCE | LIMITED_EXPERIENCE`
- **User-facing messages:** `INSUFFICIENT_DATA` -> "Not enough information to be sure"; `CONFLICTING_EVIDENCE` -> "Mixed signals from your data"; `LIMITED_EXPERIENCE` -> "Limited experience in your region"
- **RBAC:** `recommendationHistory` query requires `support` role

### Anti-Patterns to Avoid
- DO NOT store evidence context as a flat string -- use structured JSONB for queryability
- DO NOT allow audit events to be updated or deleted -- the table is append-only
- DO NOT conflate "not enough data" with "conflicting data" -- these are distinct confidence states with different user implications (FR54a)
- DO NOT allow non-support roles to access recommendation history with evidence -- this is sensitive data
- DO NOT skip the evidence snapshot on negative outcome feedback -- without it, calibration review has no baseline
- DO NOT store recommendation feedback without linking to the original recommendation ID

### Project Structure Notes
- `apps/api/internal/service/recommendation/confidence.go` -- confidence classification logic
- `apps/api/internal/service/recommendation/confidence_test.go` -- tests
- `apps/api/internal/service/recommendation/evidence.go` -- evidence context building and serialization
- `apps/api/internal/domain/recommendation.go` -- extended with `EvidenceContext`, `ConfidenceType` (shared with Stories 9.1, 9.2)
- `apps/api/internal/domain/audit.go` -- audit event types
- `apps/api/graph/schema/recommendation.graphql` -- mutations and queries for feedback and support history
- `apps/api/graph/resolver/recommendation_resolver.go` -- resolver implementations
- `apps/api/internal/repository/recommendation_feedback.go` -- sqlc queries for feedback
- `apps/api/migrations/` -- migrations for `evidence_context` column and `recommendation_feedback` table

### References
- [Source: architecture.md#Authentication & Security -- Auditability (append-only audit event log)]
- [Source: architecture.md#Communication Patterns -- Required event envelope]
- [Source: architecture.md#Technical Constraints -- Evidence traceability for support-case replay and trust debugging]
- [Source: prd.md#FR50 -- Support role can review recommendation history for user-reported issues]
- [Source: prd.md#FR51 -- Preserve recommendation evidence context for troubleshooting]
- [Source: prd.md#FR53 -- Retain auditable trail of recommendation and user action events]
- [Source: prd.md#FR54 -- Present uncertainty explicitly when evidence is incomplete]
- [Source: prd.md#FR54a -- Distinguish insufficient data from conflicting evidence]
- [Source: prd.md#FR54b -- Allow users to report negative outcomes linked to recommendation evidence]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
