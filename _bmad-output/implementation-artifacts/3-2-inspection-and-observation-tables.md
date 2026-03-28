# Story 3.2: Inspection, Observation, and Media Tables

Status: ready-for-dev

## Story

As a developer,
I want tables for inspections, observations, and media attachments with proper relationships, ordering, and JSONB flexibility,
so that the guided inspection flow can persist structured records with voice transcriptions and photo analysis results.

## Acceptance Criteria (BDD)

1. GIVEN the migrations from Story 3.1 have been applied WHEN I run the Story 3.2 migrations THEN they apply cleanly without errors.
2. GIVEN an `inspections` table WHEN I insert a record referencing a non-existent `hive_id` THEN a foreign key violation is raised.
3. GIVEN an `inspections` table WHEN I insert a record THEN `status` defaults to `in_progress` and `started_at` defaults to `now()`.
4. GIVEN an `observations` table WHEN I insert a record referencing a non-existent `inspection_id` THEN a foreign key violation is raised.
5. GIVEN an `observations` table WHEN I insert two records with the same `inspection_id` and different `sequence_order` values THEN both inserts succeed and ordering is preserved on retrieval.
6. GIVEN an `observations` table WHEN I insert two records with the same `(inspection_id, sequence_order)` THEN a unique constraint violation is raised.
7. GIVEN a `media` table WHEN I insert a record with a valid `observation_id`, `storage_path`, and `content_type` THEN the insert succeeds and `analysis_status` defaults to `pending`.
8. GIVEN an inspection with related observations and media WHEN I update the inspection's `status` to `completed` and set `deleted_at` THEN observations and media are still queryable for audit (soft delete does not cascade).
9. GIVEN sqlc query files for inspections, observations, and media WHEN I run `sqlc generate` THEN Go code compiles without errors and includes correct JSONB mapping types.
10. GIVEN any generated inspection/observation query WHEN I inspect its SQL THEN it includes `WHERE user_id = $1` tenant scoping.

## Tasks / Subtasks

