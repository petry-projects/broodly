# Story 4.3: Apiary & Hive CRUD Resolvers

Status: ready-for-dev

## Story

As a developer,
I want GraphQL resolvers for apiary and hive CRUD operations backed by sqlc repository with authorization and scale-limit enforcement,
so that the mobile app can manage apiaries and hives through the API.

## Acceptance Criteria (BDD)

1. GIVEN a valid `createApiary` mutation with name, location, and microclimate data WHEN executed by an authenticated user THEN a new apiary record is created in the database and returned with a generated UUID.
2. GIVEN a user who already owns 5 apiaries WHEN they execute `createApiary` THEN the mutation returns a typed error with code `SCALE_LIMIT_EXCEEDED` and message indicating the 5-apiary limit.
3. GIVEN a user who already owns 100 hives across all apiaries WHEN they execute `createHive` THEN the mutation returns a typed error with code `SCALE_LIMIT_EXCEEDED` and message indicating the 100-hive limit.
4. GIVEN an `updateApiary` mutation WHEN executed by a user who is not the apiary owner THEN the mutation returns an authorization error with code `FORBIDDEN`.
5. GIVEN a `deleteApiary` mutation WHEN executed by the owner THEN the apiary and all associated hives are soft-deleted (setting `deleted_at` timestamp) and no longer appear in list queries.
6. GIVEN an `apiaries` query WHEN executed by an authenticated user THEN only apiaries belonging to that user's tenant are returned (tenant isolation).
7. GIVEN an `apiaries` query that includes nested `hives` WHEN executed THEN hives are loaded efficiently via dataloader pattern (no N+1 queries).
8. GIVEN a validation failure (e.g., empty apiary name) WHEN any mutation is executed THEN the response contains a structured GraphQL error with `code`, `message`, and `retryable` fields in extensions.

## Tasks / Subtasks

