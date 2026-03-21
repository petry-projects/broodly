# Story 9.5: Skill-Level Mismatch Detection

Status: ready-for-dev

## Story

As a system,
I want to detect when a user's behavior suggests their configured skill level does not match their actual experience,
so that I can surface a gentle suggestion to adjust their profile, improving the relevance of guidance depth without auto-changing their settings.

**FRs:** FR2d

## Acceptance Criteria (BDD)

1. GIVEN an "Experienced" user WHEN they frequently view educational explanations (5+ times in a 2-week window) THEN a skill-level mismatch signal is recorded and a suggestion card is surfaced: "Your experience setting might need updating."
2. GIVEN a "Newbie" user WHEN they consistently dismiss guided steps (5+ dismissals in a 2-week window) THEN a skill-level mismatch signal is recorded and a suggestion card is surfaced.
3. GIVEN a mismatch signal is detected WHEN the suggestion is surfaced THEN it suggests a profile adjustment but does NOT auto-change the user's skill level.
4. GIVEN a single instance of educational viewing or guided step dismissal WHEN the signal count is below threshold THEN no mismatch suggestion is surfaced -- detection requires a sustained pattern.
5. GIVEN a mismatch suggestion is surfaced WHEN the user taps the adjustment action THEN the skill level is updated in one tap from the suggestion card without navigating to settings.
6. GIVEN a mismatch suggestion was dismissed by the user WHEN the same mismatch pattern continues THEN the suggestion is re-surfaced after a cooldown period (default 30 days).
7. GIVEN behavioral signals are tracked WHEN the 2-week evaluation window expires THEN old signals outside the window are decayed/ignored in the threshold calculation.

## Tasks / Subtasks