- [ ] Create migration `000006_create_inspections_table.up.sql` (AC: #1, #2, #3)
  - [ ] Define `inspections` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `hive_id UUID NOT NULL REFERENCES hives(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `type VARCHAR(20) NOT NULL DEFAULT 'full'`, `status VARCHAR(20) NOT NULL DEFAULT 'in_progress'`, `started_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `completed_at TIMESTAMPTZ`, `paused_at TIMESTAMPTZ`, `notes TEXT`, `weather_snapshot JSONB`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `deleted_at TIMESTAMPTZ`
  - [ ] Add CHECK constraint on `type`: `full`, `quick`, `treatment`, `feeding`
  - [ ] Add CHECK constraint on `status`: `in_progress`, `paused`, `completed`, `abandoned`
  - [ ] Add index `idx_inspections_hive_id` on `hive_id`
  - [ ] Add index `idx_inspections_user_id` on `user_id`
  - [ ] Add index `idx_inspections_user_id_started_at` on `(user_id, started_at DESC)` for recent inspections query
  - [ ] Add index `idx_inspections_hive_id_started_at` on `(hive_id, started_at DESC)` for hive history query
  - [ ] Attach `set_updated_at` trigger
- [ ] Create migration `000007_create_observations_table.up.sql` (AC: #1, #4, #5, #6)
  - [ ] Define `observations` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `inspection_id UUID NOT NULL REFERENCES inspections(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `sequence_order INTEGER NOT NULL`, `observation_type VARCHAR(50) NOT NULL`, `structured_data JSONB NOT NULL DEFAULT '{}'::jsonb`, `raw_voice_url TEXT`, `transcription TEXT`, `transcription_confidence DOUBLE PRECISION`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add UNIQUE constraint on `(inspection_id, sequence_order)`
  - [ ] Add CHECK constraint on `observation_type`: `queen_status`, `brood_pattern`, `food_stores`, `pest_disease`, `population`, `temperament`, `equipment`, `treatment`, `general_note`, `voice_note`
  - [ ] Add CHECK constraint on `transcription_confidence`: `0.0 <= value <= 1.0` (or NULL)
  - [ ] Add index `idx_observations_inspection_id` on `inspection_id`
  - [ ] Add index `idx_observations_user_id` on `user_id`
  - [ ] Attach `set_updated_at` trigger
- [ ] Create migration `000008_create_media_table.up.sql` (AC: #1, #7)
  - [ ] Define `media` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `observation_id UUID NOT NULL REFERENCES observations(id)`, `user_id UUID NOT NULL REFERENCES users(id)`, `storage_path TEXT NOT NULL`, `content_type VARCHAR(100) NOT NULL`, `file_size_bytes BIGINT`, `analysis_status VARCHAR(20) NOT NULL DEFAULT 'pending'`, `analysis_result JSONB`, `embedding_id UUID`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `analysis_status`: `pending`, `processing`, `completed`, `failed`
  - [ ] Add CHECK constraint on `content_type` starts with `image/`, `audio/`, or `video/`
  - [ ] Add index `idx_media_observation_id` on `observation_id`
  - [ ] Add index `idx_media_user_id` on `user_id`
  - [ ] Add index `idx_media_analysis_status` on `analysis_status` (for worker queue queries)
  - [ ] Attach `set_updated_at` trigger
- [ ] Write sqlc query file `apps/api/internal/repository/queries/inspections.sql` (AC: #9, #10)
  - [ ] `CreateInspection` — INSERT RETURNING full row
  - [ ] `GetInspectionByID` — SELECT WHERE `id = $1 AND user_id = $2`
  - [ ] `ListInspectionsByHive` — SELECT WHERE `hive_id = $1 AND user_id = $2` ORDER BY `started_at DESC`
  - [ ] `ListRecentInspectionsByUser` — SELECT WHERE `user_id = $1 AND deleted_at IS NULL` ORDER BY `started_at DESC` LIMIT $2
  - [ ] `UpdateInspectionStatus` — UPDATE `status`, `completed_at`/`paused_at` WHERE `id = $1 AND user_id = $2`
  - [ ] `UpdateInspectionNotes` — UPDATE `notes` WHERE `id = $1 AND user_id = $2`
  - [ ] `SoftDeleteInspection` — UPDATE SET `deleted_at = now()` WHERE `id = $1 AND user_id = $2`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/observations.sql` (AC: #9, #10)
  - [ ] `CreateObservation` — INSERT RETURNING full row
  - [ ] `GetObservationByID` — SELECT WHERE `id = $1 AND user_id = $2`
  - [ ] `ListObservationsByInspection` — SELECT WHERE `inspection_id = $1 AND user_id = $2` ORDER BY `sequence_order ASC`
  - [ ] `UpdateObservationStructuredData` — UPDATE `structured_data` WHERE `id = $1 AND user_id = $2`
  - [ ] `UpdateObservationTranscription` — UPDATE `transcription`, `transcription_confidence` WHERE `id = $1 AND user_id = $2`
  - [ ] `GetNextSequenceOrder` — SELECT COALESCE(MAX(sequence_order), 0) + 1 WHERE `inspection_id = $1`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/media.sql` (AC: #9, #10)
  - [ ] `CreateMedia` — INSERT RETURNING full row
  - [ ] `GetMediaByID` — SELECT WHERE `id = $1 AND user_id = $2`
  - [ ] `ListMediaByObservation` — SELECT WHERE `observation_id = $1 AND user_id = $2`
  - [ ] `UpdateMediaAnalysisStatus` — UPDATE `analysis_status`, `analysis_result` WHERE `id = $1 AND user_id = $2`
  - [ ] `ListPendingMedia` — SELECT WHERE `analysis_status = 'pending'` ORDER BY `created_at ASC` LIMIT $1 (worker queue)
  - [ ] `SetMediaEmbeddingID` — UPDATE `embedding_id` WHERE `id = $1 AND user_id = $2`
- [ ] Run `sqlc generate` and verify compilation (AC: #9)
- [ ] Write migration integration tests using testcontainers-go (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [ ] Test: Story 3.2 migrations apply after Story 3.1 migrations
  - [ ] Test: `inspections` FK constraint on `hive_id`
  - [ ] Test: `inspections` default status is `in_progress`
  - [ ] Test: `observations` FK constraint on `inspection_id`
  - [ ] Test: `observations` unique constraint on `(inspection_id, sequence_order)`
  - [ ] Test: `observations` allows different sequence orders within same inspection
  - [ ] Test: `media` default `analysis_status` is `pending`
  - [ ] Test: `media` CHECK constraint rejects invalid `content_type`
- [ ] Write sqlc-generated repository integration tests (AC: #9, #10)
  - [ ] Test: full inspection lifecycle — create inspection, add observations, attach media
  - [ ] Test: observations retrieved in `sequence_order`
  - [ ] Test: tenant isolation — queries with wrong `user_id` return no rows
  - [ ] Test: JSONB `structured_data` stores and retrieves correctly
  - [ ] Test: `ListPendingMedia` returns only pending items ordered by creation

## Dev Notes

### Architecture Compliance

- JSONB for `structured_data` allows schema evolution without migrations (architecture.md: "JSONB for flexible structured_data allows schema evolution without migration").
- `raw_voice_url` points to Cloud Storage path (architecture.md: "Voice URL points to Cloud Storage").
- `weather_snapshot` on inspections captures conditions at inspection time for recommendation traceability.
- All queries enforce `WHERE user_id = $1` tenant scoping.
- `user_id` denormalized onto observations and media for direct tenant-scoped queries without joins.

### TDD Requirements (Tests First!)

Write ALL tests before implementing migrations and queries:

1. **Migration dependency tests**:
   - Confirm Story 3.1 migrations are prerequisite — apply 3.1 first, then 3.2.
   - Validate all FK relationships across table boundaries.

2. **Constraint tests**:
   - Every CHECK, UNIQUE, and FK constraint must have a dedicated test attempting a violation.
   - Test `sequence_order` uniqueness within inspection but not across inspections.

3. **JSONB handling tests**:
   - Verify `structured_data` round-trips complex nested JSON.
   - Verify `analysis_result` can store Vision AI response structures.
   - Test with empty JSONB `{}` default.

4. **Repository tests**:
   - Full lifecycle: create inspection -> add observations in order -> attach media -> update analysis status.
   - Verify ordering is preserved.
   - Verify tenant isolation on every query.

### Technical Specifications

- **JSONB columns**: `structured_data` (observations), `weather_snapshot` (inspections), `analysis_result` (media). These use JSONB for schema flexibility.
- **Content types**: constrained to `image/*`, `audio/*`, `video/*` patterns.
- **Soft delete**: inspections have `deleted_at` for soft delete; observations and media do not cascade-delete.
- **Analysis pipeline**: `analysis_status` tracks the Vision AI / STT processing state for worker queue queries.
- **Embedding link**: `media.embedding_id` is a forward reference to the embeddings table (Story 3.5). Nullable until embedding is generated.

### Anti-Patterns to Avoid

- **NO** CASCADE DELETE — soft delete on inspections; observations/media preserved for audit trail.
- **NO** storing media file content in the database — only Cloud Storage paths.
- **NO** unbounded `structured_data` without application-level validation — the GraphQL layer validates before persistence.
- **NO** auto-incrementing `sequence_order` via database sequence — managed by application logic to support reordering.
- **NO** queries without tenant scoping — even `ListPendingMedia` for workers should be reviewed for multi-tenant safety.

### Project Structure Notes

```
apps/api/
├── migrations/
│   ├── 000006_create_inspections_table.up.sql
│   ├── 000007_create_observations_table.up.sql
│   └── 000008_create_media_table.up.sql
├── internal/
│   └── repository/
│       ├── queries/
│       │   ├── inspections.sql
│       │   ├── observations.sql
│       │   └── media.sql
│       └── db/              # sqlc-generated output
│           ├── inspections.sql.go
│           ├── observations.sql.go
│           └── media.sql.go
```

### References

- Architecture: `/home/donpetry/broodly/_bmad-output/planning-artifacts/architecture.md` — Data Architecture, Vision AI pipeline, Voice Architecture
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` — Story 3.2
- FRs: FR27 (inspection start), FR28 (observation capture), FR29 (voice logging), FR30 (photo capture), FR31 (inspection completion)
- Depends on: Story 3.1 (users, apiaries, hives tables)

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
