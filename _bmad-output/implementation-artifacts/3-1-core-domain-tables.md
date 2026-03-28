# Story 3.1: Core Domain Tables — Users, Apiaries, Hives

Status: ready-for-dev

## Story

As a developer,
I want the foundational database tables for users, apiaries, and hives with proper constraints, indexes, and tenant isolation,
so that all CRUD operations have a reliable, type-safe data layer enforcing multi-tenant authorization at the query level.

## Acceptance Criteria (BDD)

1. GIVEN an empty PostgreSQL 16 database WHEN I run all migrations via `golang-migrate` THEN they apply cleanly without errors and the `schema_migrations` table reflects the correct version.
2. GIVEN migrations have already been applied WHEN I run `golang-migrate up` again THEN no error occurs and no duplicate objects are created (idempotent forward-only).
3. GIVEN a `users` table WHEN I insert a record THEN `id` is a UUID v7, `firebase_uid` and `email` have unique constraints, and `created_at`/`updated_at` default to `now()`.
4. GIVEN a `users` table WHEN I attempt to insert a duplicate `firebase_uid` THEN a unique constraint violation is raised.
5. GIVEN an `apiaries` table WHEN I insert a record referencing a non-existent `user_id` THEN a foreign key violation is raised.
6. GIVEN a `hives` table WHEN I insert a record referencing a non-existent `apiary_id` THEN a foreign key violation is raised.
7. GIVEN a `hives` table WHEN I insert two hives with the same `name` in the same apiary THEN a unique constraint violation is raised.
8. GIVEN a `hives` table WHEN I insert two hives with the same `name` in different apiaries THEN both inserts succeed.
9. GIVEN sqlc configuration and query files WHEN I run `sqlc generate` THEN Go code compiles and type-checks with `go vet ./...`.
10. GIVEN any generated sqlc query WHEN I inspect its SQL THEN it includes a `WHERE user_id = $1` or equivalent tenant-scoped parameter (no unscoped reads).
11. GIVEN the `users` table WHEN I set `deleted_at` to a timestamp THEN subsequent tenant-scoped queries exclude that user (soft delete).
12. GIVEN the `apiaries` table WHEN I query by `user_id` THEN an index on `user_id` is used (verified via `EXPLAIN`).

## Tasks / Subtasks

