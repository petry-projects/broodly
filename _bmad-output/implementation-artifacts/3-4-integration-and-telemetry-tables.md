# Story 3.4: Integration, Telemetry, and External Context Tables

Status: ready-for-dev

## Story

As a developer,
I want tables for integration connections, telemetry readings, and external context cache,
so that weather, flora, and sensor data can be stored, tracked for freshness, and linked to recommendation context assembly.

## Acceptance Criteria (BDD)

1. GIVEN the migrations from Stories 3.1-3.3 have been applied WHEN I run the Story 3.4 migrations THEN they apply cleanly without errors.
2. GIVEN an `integrations` table WHEN I insert a record THEN it tracks `provider`, `status`, `credentials_ref` (Secret Manager path), and `last_sync_at`.
3. GIVEN an `integrations` table WHEN I insert a record referencing a non-existent `user_id` THEN a foreign key violation is raised.
4. GIVEN a `telemetry_readings` table WHEN I insert a record THEN it links to a specific `hive_id` and `integration_id` with `recorded_at` timestamp.
5. GIVEN a `telemetry_readings` table WHEN I insert a record with `plausibility_status` value not in the allowed set THEN a CHECK constraint violation is raised.
6. GIVEN a `telemetry_readings` table WHEN I query by `(hive_id, recorded_at)` THEN the composite index is used for efficient time-series retrieval (verified via EXPLAIN).
7. GIVEN an `external_context` table WHEN I insert a record with `source_type`, `data` JSONB, `fetched_at`, and `staleness_threshold_hours` THEN the insert succeeds.
8. GIVEN an `external_context` table with records WHEN I run a staleness check query THEN records where `fetched_at + staleness_threshold_hours < now()` are correctly identified as stale.
9. GIVEN sqlc query files for integrations, telemetry, and external context WHEN I run `sqlc generate` THEN Go code compiles without errors.
10. GIVEN any generated query WHEN I inspect its SQL THEN it includes tenant scoping via `user_id` or is explicitly documented as a worker-only query.

## Tasks / Subtasks

