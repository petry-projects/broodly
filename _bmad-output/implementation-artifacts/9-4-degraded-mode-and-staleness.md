# Story 9.4: Degraded Mode and Staleness Handling

Status: ready-for-dev

## Story

As a system,
I want to provide safe, conservative recommendations when integrations are unavailable or data is stale, and to generate recovery guidance after missed or delayed actions,
so that users always receive actionable guidance even in degraded conditions and know exactly which data sources are compromised.

**FRs:** FR9, FR48, FR48b, FR48c, FR52

## Acceptance Criteria (BDD)

1. GIVEN weather data is unavailable or stale beyond 24 hours WHEN a recommendation is generated THEN the system uses conservative seasonal defaults from regional baselines and the confidence is explicitly downgraded with the degraded source identified (FR48, FR48b).
2. GIVEN telemetry data is unavailable WHEN a recommendation is generated THEN the system uses inspection-history-only recommendations with a confidence downgrade and the response indicates telemetry is missing (FR48).
3. GIVEN the user has no region or seasonal context configured WHEN a recommendation is requested THEN no recommendation is generated and the response contains a "Complete your profile" call-to-action with a clear message explaining why (FR9).
4. GIVEN a user has overdue tasks or missed inspection windows WHEN recommendations are generated THEN recovery guidance is included as a special recommendation type explaining the impact of delay and the best recovery path (FR52).
5. GIVEN staleness thresholds are defined per data category WHEN configuration is loaded THEN the thresholds are: weather 24h, flora/bloom 7d, telemetry configurable per sensor type, and these can be overridden via environment configuration (FR48c).
6. GIVEN any degraded condition WHEN a recommendation is returned THEN the response always contains a valid recommendation (even if conservative) -- the system never returns an empty recommendation except when region/season context is completely missing (AC #3).
7. GIVEN multiple data sources are degraded simultaneously WHEN confidence is penalized THEN each degraded source contributes an independent penalty and all degraded sources are listed in the response metadata.
8. GIVEN flora/bloom data is stale beyond 7 days WHEN a recommendation is generated THEN the bloom-dependent aspects of the recommendation use conservative assumptions and the staleness is communicated.

## Tasks / Subtasks

- [ ] Define staleness threshold configuration (AC: #5)
  - [ ] In `apps/api/internal/service/recommendation/staleness.go`
  - [ ] `StalenessConfig` struct: `WeatherMaxAge time.Duration`, `FloraMaxAge time.Duration`, `TelemetryMaxAge map[string]time.Duration` (per sensor type)
  - [ ] Defaults: weather 24h, flora 7d, telemetry 1h (overridable per sensor)
  - [ ] Load from environment via `caarlos0/env` struct tags
- [ ] Implement degraded-mode recommendation path (AC: #1, #2, #6)
  - [ ] In `apps/api/internal/service/recommendation/degraded.go`
  - [ ] `GenerateDegradedRecommendation(recCtx *RecommendationContext, degradedSources []MissingSource) (*Recommendation, error)`
  - [ ] When weather stale: substitute conservative seasonal defaults from `regional_baselines` table
  - [ ] When telemetry missing: generate history-only recommendation; include note about missing telemetry
  - [ ] When flora stale: use conservative bloom assumptions for the seasonal phase
  - [ ] Always produce a valid `Recommendation` with action, rationale, confidence, fallback
- [ ] Implement region/season availability guard (AC: #3)
  - [ ] Before context assembly, check user profile for region and seasonal context
  - [ ] If absent, return a `ProfileIncompleteError` with field `RequiredFields []string` and CTA message
  - [ ] GraphQL response: `recommendation` field is null, `profileIncomplete` field contains CTA data
- [ ] Implement recovery guidance generation (AC: #4)
  - [ ] In `apps/api/internal/service/recommendation/recovery.go`
  - [ ] Detect overdue tasks: query tasks where `due_date < now()` and `status = 'pending'`
  - [ ] Generate recovery recommendation with type `RECOVERY`
  - [ ] Recovery rationale explains: what was missed, potential impact, recommended recovery steps
  - [ ] Recovery recommendations carry their own confidence based on delay severity
- [ ] Implement cumulative confidence penalty for multiple degraded sources (AC: #7)
  - [ ] Each degraded source contributes an independent penalty (additive, not multiplicative)
  - [ ] Penalty values: weather_stale -0.15, flora_stale -0.10, telemetry_missing -0.10 (configurable)
  - [ ] Clamp final confidence to [0.05, 1.0] -- never zero so user still gets guidance
  - [ ] All degraded sources listed in `Recommendation.DegradedSources []DegradedSourceInfo`
  - [ ] `DegradedSourceInfo`: `SourceName string`, `StaleDuration time.Duration`, `PenaltyApplied float64`
- [ ] Implement conservative defaults from regional baselines (AC: #1, #8)
  - [ ] Query `regional_baselines` table for user's region and current seasonal phase
  - [ ] Baseline provides: default recommended actions, conservative timing, safe treatment options
  - [ ] These defaults are used as fallback context when live data is unavailable
- [ ] Add `DegradedSourceInfo` and `RECOVERY` recommendation type to domain types (AC: #4, #7)
  - [ ] Extend `Recommendation` struct with `DegradedSources []DegradedSourceInfo` and `RecommendationType string` (enum: `STANDARD`, `DEGRADED`, `RECOVERY`)

## Dev Notes

### Architecture Compliance
- Degraded-mode behavior is a cross-cutting concern identified in architecture.md "Cross-Cutting Concerns"
- Conservative defaults sourced from regional baselines per architecture.md "Recommendation Engine Architecture"
- Staleness thresholds per FR48c; confidence penalties per FR48b; both referenced in architecture.md integration points
- Weather adapter confidence penalty also applies to distance-based degradation (architecture.md Integration Points: weather proximity threshold)
- The system always returns a recommendation in degraded mode -- the only exception is completely missing region/season context (FR9)
- Configuration via environment per architecture.md: `caarlos0/env` for Go config structs

### TDD Requirements (Tests First!)
- Test 1: `TestDegraded_MissingWeather_UsesConservativeDefaults` -- when weather data is missing, the recommendation uses conservative seasonal defaults and confidence is downgraded by 0.15.
- Test 2: `TestDegraded_MissingTelemetry_HistoryOnlyWithDowngrade` -- when telemetry is unavailable, recommendation is generated from history only with confidence downgrade and telemetry flagged as missing.
- Test 3: `TestDegraded_NoRegion_BlocksRecommendation` -- when user has no region configured, no recommendation is generated and response includes "Complete your profile" CTA.
- Test 4: `TestRecovery_OverdueTasks_GeneratesRecoveryGuidance` -- when user has overdue tasks, a RECOVERY-type recommendation is generated explaining impact and recovery path.
- Test 5: `TestStaleness_ThresholdsConfigurable` -- staleness thresholds can be overridden via environment configuration.
- Test 6: `TestDegraded_AlwaysReturnsRecommendation` -- in all degraded scenarios (except missing region), a valid recommendation with all contract fields is returned.
- Test 7: `TestDegraded_MultipleSources_CumulativePenalty` -- when weather and telemetry are both stale, penalties are additive and both sources appear in DegradedSources.
- Test 8: `TestDegraded_FloraStale_ConservativeBloomAssumptions` -- when flora data is stale beyond 7 days, bloom-dependent recommendations use conservative assumptions.
- Use `testcontainers-go` for PostgreSQL integration tests. Unit tests with mock context assembly.

### Technical Specifications
- **Staleness thresholds (default):** weather 24h, flora 7d, telemetry 1h (configurable per sensor type)
- **Confidence penalties (default):** weather_stale -0.15, flora_stale -0.10, telemetry_missing -0.10
- **Confidence floor:** 0.05 (never zero in degraded mode)
- **Recovery detection:** query `tasks WHERE due_date < now() AND status = 'pending' AND hive_id = $1`
- **Regional baselines table:** `regional_baselines(id UUID, region TEXT, seasonal_phase TEXT, default_actions JSONB, conservative_timing JSONB, safe_treatments JSONB)`
- **Configuration:** `caarlos0/env` struct tags with `STALENESS_WEATHER_MAX_AGE`, `STALENESS_FLORA_MAX_AGE`, `STALENESS_TELEMETRY_DEFAULT_MAX_AGE` environment variables
- **Recommendation types:** `STANDARD | DEGRADED | RECOVERY`

### Anti-Patterns to Avoid
- DO NOT return an empty or null recommendation in degraded mode (except for missing region/season) -- always provide conservative guidance
- DO NOT silently use stale data without flagging it -- every degraded source must be identified in the response
- DO NOT apply a single flat penalty for all degraded sources -- each source has its own penalty weight
- DO NOT hardcode staleness thresholds -- they must be configurable via environment
- DO NOT conflate "degraded" with "broken" -- degraded mode is a first-class operating state, not an error
- DO NOT generate recovery guidance without explaining the impact of the delay -- users need context to act
- DO NOT allow confidence to reach 0.0 -- a floor of 0.05 ensures users still receive guidance

### Project Structure Notes
- `apps/api/internal/service/recommendation/staleness.go` -- staleness threshold config and evaluation
- `apps/api/internal/service/recommendation/degraded.go` -- degraded-mode recommendation generation
- `apps/api/internal/service/recommendation/recovery.go` -- recovery guidance generation
- `apps/api/internal/service/recommendation/staleness_test.go` -- staleness tests
- `apps/api/internal/service/recommendation/degraded_test.go` -- degraded mode tests
- `apps/api/internal/service/recommendation/recovery_test.go` -- recovery guidance tests
- `apps/api/internal/domain/recommendation.go` -- extended with `DegradedSourceInfo`, `RecommendationType` (shared with Stories 9.1-9.3)
- `apps/api/internal/repository/regional_baselines.go` -- sqlc queries for conservative defaults
- `apps/api/migrations/` -- migration for `regional_baselines` table

### References
- [Source: architecture.md#Cross-Cutting Concerns -- Error handling and degraded-mode behavior]
- [Source: architecture.md#Recommendation Engine Architecture -- Confidence calibration: if model confidence < threshold, downgrade to safe fallback]
- [Source: architecture.md#Integration Points -- Weather adapter proximity threshold and confidence penalty]
- [Source: prd.md#FR9 -- Prevent or flag guidance when localization context is unavailable]
- [Source: prd.md#FR48 -- Continue operating with degraded guidance when integrations are unavailable]
- [Source: prd.md#FR48b -- Apply confidence penalties for stale external context sources]
- [Source: prd.md#FR48c -- Define maximum acceptable staleness thresholds per external data category]
- [Source: prd.md#FR52 -- Support recovery guidance flows after missed or delayed actions]
- [Source: CLAUDE.md#Offline & Sync Patterns -- Staleness escalation: <24h subtle badge, 24-72h amber warning, >72h red banner]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