- [ ] Define behavioral signal types and tracking schema (AC: #1, #2, #7)
  - [ ] Add columns to user profile or create `skill_mismatch_signals` table
  - [ ] Schema: `skill_mismatch_signals(id UUID, user_id UUID FK, tenant_id UUID, signal_type TEXT, occurred_at TIMESTAMPTZ)`
  - [ ] Signal types: `EDUCATION_VIEW` (experienced user viewing educational content), `GUIDED_STEP_DISMISS` (newbie user dismissing guided steps)
  - [ ] Index on `(user_id, signal_type, occurred_at)` for windowed queries
- [ ] Implement signal recording (AC: #1, #2)
  - [ ] In `apps/api/internal/service/recommendation/skill_mismatch.go`
  - [ ] `RecordMismatchSignal(ctx context.Context, userID uuid.UUID, signalType string) error`
  - [ ] Called from recommendation display resolver (education view) and inspection flow resolver (guided step dismiss)
  - [ ] Lightweight insert; no blocking logic on the recording path
- [ ] Implement mismatch evaluation logic (AC: #1, #2, #4, #7)
  - [ ] `EvaluateMismatch(ctx context.Context, userID uuid.UUID) (*MismatchResult, error)`
  - [ ] Query: count signals of relevant type within last 14 days for user
  - [ ] Relevant type depends on current skill level: Experienced -> count `EDUCATION_VIEW`; Newbie -> count `GUIDED_STEP_DISMISS`
  - [ ] Threshold: 5+ signals in 14-day window triggers mismatch
  - [ ] Signals outside the 14-day window are excluded from count
  - [ ] Return `MismatchResult`: `Detected bool`, `CurrentLevel string`, `SuggestedLevel string`, `SignalCount int`
- [ ] Implement suggestion card data in GraphQL (AC: #3, #5)
  - [ ] GraphQL type: `SkillMismatchSuggestion { detected: Boolean!, currentLevel: String, suggestedLevel: String, message: String }`
  - [ ] Include in recommendation response or as separate query: `skillMismatchCheck(userId: ID!): SkillMismatchSuggestion`
  - [ ] Message: "Your experience setting might need updating" with one-tap action
- [ ] Implement one-tap skill level adjustment mutation (AC: #5)
  - [ ] GraphQL mutation: `adjustSkillLevel(newLevel: SkillLevel!): AdjustSkillLevelPayload`
  - [ ] Updates user profile skill level
  - [ ] Audit event: `skill_level_adjusted` with source: `mismatch_suggestion`
  - [ ] Invalidates cached recommendation context for user
- [ ] Implement suggestion cooldown logic (AC: #6)
  - [ ] Track last suggestion dismissal in `user_preferences` or `skill_mismatch_signals` table
  - [ ] Column: `last_mismatch_suggestion_dismissed_at TIMESTAMPTZ` on user profile
  - [ ] If dismissed within cooldown period (default 30 days), suppress re-suggestion even if threshold met
  - [ ] Cooldown configurable via environment
- [ ] Implement evaluation trigger points (AC: #1, #2)
  - [ ] Evaluate on inspection completion (natural checkpoint)
  - [ ] Evaluate on weekly plan generation (periodic checkpoint)
  - [ ] Lightweight: only runs the count query, not a heavy computation

## Dev Notes

### Architecture Compliance
- Skill mismatch signals are lightweight counters per Epic 9 tech notes: "Signals tracked as lightweight counters in user profile. Evaluated weekly or on inspection completion."
- Audit events for skill level changes per architecture.md "Authentication & Security -- Auditability"
- Recommendation context cache invalidation on skill level change ensures downstream recommendations reflect the new level
- RBAC: skill level adjustment is owner-only (users adjust their own profile)
- All database queries include `WHERE tenant_id = $1` per architecture.md

### TDD Requirements (Tests First!)
- Test 1: `TestMismatch_ExperiencedUser_FrequentEducationViews` -- an "Experienced" user with 5+ education views in 14 days triggers a mismatch detection with suggested downgrade.
- Test 2: `TestMismatch_NewbieUser_FrequentGuidedStepDismissals` -- a "Newbie" user with 5+ guided step dismissals in 14 days triggers a mismatch detection with suggested upgrade.
- Test 3: `TestMismatch_SuggestionDoesNotAutoChange` -- when mismatch is detected, the user's skill level remains unchanged until they explicitly accept the suggestion.
- Test 4: `TestMismatch_SingleInstance_NoDetection` -- a single signal does not trigger mismatch detection; requires sustained pattern (5+ in window).
- Test 5: `TestMismatch_OneTapAdjustment` -- the `adjustSkillLevel` mutation updates the user's profile and creates an audit event with source `mismatch_suggestion`.
- Test 6: `TestMismatch_CooldownAfterDismissal` -- after dismissing a suggestion, the same mismatch is not re-surfaced for 30 days even if the pattern continues.
- Test 7: `TestMismatch_WindowExpiry_OldSignalsIgnored` -- signals older than 14 days are not counted toward the mismatch threshold.
- Use `testcontainers-go` for PostgreSQL integration tests. Unit tests for evaluation logic with mock repositories.

### Technical Specifications
- **Signal storage:** `skill_mismatch_signals` table with `(user_id, signal_type, occurred_at)` index
- **Evaluation window:** 14 days (configurable)
- **Threshold:** 5 signals within window (configurable)
- **Cooldown period:** 30 days after dismissal (configurable)
- **Signal types:** `EDUCATION_VIEW`, `GUIDED_STEP_DISMISS`
- **Skill levels:** `newbie`, `amateur`, `sideliner`, `experienced` (from domain types)
- **Suggested transitions:** Experienced -> Amateur (on education view mismatch); Newbie -> Amateur (on guided step dismiss mismatch)
- **Evaluation triggers:** inspection completion, weekly plan generation
- **Configuration:** `caarlos0/env` struct tags: `MISMATCH_WINDOW_DAYS`, `MISMATCH_THRESHOLD`, `MISMATCH_COOLDOWN_DAYS`

### Anti-Patterns to Avoid
- DO NOT auto-change the user's skill level -- mismatch detection only suggests, never forces
- DO NOT trigger mismatch on a single instance -- require a sustained pattern to avoid false positives
- DO NOT run mismatch evaluation on every API call -- limit to natural checkpoints (inspection completion, weekly plan)
- DO NOT store signals indefinitely without cleanup -- implement periodic cleanup of signals older than 2x the evaluation window
- DO NOT surface the suggestion immediately after dismissal -- respect the cooldown period
- DO NOT block the recording path with evaluation logic -- signal recording must be lightweight and non-blocking

### Project Structure Notes
- `apps/api/internal/service/recommendation/skill_mismatch.go` -- signal recording and mismatch evaluation logic
- `apps/api/internal/service/recommendation/skill_mismatch_test.go` -- tests
- `apps/api/internal/domain/skill_mismatch.go` -- `MismatchResult`, `MismatchSignal` domain types
- `apps/api/graph/schema/skill.graphql` -- `SkillMismatchSuggestion` type, `skillMismatchCheck` query, `adjustSkillLevel` mutation
- `apps/api/graph/resolver/skill_resolver.go` -- resolver implementations
- `apps/api/internal/repository/skill_mismatch.go` -- sqlc queries for signal counting and recording
- `apps/api/migrations/` -- migration for `skill_mismatch_signals` table and user profile `last_mismatch_suggestion_dismissed_at` column

### References
- [Source: epics.md#Story 9.5 -- Skill-Level Mismatch Detection]
- [Source: prd.md#FR2d -- Monitor user behavior for skill-level mismatch signals and suggest profile adjustment]
- [Source: architecture.md#Authentication & Security -- Auditability (audit events for profile changes)]
- [Source: CLAUDE.md#Custom Domain Components -- SkillProgressionCard with level variants: newbie|amateur|sideliner]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