- [ ] Create migration `000013_create_integrations_table.up.sql` (AC: #1, #2, #3)
  - [ ] Define `integrations` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES users(id)`, `provider VARCHAR(50) NOT NULL`, `provider_account_id VARCHAR(255)`, `credentials_ref TEXT`, `status VARCHAR(20) NOT NULL DEFAULT 'active'`, `hive_mappings JSONB NOT NULL DEFAULT '[]'::jsonb`, `config JSONB NOT NULL DEFAULT '{}'::jsonb`, `last_sync_at TIMESTAMPTZ`, `last_sync_error TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `provider`: `broodminder`, `arnia`, `hive_tracks`, `openweather`, `weatherapi`, `manual`
  - [ ] Add CHECK constraint on `status`: `active`, `inactive`, `error`, `revoked`
  - [ ] Add UNIQUE constraint on `(user_id, provider, provider_account_id)` — prevent duplicate connections
  - [ ] Add index `idx_integrations_user_id` on `user_id`
  - [ ] Add index `idx_integrations_status` on `status` (for sync worker queries)
  - [ ] Attach `set_updated_at` trigger
- [ ] Create migration `000014_create_telemetry_readings_table.up.sql` (AC: #1, #4, #5, #6)
  - [ ] Define `telemetry_readings` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `integration_id UUID NOT NULL REFERENCES integrations(id)`, `hive_id UUID NOT NULL REFERENCES hives(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `reading_type VARCHAR(50) NOT NULL`, `value DOUBLE PRECISION NOT NULL`, `unit VARCHAR(20) NOT NULL`, `recorded_at TIMESTAMPTZ NOT NULL`, `ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `plausibility_status VARCHAR(20) NOT NULL DEFAULT 'unconfirmed'`, `plausibility_notes TEXT`
  - [ ] Add CHECK constraint on `reading_type`: `temperature`, `humidity`, `weight`, `sound_level`, `vibration`, `battery`, `light`
  - [ ] Add CHECK constraint on `plausibility_status`: `confirmed`, `unconfirmed`, `anomalous`
  - [ ] Add CHECK constraint on `unit`: `celsius`, `fahrenheit`, `percent`, `kg`, `lbs`, `db`, `g`, `lux`, `volts`
  - [ ] Add index `idx_telemetry_hive_id_recorded_at` on `(hive_id, recorded_at DESC)` — primary time-series query
  - [ ] Add index `idx_telemetry_user_id` on `user_id`
  - [ ] Add index `idx_telemetry_integration_id` on `integration_id`
  - [ ] Add index `idx_telemetry_recorded_at` on `recorded_at` (for partition-ready queries)
  - [ ] Add comment noting future `PARTITION BY RANGE (recorded_at)` by month
- [ ] Create migration `000015_create_external_context_table.up.sql` (AC: #1, #7, #8)
  - [ ] Define `external_context` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `apiary_id UUID NOT NULL REFERENCES apiaries(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `source_type VARCHAR(30) NOT NULL`, `source_provider VARCHAR(50)`, `data JSONB NOT NULL DEFAULT '{}'::jsonb`, `source_distance_km DOUBLE PRECISION`, `fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `staleness_threshold_hours INTEGER NOT NULL DEFAULT 24`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `source_type`: `weather`, `flora`, `seasonal`, `regional_baseline`
  - [ ] Add CHECK constraint on `staleness_threshold_hours > 0`
  - [ ] Add UNIQUE constraint on `(apiary_id, source_type, source_provider)` — one record per source per apiary (upsert pattern)
  - [ ] Add index `idx_external_context_apiary_id` on `apiary_id`
  - [ ] Add index `idx_external_context_user_id` on `user_id`
  - [ ] Attach `set_updated_at` trigger
- [ ] Write sqlc query file `apps/api/internal/repository/queries/integrations.sql` (AC: #9, #10)
  - [ ] `CreateIntegration` — INSERT RETURNING full row
  - [ ] `GetIntegrationByID` — SELECT WHERE `id = $1 AND user_id = $2`
  - [ ] `ListIntegrationsByUser` — SELECT WHERE `user_id = $1` ORDER BY `provider`
  - [ ] `UpdateIntegrationStatus` — UPDATE `status`, `last_sync_at`, `last_sync_error` WHERE `id = $1 AND user_id = $2`
  - [ ] `UpdateIntegrationHiveMappings` — UPDATE `hive_mappings` WHERE `id = $1 AND user_id = $2`
  - [ ] `DeleteIntegration` — DELETE WHERE `id = $1 AND user_id = $2`
  - [ ] `ListActiveIntegrationsForSync` — SELECT WHERE `status = 'active'` ORDER BY `last_sync_at ASC NULLS FIRST` (worker query — documented as cross-tenant)
- [ ] Write sqlc query file `apps/api/internal/repository/queries/telemetry_readings.sql` (AC: #9, #10)
  - [ ] `CreateTelemetryReading` — INSERT RETURNING full row
  - [ ] `BatchCreateTelemetryReadings` — INSERT multiple rows (for bulk ingestion)
  - [ ] `ListReadingsByHive` — SELECT WHERE `hive_id = $1 AND user_id = $2 AND recorded_at BETWEEN $3 AND $4` ORDER BY `recorded_at DESC`
  - [ ] `ListReadingsByHiveAndType` — SELECT WHERE `hive_id = $1 AND user_id = $2 AND reading_type = $3 AND recorded_at BETWEEN $4 AND $5` ORDER BY `recorded_at DESC`
  - [ ] `GetLatestReadingByHiveAndType` — SELECT WHERE `hive_id = $1 AND user_id = $2 AND reading_type = $3` ORDER BY `recorded_at DESC` LIMIT 1
  - [ ] `ListAnomalousReadings` — SELECT WHERE `user_id = $1 AND plausibility_status = 'anomalous'` ORDER BY `recorded_at DESC` LIMIT $2
  - [ ] `UpdatePlausibilityStatus` — UPDATE `plausibility_status`, `plausibility_notes` WHERE `id = $1 AND user_id = $2`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/external_context.sql` (AC: #9, #10)
  - [ ] `UpsertExternalContext` — INSERT ON CONFLICT (apiary_id, source_type, source_provider) DO UPDATE
  - [ ] `GetExternalContext` — SELECT WHERE `apiary_id = $1 AND user_id = $2 AND source_type = $3`
  - [ ] `ListExternalContextByApiary` — SELECT WHERE `apiary_id = $1 AND user_id = $2`
  - [ ] `ListStaleContexts` — SELECT WHERE `user_id = $1 AND fetched_at + (staleness_threshold_hours || ' hours')::interval < now()`
  - [ ] `ListAllStaleContextsForRefresh` — SELECT WHERE `fetched_at + (staleness_threshold_hours || ' hours')::interval < now()` ORDER BY `fetched_at ASC` LIMIT $1 (worker query — documented as cross-tenant)
- [ ] Run `sqlc generate` and verify compilation (AC: #9)
- [ ] Write migration integration tests using testcontainers-go (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [ ] Test: Story 3.4 migrations apply after Stories 3.1-3.3
  - [ ] Test: `integrations` FK constraint on `user_id`
  - [ ] Test: `integrations` unique constraint on `(user_id, provider, provider_account_id)`
  - [ ] Test: `integrations` CHECK constraint on `provider` and `status`
  - [ ] Test: `telemetry_readings` FK constraints on `integration_id` and `hive_id`
  - [ ] Test: `telemetry_readings` CHECK constraint on `plausibility_status`
  - [ ] Test: `telemetry_readings` CHECK constraint on `reading_type` and `unit`
  - [ ] Test: `external_context` FK constraint on `apiary_id`
  - [ ] Test: `external_context` unique constraint on `(apiary_id, source_type, source_provider)`
  - [ ] Test: `external_context` CHECK constraint on `staleness_threshold_hours > 0`
- [ ] Write sqlc-generated repository integration tests (AC: #6, #8, #9, #10)
  - [ ] Test: full integration lifecycle — create integration, ingest telemetry readings, query by time range
  - [ ] Test: `ListReadingsByHiveAndType` returns correct filtered results
  - [ ] Test: `GetLatestReadingByHiveAndType` returns the most recent reading
  - [ ] Test: `ListAnomalousReadings` returns only anomalous readings
  - [ ] Test: `UpsertExternalContext` inserts on first call, updates on second call for same key
  - [ ] Test: `ListStaleContexts` correctly identifies stale records based on threshold math
  - [ ] Test: `ListStaleContexts` does not return fresh records
  - [ ] Test: tenant isolation on all user-facing queries
  - [ ] Test: `BatchCreateTelemetryReadings` inserts multiple rows atomically

## Dev Notes

### Architecture Compliance

- Integration `credentials_ref` stores a Secret Manager path, never raw credentials (architecture.md: "Secret Manager for credentials and API keys").
- External context `source_distance_km` supports the weather proximity warning contract (architecture.md: "weather adapter shall record and expose the distance between the user's apiary coordinates and the weather data source location").
- Telemetry `plausibility_status` implements FR47a anomaly detection: `confirmed`, `unconfirmed`, `anomalous`.
- External adapters normalize data into canonical internal events (architecture.md: "adapters normalize weather/flora/sensor data into canonical internal events").
- All queries enforce tenant scoping. Worker-only cross-tenant queries are explicitly documented in the sqlc file with `-- worker-only: cross-tenant` comments.

### TDD Requirements (Tests First!)

Write ALL tests before implementing migrations and queries:

1. **Staleness calculation tests** (critical for recommendation quality):
   - Insert external context with `fetched_at = now() - 25 hours` and `staleness_threshold_hours = 24` — must appear in stale list.
   - Insert external context with `fetched_at = now() - 23 hours` and `staleness_threshold_hours = 24` — must NOT appear in stale list.
   - Test boundary: exactly at threshold.
   - Test with different thresholds per record.

2. **Telemetry time-series tests**:
   - Insert readings across a time range, query with date boundaries, verify correct filtering.
   - Verify composite index `(hive_id, recorded_at DESC)` is used via `EXPLAIN`.
   - Test `GetLatestReadingByHiveAndType` with multiple readings of same type.

3. **Upsert tests**:
   - `UpsertExternalContext` — first call inserts, second call with same key updates, verify `data` and `fetched_at` changed.
   - Verify `created_at` is preserved on upsert but `updated_at` changes.

4. **Plausibility tests**:
   - Insert readings with each plausibility status, filter by status, verify results.

### Technical Specifications

- **Telemetry partitioning**: the migration adds a comment for future `PARTITION BY RANGE (recorded_at)` by month. Not implemented in MVP but the composite index on `(hive_id, recorded_at DESC)` handles MVP query volume.
- **Hive mappings JSONB schema** (application-level):
  ```json
  [
    {"external_hive_id": "provider-id-123", "broodly_hive_id": "uuid", "mapped_at": "iso8601"}
  ]
  ```
- **External context JSONB data schema** varies by `source_type`:
  - `weather`: `{"temperature_c": 22.5, "humidity_pct": 65, "wind_kph": 12, "conditions": "partly_cloudy", "forecast_hours": [...]}`
  - `flora`: `{"blooming_species": ["clover", "dandelion"], "nectar_flow": "moderate", "pollen_availability": "high"}`
  - `seasonal`: `{"hemisphere": "north", "season": "spring", "management_phase": "buildup"}`
- **Batch ingestion**: `BatchCreateTelemetryReadings` uses PostgreSQL multi-row INSERT for efficient bulk telemetry ingestion from adapter sync jobs.

### Anti-Patterns to Avoid

- **NO** storing raw API credentials in the database — only Secret Manager reference paths in `credentials_ref`.
- **NO** unbounded telemetry queries — all time-series queries must include date range parameters.
- **NO** deleting old telemetry readings without archival — data retention policy applied at infrastructure level.
- **NO** treating `plausibility_status` as purely informational — `anomalous` readings should have confidence penalties in recommendation context assembly.
- **NO** polling for stale contexts from the client — staleness refresh is a server-side scheduled worker job via Cloud Tasks.

### Project Structure Notes

```
apps/api/
├── migrations/
│   ├── 000013_create_integrations_table.up.sql
│   ├── 000014_create_telemetry_readings_table.up.sql
│   └── 000015_create_external_context_table.up.sql
├── internal/
│   └── repository/
│       ├── queries/
│       │   ├── integrations.sql
│       │   ├── telemetry_readings.sql
│       │   └── external_context.sql
│       └── db/
│           ├── integrations.sql.go
│           ├── telemetry_readings.sql.go
│           └── external_context.sql.go
```

### References

- Architecture: `/home/donpetry/broodly/_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Integration Points, Event Architecture
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` — Story 3.4
- FRs: FR44 (integration connections), FR45 (telemetry dashboard), FR46 (anomaly alerts), FR48a-c (weather/flora/sensor integration)
- Depends on: Story 3.1 (users, apiaries, hives)

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
