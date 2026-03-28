# Story 9.2: Gemini Recommendation Scoring

Status: ready-for-dev

## Story

As a system,
I want to score and rank recommended actions using Vertex AI Gemini with the assembled recommendation context,
so that users receive the most impactful, jurisdiction-safe next action along with its rationale, confidence, and a conservative fallback.

**FRs:** FR14, FR21, FR22, FR23, FR24, FR12a, FR12b, FR54c

## Acceptance Criteria (BDD)

1. GIVEN an assembled `RecommendationContext` WHEN the scoring service is invoked THEN the Gemini API is called with a structured prompt containing the full context and the response is parsed into a `Recommendation` struct with fields: `Action`, `Rationale`, `Confidence` (float 0-1), `ConfidenceType`, `FallbackAction`, `EvidenceSources`, and `SkillAdaptedExplanation`.
2. GIVEN one or more context sources are stale (per FR48b thresholds) WHEN the recommendation is scored THEN the confidence value is penalized proportionally and the stale source is identified in the response.
3. GIVEN a recommendation involves a treatment WHEN the user's jurisdiction is checked against the treatment registry THEN prohibited treatments are never returned; restricted/prescription-required treatments include a visible regulatory notice and directive to consult authorities or a veterinarian (FR12b).
4. GIVEN a high-priority condition (pest infestation, starvation risk, queenlessness) WHEN multiple actions are scored THEN the high-priority action ranks above routine maintenance regardless of other factors (FR14).
5. GIVEN any recommendation WHEN the fallback action is generated THEN the fallback differs from the primary action and is a safe, conservative action suitable for any skill level (FR24).
6. GIVEN the regional baseline coverage for the user's region is below the defined threshold WHEN a recommendation is scored THEN the confidence type is set to `LIMITED_EXPERIENCE` rather than a numeric score (FR54c).
7. GIVEN a Gemini API call succeeds WHEN the response is parsed THEN the `Recommendation` is cached with a configurable TTL (default 15 minutes) to avoid redundant API calls.
8. GIVEN the user's skill level is included in the context WHEN the recommendation is generated THEN the `SkillAdaptedExplanation` field uses language and detail appropriate for that skill level.

## Tasks / Subtasks