- [ ] Create migration `000001_create_extensions.up.sql` enabling required extensions (AC: #1)
  - [ ] Enable `uuid-ossp` extension (for UUID generation fallback)
  - [ ] Enable `pgvector` extension (needed in Story 3.5 but best enabled early)
  - [ ] Enable `pg_trgm` extension (for future text search)
- [ ] Create migration `000002_create_users_table.up.sql` (AC: #1, #3, #4, #11)
  - [ ] Define `users` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `firebase_uid VARCHAR(128) NOT NULL UNIQUE`, `email VARCHAR(255) NOT NULL UNIQUE`, `display_name VARCHAR(255) NOT NULL`, `experience_level VARCHAR(50) NOT NULL DEFAULT 'newbie'`, `region VARCHAR(100)`, `timezone VARCHAR(50)`, `locale VARCHAR(10)`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `deleted_at TIMESTAMPTZ`
  - [ ] Add index `idx_users_firebase_uid` on `firebase_uid`
  - [ ] Add index `idx_users_email` on `email`
  - [ ] Add CHECK constraint on `experience_level` for allowed values: `newbie`, `amateur`, `sideliner`, `hobbyist`, `commercial`
  - [ ] Add trigger `set_updated_at` to auto-update `updated_at` on row modification
- [ ] Create migration `000003_create_apiaries_table.up.sql` (AC: #1, #5, #12)
  - [ ] Define `apiaries` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES users(id)`, `name VARCHAR(255) NOT NULL`, `latitude DOUBLE PRECISION`, `longitude DOUBLE PRECISION`, `region VARCHAR(100)`, `elevation_offset DOUBLE PRECISION DEFAULT 0`, `bloom_offset INTEGER DEFAULT 0`, `notes TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add index `idx_apiaries_user_id` on `user_id`
  - [ ] Add UNIQUE constraint on `(user_id, name)` — no duplicate apiary names per user
  - [ ] Attach `set_updated_at` trigger
- [ ] Create migration `000004_create_hives_table.up.sql` (AC: #1, #6, #7, #8)
  - [ ] Define `hives` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `apiary_id UUID NOT NULL REFERENCES apiaries(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `name VARCHAR(255) NOT NULL`, `type VARCHAR(50) NOT NULL DEFAULT 'langstroth'`, `status VARCHAR(50) NOT NULL DEFAULT 'active'`, `notes TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add UNIQUE constraint on `(apiary_id, name)` — no duplicate hive names within apiary
  - [ ] Add index `idx_hives_apiary_id` on `apiary_id`
  - [ ] Add index `idx_hives_user_id` on `user_id`
  - [ ] Add CHECK constraint on `type` for allowed values: `langstroth`, `top_bar`, `warre`, `flow`, `other`
  - [ ] Add CHECK constraint on `status` for allowed values: `active`, `inactive`, `dead`, `sold`, `combined`
  - [ ] Attach `set_updated_at` trigger
- [ ] Create shared trigger function migration `000001b_create_trigger_functions.up.sql` (before table migrations) (AC: #1)
  - [ ] Define `trigger_set_updated_at()` function that sets `updated_at = now()` on UPDATE
- [ ] Write sqlc query file `apps/api/internal/repository/queries/users.sql` (AC: #9, #10)
  - [ ] `CreateUser` — INSERT with all fields, RETURNING full row
  - [ ] `GetUserByID` — SELECT WHERE `id = $1` (tenant-scoped by caller context)
  - [ ] `GetUserByFirebaseUID` — SELECT WHERE `firebase_uid = $1`
  - [ ] `UpdateUser` — UPDATE SET fields WHERE `id = $1`
  - [ ] `SoftDeleteUser` — UPDATE SET `deleted_at = now()` WHERE `id = $1`
  - [ ] `ListActiveUsers` — SELECT WHERE `deleted_at IS NULL` (admin only, still parameterized)
- [ ] Write sqlc query file `apps/api/internal/repository/queries/apiaries.sql` (AC: #9, #10)
  - [ ] `CreateApiary` — INSERT RETURNING full row
  - [ ] `GetApiaryByID` — SELECT WHERE `id = $1 AND user_id = $2`
  - [ ] `ListApiariesByUser` — SELECT WHERE `user_id = $1` ORDER BY `name`
  - [ ] `UpdateApiary` — UPDATE WHERE `id = $1 AND user_id = $2`
  - [ ] `DeleteApiary` — DELETE WHERE `id = $1 AND user_id = $2`
  - [ ] `CountApiariesByUser` — SELECT COUNT WHERE `user_id = $1` (for 5-location limit)
- [ ] Write sqlc query file `apps/api/internal/repository/queries/hives.sql` (AC: #9, #10)
  - [ ] `CreateHive` — INSERT RETURNING full row
  - [ ] `GetHiveByID` — SELECT WHERE `id = $1 AND user_id = $2`
  - [ ] `ListHivesByApiary` — SELECT WHERE `apiary_id = $1 AND user_id = $2` ORDER BY `name`
  - [ ] `ListHivesByUser` — SELECT WHERE `user_id = $1` ORDER BY `apiary_id, name`
  - [ ] `UpdateHive` — UPDATE WHERE `id = $1 AND user_id = $2`
  - [ ] `DeleteHive` — DELETE WHERE `id = $1 AND user_id = $2`
  - [ ] `CountHivesByUser` — SELECT COUNT WHERE `user_id = $1` (for 100-hive limit)
- [ ] Configure `sqlc.yaml` for the queries and migrations (AC: #9)
  - [ ] Set `engine: postgresql`, `sql_package: pgx/v5`
  - [ ] Map query directory and migration directory
  - [ ] Run `sqlc generate` and verify output compiles
- [ ] Write migration integration tests using testcontainers-go (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [ ] Test: migrations apply to empty PostgreSQL container without error
  - [ ] Test: re-running `up` is idempotent
  - [ ] Test: `users` unique constraints on `firebase_uid` and `email`
  - [ ] Test: `apiaries` foreign key on `user_id`
  - [ ] Test: `hives` foreign key on `apiary_id`
  - [ ] Test: `hives` unique constraint on `(apiary_id, name)`
  - [ ] Test: `hives` allows same name across different apiaries
  - [ ] Test: `updated_at` trigger fires on UPDATE
- [ ] Write sqlc-generated repository unit tests (AC: #9, #10, #11, #12)
  - [ ] Test: CRUD operations on users, apiaries, hives succeed with valid data
  - [ ] Test: tenant isolation — GetApiaryByID with wrong `user_id` returns no rows
  - [ ] Test: soft delete — SoftDeleteUser sets `deleted_at`, subsequent queries exclude
  - [ ] Test: CountApiariesByUser returns correct count

## Dev Notes

### Architecture Compliance

- All tables use UUID primary keys (architecture.md: "API IDs are opaque UUID strings").
- All queries enforce tenant isolation via `WHERE user_id = $1` parameter (architecture.md: "All database queries include `WHERE tenant_id = $1` as a mandatory parameter").
- Timestamps are `TIMESTAMPTZ` stored in UTC (architecture.md: "API timestamps are ISO-8601 UTC strings").
- Naming follows snake_case for all database objects (architecture.md: "Database: snake_case table/column names").
- Foreign keys named as `<entity>_id` (architecture.md: "foreign keys as `<entity>_id`").
- Indexes named as `idx_<table>_<columns>` (architecture.md: "indexes as `idx_<table>_<columns>`").

### TDD Requirements (Tests First!)

Write ALL tests before implementing migrations and queries:

1. **Migration tests** (testcontainers-go + golang-migrate):
   - Spin up a PostgreSQL 16 container with pgvector.
   - Apply all migrations, assert no errors.
   - Reapply migrations, assert idempotency.
   - Test each constraint (FK, UNIQUE, CHECK) by attempting violating INSERTs.
   - Test `updated_at` trigger by inserting, updating, and asserting timestamp changed.

2. **Repository tests** (testcontainers-go + sqlc-generated code):
   - Test every sqlc-generated function against a real PostgreSQL container.
   - Verify tenant scoping: queries with wrong `user_id` return empty results.
   - Verify soft delete behavior.
   - Verify count queries for business rule limits.

3. **Compile-time verification**:
   - `sqlc generate` produces code that passes `go vet ./...`.
   - All generated types match expected column types.

### Technical Specifications

- **PostgreSQL version:** 16 with pgvector extension.
- **Migration tool:** `golang-migrate` — forward-only in production. Files: `NNNNNN_description.up.sql`.
- **SQL code gen:** `sqlc` with `pgx/v5` driver. Config in `apps/api/sqlc.yaml`.
- **UUID generation:** `gen_random_uuid()` (PostgreSQL built-in, no extension needed for v4; consider UUID v7 via application layer for time-ordering).
- **Trigger function:** shared `trigger_set_updated_at()` used across all tables with `updated_at`.
- **Hive `user_id`:** denormalized from apiary for direct tenant-scoped queries without joins. Must be kept in sync via application logic or trigger.

### Anti-Patterns to Avoid

- **NO** Row-Level Security (RLS) — authorization is application-level per architecture decision.
- **NO** down migrations in production — forward-only migration strategy.
- **NO** unscoped queries — every SELECT must include tenant parameter.
- **NO** `SERIAL`/`BIGSERIAL` primary keys — UUIDs only.
- **NO** `VARCHAR` without length limits on user-facing text fields.
- **NO** raw SQL in application code — all queries go through sqlc-generated functions.
- **NO** `CASCADE DELETE` on hives or apiaries — use application-level soft delete or explicit delete logic.
- **NO** mutable `created_at` — this column must never be updated.

### Project Structure Notes

```
apps/api/
├── migrations/
│   ├── 000001_create_extensions.up.sql
│   ├── 000002_create_trigger_functions.up.sql
│   ├── 000003_create_users_table.up.sql
│   ├── 000004_create_apiaries_table.up.sql
│   └── 000005_create_hives_table.up.sql
├── internal/
│   └── repository/
│       ├── queries/
│       │   ├── users.sql
│       │   ├── apiaries.sql
│       │   └── hives.sql
│       └── db/              # sqlc-generated output
│           ├── db.go
│           ├── models.go
│           ├── users.sql.go
│           ├── apiaries.sql.go
│           └── hives.sql.go
├── sqlc.yaml
└── internal/
    └── repository/
        └── repository_test.go   # Integration tests
```

### References

- Architecture: `/home/donpetry/broodly/_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Naming Patterns
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` — Story 3.1
- FRs: FR3 (apiary management), FR4 (hive management)
- Go packages: `golang-migrate/migrate`, `sqlc-dev/sqlc`, `jackc/pgx` v5, `testcontainers/testcontainers-go`, `stretchr/testify`

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
