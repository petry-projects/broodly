# Story 9.1: Context Assembly Service

Status: ready-for-dev

## Story

As a system,
I want to assemble the full context for recommendation generation -- including user inspection history, seasonal phase, regional baselines, hive state, weather/flora signals, telemetry readings, and skill level --
so that every recommendation is grounded in all available evidence and each source is tagged with its freshness.

**FRs:** FR12, FR35

## Acceptance Criteria (BDD)

1. GIVEN a valid hive ID and user ID WHEN `AssembleRecommendationContext(hiveID, userID)` is called THEN a `RecommendationContext` struct is returned containing inspection history, hive state, seasonal phase, weather, flora, telemetry, and skill level sections.
2. GIVEN the user's hive has inspection records WHEN context is assembled THEN the last 3 inspections for that hive (within the rolling window of current season plus prior season) are included.
3. GIVEN the user has a registered region WHEN context is assembled THEN the regional seasonal phase for the user's location and current date is included.
4. GIVEN telemetry integrations are active for the hive WHEN context is assembled THEN the most recent telemetry readings are included with their timestamps.
5. GIVEN one or more context sources are unavailable or stale WHEN context is assembled THEN each missing/stale source is flagged with a reason string and the staleness duration in the assembly output.
6. GIVEN the user has a skill level set WHEN context is assembled THEN the skill level is included for downstream guidance depth adaptation (FR35).
7. GIVEN context has been assembled for a hive+user pair WHEN the same pair is requested again within the session TTL THEN the context is served from Redis cache rather than re-queried.
8. GIVEN each source in the assembled context WHEN the context is returned THEN every source section carries a `freshness_at` ISO-8601 UTC timestamp indicating when the source data was last refreshed.

## Tasks / Subtasks