- [ ] Define `Recommendation` domain type in `apps/api/internal/domain/recommendation.go` (AC: #1)
  - [ ] Fields: `Action string`, `Rationale string`, `Confidence float64`, `ConfidenceType string` (enum: `STANDARD`, `INSUFFICIENT_DATA`, `CONFLICTING_EVIDENCE`, `LIMITED_EXPERIENCE`), `FallbackAction string`, `EvidenceSources []EvidenceSource`, `SkillAdaptedExplanation string`
  - [ ] `EvidenceSource` struct: `SourceID string`, `SourceType string`, `FreshnessAt time.Time`, `ContributionWeight float64`
- [ ] Define `RecommendationScorer` interface in `apps/api/internal/service/recommendation/scorer.go` (AC: #1)
  - [ ] Method: `Score(ctx context.Context, recCtx *RecommendationContext) (*Recommendation, error)`
- [ ] Build structured prompt template (AC: #1, #4, #8)
  - [ ] Go template in `apps/api/internal/ai/prompts/recommendation_scoring.go`
  - [ ] Template sections: system instructions, assembled context, skill level instructions, output schema (action, rationale, confidence, fallback, evidence sources)
  - [ ] Include priority weighting instructions: high-priority conditions outrank routine maintenance
- [ ] Implement Gemini API client call (AC: #1)
  - [ ] Use `cloud.google.com/go/vertexai` SDK
  - [ ] Model: `gemini-2.0-pro` for recommendation scoring
  - [ ] Configure structured output (JSON mode) for reliable parsing
  - [ ] Rate limiting: token bucket per user, configurable burst/rate
- [ ] Implement response parsing into `Recommendation` struct (AC: #1)
  - [ ] Parse Gemini JSON response into typed Go struct
  - [ ] Validate all required fields are present; return error if malformed
- [ ] Implement confidence penalty for stale sources (AC: #2)
  - [ ] For each stale source in `RecommendationContext.MissingSources`, apply a configurable penalty factor
  - [ ] Default penalties: weather stale -0.15, flora stale -0.10, telemetry stale -0.10
  - [ ] Clamp confidence to [0.0, 1.0] after penalties
  - [ ] Include stale source names in response metadata
- [ ] Implement jurisdiction treatment registry check (AC: #3)
  - [ ] Load treatment registry (DB table: `treatment_registry` with columns: `treatment_id`, `jurisdiction`, `legal_status` enum: approved/restricted/prescription_required/prohibited)
  - [ ] Pre-filter: remove prohibited treatments from prompt context
  - [ ] Post-filter: if Gemini returns prohibited treatment, substitute with fallback
  - [ ] Annotate restricted/prescription-required treatments with regulatory notice text
- [ ] Implement `LIMITED_EXPERIENCE` confidence type (AC: #6)
  - [ ] Query regional baseline coverage metric (count of historical recommendations/inspections for region)
  - [ ] If below threshold (configurable, default: 50 inspections in region), set `ConfidenceType = LIMITED_EXPERIENCE`
- [ ] Implement recommendation caching (AC: #7)
  - [ ] Cache key: `rec:{hiveID}:{userID}:{contextHash}`
  - [ ] TTL: configurable, default 15 minutes
  - [ ] Context hash computed from key context fields to detect staleness
- [ ] Implement skill-adapted explanation (AC: #8)
  - [ ] Prompt includes skill level and explanation depth directive
  - [ ] Newbie: detailed step-by-step with educational context
  - [ ] Amateur/Sideliner: moderate detail with reasoning
  - [ ] Experienced: concise action-focused

## Dev Notes

### Architecture Compliance
- Recommendation scoring is Step 3 in the Recommendation Engine Architecture (architecture.md)
- Uses Vertex AI Gemini accessed from Go backend via `google-cloud-go` SDK with service account credentials
- Recommendation contract is mandatory in GraphQL responses: action + rationale + confidence + fallback (architecture.md Critical Decisions)
- Gemini model tiering: `gemini-2.0-pro` for complex recommendation scoring per architecture.md "Scaling Leverage Points"
- Treatment registry implements FR12a jurisdiction-aware treatment legality
- Rate limit Gemini calls per architecture.md Tech Notes on Story 9.2

### TDD Requirements (Tests First!)
- Test 1: `TestScore_ReturnsFullRecommendationContract` -- scoring returns action, rationale, confidence, fallbackAction, evidenceSources, and skillAdaptedExplanation with no empty fields.
- Test 2: `TestScore_ConfidenceDowngradedForStaleSources` -- when context includes stale weather data, confidence is reduced by the configured penalty and the stale source is identified.
- Test 3: `TestScore_HighPriorityRanksAboveRoutine` -- pest treatment or starvation risk actions rank above routine maintenance in scored output.
- Test 4: `TestScore_FallbackDiffersFromPrimary` -- the fallback action is not equal to the primary action and is a safe/conservative action.
- Test 5: `TestScore_ProhibitedTreatmentNeverReturned` -- when the user's jurisdiction prohibits a treatment, it is never present in the recommendation action or fallback.
- Test 6: `TestScore_RestrictedTreatmentIncludesNotice` -- restricted or prescription-required treatments include regulatory notice text in the rationale.
- Test 7: `TestScore_LimitedExperienceConfidenceType` -- when regional baseline coverage is below threshold, confidence type is `LIMITED_EXPERIENCE`.
- Test 8: `TestScore_CachesRecommendation` -- second call with identical context returns cached result without calling Gemini API.
- Use mock Gemini client for unit tests. Integration tests use test containers + actual Vertex AI in CI with test project.

### Technical Specifications
- **AI model:** Vertex AI Gemini 2.0 Pro (`gemini-2.0-pro`) via `cloud.google.com/go/vertexai/genai`
- **Prompt template:** Go `text/template` with structured sections; stored in `apps/api/internal/ai/prompts/`
- **Output format:** Gemini JSON mode (structured output) for reliable parsing
- **Rate limiting:** token bucket per user; default 10 requests/minute burst, 2 requests/minute sustained
- **Confidence penalties:** configurable via environment; defaults: weather_stale=-0.15, flora_stale=-0.10, telemetry_stale=-0.10
- **Cache TTL:** 15 minutes default, configurable
- **Treatment registry table:** `treatment_registry(id UUID, treatment_name TEXT, jurisdiction TEXT, legal_status TEXT, regulatory_notice TEXT, updated_at TIMESTAMPTZ)`
- **Regional baseline threshold:** 50 inspections in region (configurable)

### Anti-Patterns to Avoid
- DO NOT return a recommendation without all four contract fields (action, rationale, confidence, fallback) -- this violates the core architectural constraint
- DO NOT call Gemini without rate limiting -- unbounded API calls will exhaust quota and budget
- DO NOT trust Gemini output without post-validation -- always validate against treatment registry and confidence bounds
- DO NOT hardcode prompt text inline -- use Go templates in a dedicated prompts package for maintainability
- DO NOT skip confidence penalties when sources are stale -- silent degradation erodes user trust
- DO NOT cache recommendations without a context hash -- stale cache on changed context returns wrong guidance
- DO NOT return numeric confidence when regional coverage is below threshold -- use `LIMITED_EXPERIENCE` type instead

### Project Structure Notes
- `apps/api/internal/service/recommendation/scorer.go` -- `RecommendationScorer` interface and implementation
- `apps/api/internal/service/recommendation/scorer_test.go` -- tests
- `apps/api/internal/ai/prompts/recommendation_scoring.go` -- structured prompt template
- `apps/api/internal/ai/gemini_client.go` -- Vertex AI Gemini client wrapper
- `apps/api/internal/domain/recommendation.go` -- `Recommendation`, `EvidenceSource` domain types (shared with Story 9.1)
- `apps/api/internal/domain/treatment_registry.go` -- treatment legality types
- `apps/api/internal/repository/treatment_registry.go` -- sqlc queries for jurisdiction lookup
- `apps/api/migrations/` -- migration for `treatment_registry` table

### References
- [Source: architecture.md#Recommendation Engine Architecture -- Step 3: Recommendation Scoring (Vertex AI Gemini)]
- [Source: architecture.md#AI/ML Architecture -- Gemini for recommendation scoring]
- [Source: architecture.md#Scaling Leverage Points -- gemini-2.0-pro for complex recommendation scoring]
- [Source: architecture.md#Technical Constraints -- Recommendation contract: action + rationale + confidence + fallback]
- [Source: prd.md#FR14 -- Rank actions by urgency and expected outcome impact]
- [Source: prd.md#FR21 -- Provide recommended next action during inspection]
- [Source: prd.md#FR22 -- Provide rationale for each recommendation]
- [Source: prd.md#FR23 -- Provide confidence level for each recommendation]
- [Source: prd.md#FR24 -- Provide safe fallback action when confidence is limited]
- [Source: prd.md#FR12a -- Jurisdiction-aware treatment registry]
- [Source: prd.md#FR12b -- Never recommend prohibited treatments; regulatory notice for restricted]
- [Source: prd.md#FR54c -- LIMITED_EXPERIENCE for sparse regional baseline]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