- [ ] Write createApiary resolver test: valid input creates record and returns ID (AC: #1)
- [ ] Write apiary scale limit test: 6th apiary creation returns SCALE_LIMIT_EXCEEDED error (AC: #2)
- [ ] Write hive scale limit test: 101st hive creation returns SCALE_LIMIT_EXCEEDED error (AC: #3)
- [ ] Write updateApiary authorization test: non-owner receives FORBIDDEN error (AC: #4)
- [ ] Write deleteApiary soft-delete test: apiary and hives get deleted_at set, excluded from list queries (AC: #5)
- [ ] Write tenant isolation test: user A cannot see user B's apiaries (AC: #6)
- [ ] Write dataloader test: nested hives query executes batch load, not N+1 individual queries (AC: #7)
- [ ] Write validation error test: empty apiary name returns structured error with code and retryable fields (AC: #8)
- [ ] Implement sqlc queries for apiary CRUD in `apps/api/internal/repository/` (AC: #1, #5, #6)
  - [ ] `CreateApiary` query
  - [ ] `GetApiaryByID` query with `WHERE deleted_at IS NULL AND tenant_id = $1`
  - [ ] `ListApiariesByTenant` query with `WHERE deleted_at IS NULL AND tenant_id = $1`
  - [ ] `UpdateApiary` query with ownership check
  - [ ] `SoftDeleteApiary` query setting `deleted_at = NOW()`
  - [ ] `CountApiariesByTenant` query for scale limit check
- [ ] Implement sqlc queries for hive CRUD in `apps/api/internal/repository/` (AC: #1, #3)
  - [ ] `CreateHive` query
  - [ ] `GetHiveByID` query with tenant isolation
  - [ ] `ListHivesByApiary` query with `WHERE deleted_at IS NULL`
  - [ ] `ListHivesByTenantBatch` query for dataloader (AC: #7)
  - [ ] `UpdateHive` query with ownership check
  - [ ] `SoftDeleteHive` query
  - [ ] `SoftDeleteHivesByApiary` query for cascade delete
  - [ ] `CountHivesByTenant` query for scale limit check
- [ ] Implement apiary service in `apps/api/internal/service/apiary.go` (AC: #1, #2, #4, #5)
  - [ ] Create with scale limit enforcement
  - [ ] Update with ownership verification
  - [ ] Delete with cascade soft-delete
- [ ] Implement hive service in `apps/api/internal/service/hive.go` (AC: #1, #3)
  - [ ] Create with scale limit enforcement
  - [ ] Update with ownership verification
  - [ ] Delete with soft-delete
- [ ] Implement hive dataloader in `apps/api/graph/resolver/dataloader.go` (AC: #7)
- [ ] Implement apiary resolvers in `apps/api/graph/resolver/apiary.go` (AC: #1, #2, #4, #5, #6, #8)
- [ ] Implement hive resolvers in `apps/api/graph/resolver/hive.go` (AC: #1, #3, #8)
- [ ] Implement structured error builder for domain errors (AC: #8)

## Dev Notes

### Architecture Compliance
- All database queries MUST include `WHERE tenant_id = $1` — enforced by repository interface signatures per architecture.md
- Authorization checks occur at the resolver/handler level before any data access per RBAC model
- Soft-delete pattern: set `deleted_at` timestamp, filter with `WHERE deleted_at IS NULL` in all read queries
- Scale limits (5 apiaries, 100 hives per account) are from NFR17a
- Dataloader pattern prevents N+1 queries on nested GraphQL field resolution
- Errors use GraphQL error extensions with `code`, `message`, `retryable` — not custom union types

### TDD Requirements (Tests First!)
- Test 1: **Create apiary** — Use testcontainers-go with PostgreSQL. Insert via resolver, assert returned record has UUID and matches input.
- Test 2: **Scale limit (apiary)** — Seed 5 apiaries for a tenant. Attempt 6th. Assert error code `SCALE_LIMIT_EXCEEDED`.
- Test 3: **Scale limit (hive)** — Seed 100 hives for a tenant. Attempt 101st. Assert error code `SCALE_LIMIT_EXCEEDED`.
- Test 4: **Authorization** — Attempt update with different tenant_id. Assert error code `FORBIDDEN`.
- Test 5: **Soft delete cascade** — Delete apiary. Assert apiary and child hives have `deleted_at` set. Assert list query excludes them.
- Test 6: **Tenant isolation** — Create apiaries for tenant A and B. Query as tenant A. Assert only A's apiaries returned.
- Test 7: **Dataloader** — Query 3 apiaries with nested hives. Assert exactly 1 batch SQL query for hives (not 3).
- Test 8: **Validation error** — Submit createApiary with empty name. Assert error extensions contain `code` and `retryable`.

### Technical Specifications
- **sqlc:** 1.27.x for type-safe SQL generation
- **pgx:** v5 as PostgreSQL driver
- **Scale limits:** 5 apiaries per account, 100 hives per account (NFR17a)
- **Soft-delete column:** `deleted_at TIMESTAMPTZ NULL`
- **Tenant isolation:** every query includes `tenant_id` parameter
- **UUID generation:** `google/uuid` v7 (time-ordered)
- **Dataloader:** `graph-gophers/dataloader/v7` or equivalent batch-loading library
- **Error codes:** `SCALE_LIMIT_EXCEEDED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`
- **Testing:** `stretchr/testify` + `testcontainers-go` for integration tests with real PostgreSQL

### Anti-Patterns to Avoid
- DO NOT write raw SQL in resolvers — all queries go through sqlc-generated repository functions
- DO NOT skip tenant_id in any query — this is the primary tenant isolation mechanism
- DO NOT hard-delete records — use soft-delete with `deleted_at` timestamp
- DO NOT check authorization inside the repository layer — authorization happens at resolver/service level
- DO NOT load hives individually per apiary in nested queries — use dataloader for batch loading
- DO NOT return generic error messages — use typed error codes that the client can match on
- DO NOT skip scale limit checks — they must be enforced before the insert, not after

### Project Structure Notes
- Repository queries: `apps/api/internal/repository/` (sqlc-generated)
- SQL query files: `apps/api/internal/repository/queries/`
- Service layer: `apps/api/internal/service/apiary.go`, `apps/api/internal/service/hive.go`
- Resolvers: `apps/api/graph/resolver/apiary.go`, `apps/api/graph/resolver/hive.go`
- Dataloader: `apps/api/graph/resolver/dataloader.go`
- sqlc config: `apps/api/sqlc.yaml`

### References
- [Source: architecture.md#Data Architecture — Authorization model]
- [Source: architecture.md#Authentication & Security — Authorization]
- [Source: architecture.md#API & Communication Patterns — Error handling]
- [Source: architecture.md#Key Go Package Recommendations — sqlc, pgx, testify, testcontainers]
- [Source: epics.md#Story 4.2 — Apiary and Hive CRUD Resolvers]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