- [ ] Define `RecommendationContext` Go struct in `apps/api/internal/domain/recommendation.go` (AC: #1, #8)
  - [ ] Fields: `InspectionHistory []InspectionSummary`, `HiveState HiveSnapshot`, `SeasonalPhase SeasonalPhaseInfo`, `Weather WeatherSignal`, `Flora FloraSignal`, `Telemetry []TelemetryReading`, `SkillLevel string`, `MissingSources []MissingSource`
  - [ ] Each source section includes a `FreshnessAt time.Time` field
  - [ ] `MissingSource` struct: `SourceName string`, `Reason string`, `StaleDuration *time.Duration`
- [ ] Define `ContextAssembler` interface in `apps/api/internal/service/recommendation/assembler.go` (AC: #1)
  - [ ] Method: `Assemble(ctx context.Context, hiveID, userID uuid.UUID) (*RecommendationContext, error)`
- [ ] Implement inspection history retrieval (AC: #2)
  - [ ] sqlc query: fetch last 3 inspections for hive within rolling window (current season + prior season)
  - [ ] Map DB rows to `InspectionSummary` domain type
- [ ] Implement hive state snapshot retrieval (AC: #1)
  - [ ] sqlc query: current hive record with latest status fields
- [ ] Implement seasonal phase lookup (AC: #3)
  - [ ] Look up user's registered region
  - [ ] Resolve current seasonal phase from region + date using seasonal calendar data
- [ ] Implement weather and flora signal retrieval (AC: #4, #5)
  - [ ] Read from adapter cache (Redis or DB)
  - [ ] Tag with freshness timestamp
  - [ ] Flag as missing/stale if beyond staleness threshold (weather: 24h, flora: 7d per FR48c)
- [ ] Implement telemetry retrieval (AC: #4, #5)
  - [ ] Fetch latest readings from telemetry table for hive
  - [ ] Flag as missing if no integration connected; flag as stale if beyond configurable threshold
- [ ] Implement skill level inclusion (AC: #6)
  - [ ] Read user profile skill level field
- [ ] Implement Redis caching layer (AC: #7)
  - [ ] Cache key: `rec_ctx:{hiveID}:{userID}`
  - [ ] TTL: configurable, default 5 minutes
  - [ ] Cache miss triggers full assembly; cache hit returns deserialized context
- [ ] Implement missing/stale source flagging (AC: #5, #8)
  - [ ] After each source retrieval, check freshness against defined thresholds
  - [ ] Append to `MissingSources` slice with reason and staleness duration

## Dev Notes

### Architecture Compliance
- Context assembly is a Go application service in `apps/api/internal/service/recommendation/` per architecture.md "Requirements to Structure Mapping"
- Redis pre-computation cache per architecture.md: "Cloud Memorystore (Redis) for context assembly and recommendation input pre-computation"
- Rolling window (current season + prior season) per architecture.md "Longitudinal data strategy"
- All database queries include `WHERE tenant_id = $1` as mandatory parameter per architecture.md authorization model
- Recommendation contract: action + rationale + confidence + fallback -- context assembly is the input stage that feeds this contract

### TDD Requirements (Tests First!)
- Test 1: `TestAssemble_IncludesLast3Inspections` -- context assembly includes the user's last 3 inspections for the hive, ordered by date descending.
- Test 2: `TestAssemble_IncludesSeasonalPhase` -- context assembly includes the regional seasonal phase for the user's registered location and current date.
- Test 3: `TestAssemble_IncludesTelemetry` -- context assembly includes active telemetry readings with freshness timestamps when integrations are connected.
- Test 4: `TestAssemble_FlagsMissingSources` -- when a source is unavailable, the `MissingSources` slice contains an entry with the source name and reason.
- Test 5: `TestAssemble_FlagsStaleSources` -- when a source exceeds its staleness threshold, it is flagged with the staleness duration.
- Test 6: `TestAssemble_IncludesSkillLevel` -- context includes the user's skill level for guidance depth adaptation.
- Test 7: `TestAssemble_CachesInRedis` -- second call for same hive+user within TTL returns cached result without hitting the database.
- Test 8: `TestAssemble_EachSourceHasFreshnessTimestamp` -- every source section in the returned context carries a non-zero `FreshnessAt` timestamp.
- Use `testcontainers-go` for PostgreSQL and Redis integration tests. Use `stretchr/testify` for assertions.

### Technical Specifications
- **Go packages:** `apps/api/internal/service/recommendation/`, `apps/api/internal/domain/`, `apps/api/internal/repository/`
- **Database:** Cloud SQL PostgreSQL 16 with pgvector; sqlc for type-safe queries
- **Cache:** Cloud Memorystore Redis, `redis.Client` from `github.com/redis/go-redis/v9`
- **Staleness thresholds (FR48c):** weather 24h, flora 7d, telemetry configurable per sensor type
- **Rolling window:** current season + prior season for inspection history queries
- **Serialization:** JSON marshaling for Redis cache storage of `RecommendationContext`
- **Logging:** structured JSON via `log/slog` with `hive_id`, `user_id`, and source freshness metadata

### Anti-Patterns to Avoid
- DO NOT assemble context by making N+1 database calls in a loop -- batch queries per source type
- DO NOT cache indefinitely -- always use TTL-based expiry for recommendation context
- DO NOT silently drop missing sources -- every missing/stale source must be explicitly flagged
- DO NOT hardcode staleness thresholds -- they must be configurable values (environment or config)
- DO NOT return partial context without flagging what is missing -- the contract requires completeness signaling
- DO NOT bypass the repository interface to query the DB directly from the service layer

### Project Structure Notes
- `apps/api/internal/domain/recommendation.go` -- `RecommendationContext`, `MissingSource`, and related domain types
- `apps/api/internal/service/recommendation/assembler.go` -- `ContextAssembler` interface and implementation
- `apps/api/internal/service/recommendation/assembler_test.go` -- unit and integration tests
- `apps/api/internal/repository/` -- sqlc query files for inspection history, hive state, telemetry, user profile
- Tests co-located with source files per architecture.md convention

### References
- [Source: architecture.md#Recommendation Engine Architecture -- Step 1: Context Assembly]
- [Source: architecture.md#Data Architecture -- Longitudinal data strategy (rolling window)]
- [Source: architecture.md#Data Architecture -- Caching: Cloud Memorystore for context assembly]
- [Source: architecture.md#Technical Constraints -- Recommendation contract: action + rationale + confidence + fallback]
- [Source: prd.md#FR12 -- Combine user history and regional context]
- [Source: prd.md#FR35 -- Adapt guidance depth based on skill progression state]
- [Source: prd.md#FR48c -- Staleness thresholds per external data category]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
