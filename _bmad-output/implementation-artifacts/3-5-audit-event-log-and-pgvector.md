# Story 3.5: Skill Progression, Notification Preferences, Treatment Registry, and pgvector Embeddings

Status: ready-for-dev

## Story

As a developer,
I want tables for user skill progression milestones, notification preferences, treatment registry, and a pgvector embeddings store,
so that adaptive guidance is data-driven, notifications are configurable per-apiary, treatment legality is region-aware, and semantic search vectors support the recommendation engine.

## Acceptance Criteria (BDD)

1. GIVEN the migrations from Stories 3.1-3.4 have been applied WHEN I run the Story 3.5 migrations THEN they apply cleanly without errors.
2. GIVEN a `skill_progression` table WHEN I insert a record THEN it tracks `current_level`, `milestones_completed` JSONB, `total_inspections`, and `last_assessed_at`.
3. GIVEN a `skill_progression` table WHEN I insert a record with `current_level` not in the allowed set THEN a CHECK constraint violation is raised.
4. GIVEN a `skill_progression` table WHEN I insert a duplicate record for the same `user_id` THEN a unique constraint violation is raised (one progression record per user).
5. GIVEN a `notification_preferences` table WHEN I insert a record with NULL `apiary_id` THEN it is treated as a global preference for the user.
6. GIVEN a `notification_preferences` table WHEN I insert a record with a specific `apiary_id` THEN it overrides the global preference for that apiary.
7. GIVEN a `treatment_registry` table WHEN the migration completes THEN it is seeded with an initial dataset of common treatments and their regional legal statuses.
8. GIVEN an `embeddings` table WHEN I insert a record with a 1408-dimension vector THEN the insert succeeds and cosine similarity search returns correct nearest neighbors.
9. GIVEN an `embeddings` table WHEN I run a vector similarity query THEN the `ivfflat` or `hnsw` index is used for approximate nearest neighbor search.
10. GIVEN any generated query WHEN I inspect its SQL THEN it includes tenant scoping via `user_id`.
11. GIVEN all Story 3.1-3.5 migrations applied WHEN I run the full migration suite against an empty database THEN all migrations apply in sequence without errors and the final schema matches expectations.

## Tasks / Subtasks

