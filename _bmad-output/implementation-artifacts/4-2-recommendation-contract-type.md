# Story 4.2: Recommendation Contract Type

Status: ready-for-dev

## Story

As a developer,
I want the Recommendation contract implemented as a fully typed Go domain struct with validation, serialization, and resolver mapping,
so that every recommendation surface in the app returns a trustworthy, explainable, and complete recommendation with action, rationale, confidence, and fallback.

## Acceptance Criteria (BDD)

1. GIVEN a Recommendation Go domain struct WHEN I create an instance THEN all mandatory fields (Action, Rationale, ConfidenceLevel, ConfidenceType, FallbackAction) must be populated or construction fails with a validation error.
2. GIVEN a ConfidenceLevel value WHEN it is outside the range 0.0 to 1.0 THEN the validator returns an error with code `INVALID_CONFIDENCE_LEVEL`.
3. GIVEN a Recommendation with ConfidenceType `INSUFFICIENT_DATA` WHEN the ConfidenceLevel is above 0.5 THEN the validator returns an error because insufficient data cannot produce high confidence.
4. GIVEN a valid Recommendation WHEN it is resolved via the GraphQL Recommendation resolver THEN all non-nullable fields map correctly to the GraphQL schema type defined in Story 4.1.
5. GIVEN a Recommendation with evidence sources WHEN serialized to JSON THEN `evidenceContext` contains structured source references traceable to inspections, knowledge base entries, or telemetry signals.
6. GIVEN a Recommendation WHEN `skillAdaptedExplanation` is requested THEN the resolver returns a plain-language explanation adapted to the user's skill level (newbie, amateur, sideliner).
7. GIVEN a Recommendation with a low confidence score (below 0.4) WHEN resolved THEN the `fallbackAction` field is non-empty and represents a safe conservative default action.

## Tasks / Subtasks

- [ ] Write domain validation test: Recommendation struct rejects missing mandatory fields (AC: #1)
- [ ] Write confidence range test: ConfidenceLevel outside 0.0-1.0 returns typed error (AC: #2)
- [ ] Write confidence coherence test: INSUFFICIENT_DATA with high confidence is rejected (AC: #3)
- [ ] Write resolver mapping test: Recommendation domain struct maps to GraphQL response with all non-null fields (AC: #4)
- [ ] Write evidence serialization test: evidenceContext contains structured source references (AC: #5)
- [ ] Write skill adaptation test: skillAdaptedExplanation varies by user skill level (AC: #6)
- [ ] Write fallback enforcement test: low-confidence recommendations always have non-empty fallbackAction (AC: #7)
- [ ] Implement `Recommendation` domain struct in `apps/api/internal/domain/recommendation.go` (AC: #1, #2, #3)
- [ ] Implement `ConfidenceType` enum as Go constants with string mapping (AC: #3)
- [ ] Implement `NewRecommendation()` constructor with field validation (AC: #1, #2, #3)
- [ ] Implement `Validate()` method with coherence checks between ConfidenceType and ConfidenceLevel (AC: #3)
- [ ] Implement `EvidenceSource` struct for traceability (AC: #5)
- [ ] Implement Recommendation GraphQL resolver in `apps/api/graph/resolver/recommendation.go` (AC: #4)
- [ ] Implement `skillAdaptedExplanation` field resolver with skill-level lookup (AC: #6)
- [ ] Implement fallback enforcement: ensure FallbackAction is always populated, especially for low confidence (AC: #7)
- [ ] Bind Recommendation domain type to gqlgen model in `gqlgen.yml` (AC: #4)

## Dev Notes

### Architecture Compliance
- The Recommendation contract is architecturally mandated: every recommendation surface must return action + rationale + confidence + fallback
- This is the central trust contract of the entire application — confidence signaling and fallback actions are non-negotiable
- The domain struct lives in `internal/domain/` and is independent of GraphQL — the resolver maps domain to GraphQL
- EvidenceSource supports support-case replay and trust debugging per architecture cross-cutting concerns
- ConfidenceType enum values align exactly with the GraphQL schema enum from Story 4.1

### TDD Requirements (Tests First!)
- Test 1: **Construction validation** — `NewRecommendation()` with empty Action returns error. With all fields populated, returns valid struct.
- Test 2: **Confidence range** — ConfidenceLevel of -0.1 or 1.1 returns `INVALID_CONFIDENCE_LEVEL` error.
- Test 3: **Confidence coherence** — `INSUFFICIENT_DATA` + ConfidenceLevel 0.8 returns coherence error. `HIGH` + ConfidenceLevel 0.9 passes.
- Test 4: **Resolver mapping** — Create domain Recommendation, resolve via GraphQL test query, assert all fields present and correctly typed in response JSON.
- Test 5: **Evidence serialization** — Recommendation with 3 evidence sources serializes to JSON with source type, source ID, and relevance score per source.
- Test 6: **Skill adaptation** — Same recommendation resolved for `newbie` vs `sideliner` returns different explanation text.
- Test 7: **Fallback enforcement** — Recommendation with ConfidenceLevel 0.2 always has non-empty FallbackAction. Construction with empty FallbackAction and low confidence fails.

### Technical Specifications
- **Domain struct location:** `apps/api/internal/domain/recommendation.go`
- **Resolver location:** `apps/api/graph/resolver/recommendation.go`
- **ConfidenceLevel:** `float64`, range 0.0 to 1.0 inclusive
- **ConfidenceType values:** `HIGH` (>=0.8), `MODERATE` (0.5-0.79), `LOW` (0.3-0.49), `INSUFFICIENT_DATA` (<0.3), `CONFLICTING_EVIDENCE` (any level), `LIMITED_EXPERIENCE` (any level)
- **EvidenceSource fields:** `sourceType` (inspection, knowledge_base, telemetry, weather), `sourceID` (UUID), `relevanceScore` (float64), `summary` (string)
- **Skill levels for adaptation:** newbie, amateur, sideliner (from user profile)
- **Fallback threshold:** ConfidenceLevel < 0.4 triggers mandatory fallback validation

### Anti-Patterns to Avoid
- DO NOT make any Recommendation contract field nullable — the architecture explicitly requires all five core fields
- DO NOT skip validation in the constructor — invalid recommendations must never reach the resolver layer
- DO NOT hardcode skill-adapted explanations — they must be dynamically generated based on user profile
- DO NOT store ConfidenceType as raw strings in the domain layer — use typed Go constants
- DO NOT conflate domain validation with GraphQL input validation — domain struct validates business rules, GraphQL validates request shape
- DO NOT return empty fallbackAction for any confidence level — it is always required, but enforcement is strict below 0.4

### Project Structure Notes
- Domain types: `apps/api/internal/domain/recommendation.go`
- Domain tests: `apps/api/internal/domain/recommendation_test.go`
- Resolver: `apps/api/graph/resolver/recommendation.go`
- Resolver tests: `apps/api/graph/resolver/recommendation_test.go`
- gqlgen model binding: `apps/api/gqlgen.yml`

### References
- [Source: architecture.md#Core Architectural Decisions — Recommendation contract]
- [Source: architecture.md#Recommendation Engine Architecture — Response contract]
- [Source: architecture.md#Cross-Cutting Concerns — Consistent recommendation explainability]
- [Source: epics.md#Story 4.1 — Recommendation type fields]
- [Source: CLAUDE.md#Custom Domain Components — RecommendationCard]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