- [ ] Create migration `000016_create_skill_progression_table.up.sql` (AC: #1, #2, #3, #4)
  - [ ] Define `skill_progression` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES users(id) UNIQUE`, `current_level VARCHAR(20) NOT NULL DEFAULT 'newbie'`, `milestones_completed JSONB NOT NULL DEFAULT '[]'::jsonb`, `total_inspections INTEGER NOT NULL DEFAULT 0`, `total_recommendations_followed INTEGER NOT NULL DEFAULT 0`, `last_assessed_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `current_level`: `newbie`, `amateur`, `sideliner`, `hobbyist`, `commercial`
  - [ ] Add CHECK constraint on `total_inspections >= 0`
  - [ ] Add index `idx_skill_progression_user_id` on `user_id` (UNIQUE already covers this but explicit for clarity)
  - [ ] Attach `set_updated_at` trigger
- [ ] Create migration `000017_create_notification_preferences_table.up.sql` (AC: #1, #5, #6)
  - [ ] Define `notification_preferences` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES users(id)`, `apiary_id UUID REFERENCES apiaries(id)`, `sensitivity_level VARCHAR(20) NOT NULL DEFAULT 'normal'`, `suppression_window_start TIME`, `suppression_window_end TIME`, `escalation_enabled BOOLEAN NOT NULL DEFAULT true`, `push_enabled BOOLEAN NOT NULL DEFAULT true`, `email_enabled BOOLEAN NOT NULL DEFAULT false`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `sensitivity_level`: `low`, `normal`, `high`
  - [ ] Add UNIQUE constraint on `(user_id, apiary_id)` — one preference record per user per apiary (NULL apiary_id = global)
  - [ ] Note: PostgreSQL treats NULL as distinct in UNIQUE, so `(user_id, NULL)` allows one global preference row
  - [ ] Add index `idx_notification_preferences_user_id` on `user_id`
  - [ ] Attach `set_updated_at` trigger
- [ ] Create migration `000018_create_treatment_registry_table.up.sql` (AC: #1, #7)
  - [ ] Define `treatment_registry` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `treatment_name VARCHAR(255) NOT NULL`, `treatment_category VARCHAR(50) NOT NULL`, `active_ingredient VARCHAR(255)`, `region VARCHAR(100) NOT NULL`, `legal_status VARCHAR(30) NOT NULL`, `application_method TEXT`, `seasonal_window VARCHAR(100)`, `withdrawal_period_days INTEGER`, `notes TEXT`, `source_url TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `treatment_category`: `varroa`, `nosema`, `foulbrood`, `beetle`, `moth`, `nutrition`, `other`
  - [ ] Add CHECK constraint on `legal_status`: `approved`, `restricted`, `prescription_required`, `prohibited`, `unknown`
  - [ ] Add UNIQUE constraint on `(treatment_name, region)` — one status per treatment per region
  - [ ] Add index `idx_treatment_registry_region` on `region`
  - [ ] Add index `idx_treatment_registry_legal_status` on `legal_status`
  - [ ] Attach `set_updated_at` trigger
- [ ] Create migration `000019_seed_treatment_registry.up.sql` (AC: #7)
  - [ ] Seed initial treatment records for major regions (US, EU, UK, AU, NZ, CA)
  - [ ] Include common varroa treatments: Apivar (amitraz), Apistan (tau-fluvalinate), Formic Pro (formic acid), Oxalic acid (dribble/vaporization), Mite Away Quick Strips, Hopguard (hop beta acids), Thymovar (thymol)
  - [ ] Include nutritional supplements: sugar syrup, pollen patties, fondant
  - [ ] Include legal status per region
- [ ] Create migration `000020_create_embeddings_table.up.sql` (AC: #1, #8, #9)
  - [ ] Verify `pgvector` extension is enabled (from migration 000001)
  - [ ] Define `embeddings` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES users(id)`, `source_type VARCHAR(30) NOT NULL`, `source_id UUID NOT NULL`, `embedding vector(1408) NOT NULL`, `model_version VARCHAR(50) NOT NULL`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add CHECK constraint on `source_type`: `observation_text`, `observation_image`, `observation_audio`, `recommendation_rationale`, `knowledge_base`
  - [ ] Add UNIQUE constraint on `(source_type, source_id, model_version)` — one embedding per source per model version
  - [ ] Add index `idx_embeddings_user_id` on `user_id`
  - [ ] Add index using HNSW on `embedding vector_cosine_ops` with `m = 16, ef_construction = 64` — for approximate nearest neighbor search
  - [ ] Add index `idx_embeddings_source_type_source_id` on `(source_type, source_id)`
  - [ ] Note: `vector(1408)` matches Vertex AI Embedding 2.0 multimodal output dimension
- [ ] Create migration `000021_create_knowledge_base_chunks_table.up.sql` (AC: #1)
  - [ ] Define `knowledge_base_chunks` table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `document_id VARCHAR(255) NOT NULL`, `chunk_index INTEGER NOT NULL`, `content TEXT NOT NULL`, `metadata JSONB NOT NULL DEFAULT '{}'::jsonb`, `region VARCHAR(100)`, `season VARCHAR(20)`, `embedding_id UUID REFERENCES embeddings(id)`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
  - [ ] Add UNIQUE constraint on `(document_id, chunk_index)`
  - [ ] Add index `idx_knowledge_base_region` on `region`
  - [ ] Add index `idx_knowledge_base_season` on `season`
  - [ ] Attach `set_updated_at` trigger
- [ ] Write sqlc query file `apps/api/internal/repository/queries/skill_progression.sql` (AC: #10)
  - [ ] `CreateSkillProgression` — INSERT RETURNING full row
  - [ ] `GetSkillProgressionByUser` — SELECT WHERE `user_id = $1`
  - [ ] `UpdateSkillLevel` — UPDATE `current_level`, `last_assessed_at` WHERE `user_id = $1`
  - [ ] `IncrementInspectionCount` — UPDATE SET `total_inspections = total_inspections + 1` WHERE `user_id = $1`
  - [ ] `UpdateMilestones` — UPDATE `milestones_completed` WHERE `user_id = $1`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/notification_preferences.sql` (AC: #10)
  - [ ] `CreateNotificationPreference` — INSERT RETURNING full row
  - [ ] `GetGlobalPreference` — SELECT WHERE `user_id = $1 AND apiary_id IS NULL`
  - [ ] `GetApiaryPreference` — SELECT WHERE `user_id = $1 AND apiary_id = $2`
  - [ ] `GetEffectivePreference` — SELECT with COALESCE logic: apiary-specific first, fall back to global
  - [ ] `UpdateNotificationPreference` — UPDATE WHERE `id = $1 AND user_id = $2`
  - [ ] `ListPreferencesByUser` — SELECT WHERE `user_id = $1` ORDER BY `apiary_id NULLS FIRST`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/treatment_registry.sql` (AC: #10)
  - [ ] `ListTreatmentsByRegion` — SELECT WHERE `region = $1` ORDER BY `treatment_category, treatment_name`
  - [ ] `GetTreatmentByNameAndRegion` — SELECT WHERE `treatment_name = $1 AND region = $2`
  - [ ] `ListApprovedTreatmentsByRegion` — SELECT WHERE `region = $1 AND legal_status IN ('approved', 'restricted')` ORDER BY `treatment_category`
  - [ ] `SearchTreatments` — SELECT WHERE `region = $1 AND (treatment_name ILIKE $2 OR active_ingredient ILIKE $2)`
- [ ] Write sqlc query file `apps/api/internal/repository/queries/embeddings.sql` (AC: #10)
  - [ ] `CreateEmbedding` — INSERT RETURNING full row
  - [ ] `UpsertEmbedding` — INSERT ON CONFLICT (source_type, source_id, model_version) DO UPDATE SET `embedding = $4`
  - [ ] `GetEmbeddingBySource` — SELECT WHERE `source_type = $1 AND source_id = $2 AND model_version = $3`
  - [ ] `FindSimilarEmbeddings` — SELECT using `embedding <=> $1` cosine distance WHERE `user_id = $2 AND source_type = $3` ORDER BY distance LIMIT $4
  - [ ] `FindSimilarKnowledgeBase` — SELECT from `embeddings e JOIN knowledge_base_chunks k ON k.embedding_id = e.id` WHERE `e.source_type = 'knowledge_base'` ORDER BY `e.embedding <=> $1` LIMIT $2
  - [ ] `DeleteEmbeddingBySource` — DELETE WHERE `source_type = $1 AND source_id = $2`
- [ ] Run `sqlc generate` and verify compilation (AC: #9)
  - [ ] Verify pgvector types are correctly mapped in sqlc config
  - [ ] Confirm `pgvector/pgvector-go` package is imported
- [ ] Write migration integration tests using testcontainers-go (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9, #11)
  - [ ] Test: Story 3.5 migrations apply after Stories 3.1-3.4
  - [ ] Test: `skill_progression` UNIQUE constraint on `user_id` (one record per user)
  - [ ] Test: `skill_progression` CHECK constraint on `current_level`
  - [ ] Test: `notification_preferences` UNIQUE constraint on `(user_id, apiary_id)`
  - [ ] Test: `notification_preferences` allows one global (NULL apiary_id) per user
  - [ ] Test: `treatment_registry` seeded with initial data after migration
  - [ ] Test: `treatment_registry` UNIQUE constraint on `(treatment_name, region)`
  - [ ] Test: `embeddings` accepts 1408-dimension vector
  - [ ] Test: `embeddings` rejects wrong-dimension vector
  - [ ] Test: `embeddings` UNIQUE constraint on `(source_type, source_id, model_version)`
  - [ ] Test: `knowledge_base_chunks` UNIQUE constraint on `(document_id, chunk_index)`
  - [ ] Test: **full migration suite** — apply all migrations 000001-000021 against empty database, verify no errors
- [ ] Write sqlc-generated repository integration tests (AC: #8, #9, #10)
  - [ ] Test: skill progression CRUD lifecycle — create, update level, increment inspections, update milestones
  - [ ] Test: notification preference global vs apiary-specific resolution
  - [ ] Test: `GetEffectivePreference` returns apiary-specific when available, global otherwise
  - [ ] Test: treatment registry region filtering
  - [ ] Test: treatment search by name and active ingredient
  - [ ] Test: embedding creation and cosine similarity search returns correct nearest neighbors
  - [ ] Test: `FindSimilarEmbeddings` with tenant scoping — does not return other users' embeddings
  - [ ] Test: `FindSimilarKnowledgeBase` joins correctly and returns ranked results
  - [ ] Test: `UpsertEmbedding` updates vector on conflict
  - [ ] Test: tenant isolation on all user-facing queries

## Dev Notes

### Architecture Compliance

- Vertex AI Embedding 2.0 multimodal produces 1408-dimension vectors (architecture.md: "Vertex AI Embedding 2.0 (`multimodalembedding@001`) — a single multimodal model that embeds text, images, audio, and video into a shared vector space").
- pgvector on Cloud SQL for PostgreSQL (architecture.md: "PostgreSQL with `pgvector` extension on Cloud SQL for semantic search vectors").
- Treatment registry supports region-aware legal status per FR12a/FR12b.
- Skill progression levels align with the UX design system (`newbie`, `amateur`, `sideliner`, `hobbyist`, `commercial`).
- Notification suppression windows support the notification dispatch architecture (Cloud Tasks for delayed/scheduled delivery).
- Knowledge base chunks support the recommendation engine's semantic retrieval step (architecture.md: "Retrieve relevant knowledge base chunks").

### TDD Requirements (Tests First!)

Write ALL tests before implementing migrations and queries:

1. **pgvector tests** (critical — new extension):
   - Verify pgvector extension is available in test container.
   - Insert multiple embeddings with known vectors, perform cosine similarity query, verify ordering is correct.
   - Test with realistic 1408-dimension vectors (not just trivial 2D).
   - Test HNSW index by verifying query plan uses the index.
   - Test edge cases: identical vectors (distance = 0), orthogonal vectors (distance = 1).

2. **Skill progression tests**:
   - One record per user constraint.
   - Level progression: `newbie` -> `amateur` -> `sideliner`.
   - Milestone JSONB stores and retrieves correctly.

3. **Notification preference resolution tests**:
   - Global preference (NULL apiary_id) serves as default.
   - Apiary-specific preference overrides global.
   - `GetEffectivePreference` implements fallback correctly.

4. **Treatment registry seed tests**:
   - After migration, verify expected treatments exist.
   - Verify region-specific legal status values.

5. **Full migration suite test** (integration):
   - Apply ALL migrations 000001-000021 to an empty PostgreSQL 16 + pgvector container.
   - Verify final schema has all expected tables, columns, constraints, and indexes.
   - This is the definitive schema validation test for the entire Epic 3.

### Technical Specifications

- **Vector dimension**: 1408 (Vertex AI Embedding 2.0 multimodal). If the model version changes, `model_version` column tracks which model generated each embedding.
- **HNSW index parameters**: `m = 16` (max connections per layer), `ef_construction = 64` (build-time search breadth). These are reasonable defaults for MVP scale (<100k vectors). Tune post-MVP.
- **Cosine similarity operator**: `<=>` in pgvector. Lower distance = more similar.
- **Knowledge base chunking**: documents are split into chunks with metadata (region, season, topic). Each chunk gets an embedding. Chunking strategy is application-level, not enforced in schema.
- **sqlc pgvector mapping**: requires `pgvector/pgvector-go` package. In `sqlc.yaml`, override the `vector` type to map to `pgvector.Vector`.
- **Treatment registry seeding**: initial data is inserted via a dedicated migration file (not application code). Updates to treatment data in future are additional forward-only migrations.

### Anti-Patterns to Avoid

- **NO** storing embeddings outside PostgreSQL (no separate Pinecone/Weaviate) — pgvector handles MVP scale (architecture.md: "pgvector over dedicated vector DB — avoids separate Pinecone/Weaviate cost").
- **NO** hard-coding vector dimensions — use the `vector(1408)` type but keep `model_version` to support future model changes.
- **NO** embedding queries without source_type filtering — always scope similarity search to the relevant content type for meaningful results.
- **NO** auto-creating skill progression records in the migration — these are created on user registration via application logic.
- **NO** skipping the suppression window in notification delivery — the `suppression_window_start`/`end` fields are respected by the notification dispatch worker.
- **NO** treating treatment registry as user-editable — it is a system-managed reference table updated via migrations.

### Project Structure Notes

```
apps/api/
├── migrations/
│   ├── 000016_create_skill_progression_table.up.sql
│   ├── 000017_create_notification_preferences_table.up.sql
│   ├── 000018_create_treatment_registry_table.up.sql
│   ├── 000019_seed_treatment_registry.up.sql
│   ├── 000020_create_embeddings_table.up.sql
│   └── 000021_create_knowledge_base_chunks_table.up.sql
├── internal/
│   └── repository/
│       ├── queries/
│       │   ├── skill_progression.sql
│       │   ├── notification_preferences.sql
│       │   ├── treatment_registry.sql
│       │   └── embeddings.sql
│       └── db/
│           ├── skill_progression.sql.go
│           ├── notification_preferences.sql.go
│           ├── treatment_registry.sql.go
│           └── embeddings.sql.go
```

### References

- Architecture: `/home/donpetry/broodly/_bmad-output/planning-artifacts/architecture.md` — AI/ML Architecture (Embedding Strategy), Recommendation Engine Architecture (Semantic Retrieval), Key Go Package Recommendations (pgvector/pgvector-go)
- Epics: `/home/donpetry/broodly/_bmad-output/planning-artifacts/epics.md` — Story 3.5
- FRs: FR34 (skill progression), FR35 (adaptive guidance), FR40 (notifications), FR42 (notification preferences), FR12a/FR12b (treatment legality)
- Depends on: Story 3.1 (users, apiaries), Story 3.4 (for full migration suite context)

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### File List
