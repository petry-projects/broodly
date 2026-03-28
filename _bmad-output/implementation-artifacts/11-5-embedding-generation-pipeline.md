# Story 11.5: Embedding Generation Pipeline

Status: ready-for-dev

## Story

As a system,
I want embeddings generated for inspection text, images, and audio via Vertex AI Embedding 2.0 multimodal and stored in PostgreSQL pgvector,
so that semantic search and similarity-based recommendation retrieval are available across all content types in a shared vector space.

## Acceptance Criteria (BDD)

1. GIVEN an `embedding-requests` Pub/Sub message containing a text observation WHEN the embedding worker receives it THEN the worker generates a text embedding via Vertex AI Embedding 2.0 multimodal and stores the resulting vector in the pgvector column of the corresponding record.
2. GIVEN an `embedding-requests` Pub/Sub message containing an image storage path WHEN the embedding worker receives it THEN the worker downloads the image from Cloud Storage, generates an image embedding via Vertex AI Embedding 2.0 multimodal, and stores the vector in pgvector.
3. GIVEN an `embedding-requests` Pub/Sub message containing an audio storage path WHEN the embedding worker receives it THEN the worker downloads the audio from Cloud Storage, generates an audio embedding via Vertex AI Embedding 2.0 multimodal, and stores the vector in pgvector.
4. GIVEN stored embeddings from different modalities (text, image, audio) WHEN a cosine similarity query is executed THEN semantically related records are returned regardless of the source modality (cross-modal retrieval works).
5. GIVEN a newly generated embedding WHEN stored THEN the embedding dimension matches the Vertex AI Embedding 2.0 output dimension (1408 dimensions for multimodal).
6. GIVEN a processing failure WHEN the worker cannot generate an embedding THEN the message is nacked for retry, and after max delivery attempts it routes to the dead-letter topic. The record is updated with `embedding_failed` status.
7. GIVEN the recommendation context assembly service WHEN it queries for similar past observations THEN a pgvector cosine similarity function returns the top-N most relevant records across all modalities.

## Tasks / Subtasks

- [ ] Implement Pub/Sub subscription handler for embedding worker (AC: #1, #2, #3, #6)
  - [ ] Create Cloud Run worker endpoint for `embedding-requests` push subscription
  - [ ] Parse message envelope: `contentType` (text, image, audio), `storagePath` (for media), `text` (for text content), `recordId`, `recordType`, `tenantId`
  - [ ] Route to appropriate embedding generation path based on content type
  - [ ] Implement idempotency check by `eventId`
- [ ] Implement Vertex AI Embedding 2.0 multimodal client (AC: #1, #2, #3, #5)
  - [ ] Create `apps/api/internal/ai/embedding.go` with Vertex AI Embedding client
  - [ ] Use model `multimodalembedding@001` via Vertex AI API
  - [ ] Text embedding: submit text content directly
  - [ ] Image embedding: download image from GCS, submit image bytes
  - [ ] Audio embedding: download audio from GCS, submit audio bytes
  - [ ] Validate output dimension is 1408 for all modalities
  - [ ] Parse response into `[]float32` vector
- [ ] Set up pgvector schema and storage (AC: #5)
  - [ ] Create migration: `ALTER TABLE observation ADD COLUMN embedding vector(1408)`
  - [ ] Create migration: `ALTER TABLE media ADD COLUMN embedding vector(1408)`
  - [ ] Create migration: `CREATE TABLE knowledge_embeddings (id UUID PRIMARY KEY, content_type TEXT, source_ref TEXT, chunk_text TEXT, embedding vector(1408), created_at TIMESTAMPTZ)`
  - [ ] Create index: `CREATE INDEX idx_observation_embedding ON observation USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
  - [ ] Create index: `CREATE INDEX idx_media_embedding ON media USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
  - [ ] Create index: `CREATE INDEX idx_knowledge_embedding ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
- [ ] Store generated embeddings (AC: #1, #2, #3)
  - [ ] Create sqlc queries for updating embedding column on observation records
  - [ ] Create sqlc queries for updating embedding column on media records
  - [ ] Create sqlc queries for inserting knowledge base embeddings
  - [ ] Update record `embedding_status`: `pending` -> `completed` or `failed`
- [ ] Implement cosine similarity search queries (AC: #4, #7)
  - [ ] Create sqlc query: `FindSimilarObservations(embedding vector, tenantId UUID, limit int) -> []ObservationSimilarity`
  - [ ] Query joins observation + media tables for cross-modal results
  - [ ] Returns: record ID, record type, similarity score, content preview, created_at
  - [ ] Filter by tenant_id (mandatory) and optional time window (default: current + prior season)
  - [ ] Create sqlc query: `FindSimilarKnowledge(embedding vector, limit int) -> []KnowledgeSimilarity`
  - [ ] Knowledge base query returns: chunk text, source reference, similarity score
- [ ] Implement batch embedding for knowledge base (AC: #4)
  - [ ] Create `apps/api/internal/ai/knowledge_embedder.go` for batch processing
  - [ ] Accept chunked text documents (beekeeping best practices, treatment protocols, seasonal guidance)
  - [ ] Batch embed via Vertex AI Embedding 2.0 API
  - [ ] Store in `knowledge_embeddings` table
  - [ ] Designed to run as a build-time or periodic batch job
- [ ] Implement error handling and dead-letter queue (AC: #6)
  - [ ] On transient errors (API timeout, rate limit): return nack for Pub/Sub retry
  - [ ] On permanent errors: update record embedding_status to `failed`, ack message
  - [ ] Configure dead-letter topic `embedding-requests-dlq` with max delivery attempts (5)
  - [ ] Structured logging with `slog`
- [ ] Configure infrastructure (AC: #1, #6)
  - [ ] Terraform: Pub/Sub subscription for embedding worker on `embedding-requests` topic
  - [ ] Terraform: dead-letter topic with Cloud Monitoring alert on depth > 10
  - [ ] Cloud Run worker: 1 vCPU, 512 MiB memory, 30s timeout, min 0 instances
  - [ ] Ensure Cloud SQL has pgvector extension enabled (Terraform module)

## Dev Notes

### Architecture Compliance
- Vertex AI Embedding 2.0 (`multimodalembedding@001`) is the single multimodal model for text, image, audio, and video per architecture.md AI/ML section
- All modalities embed into the same 1408-dimensional vector space, enabling cross-modal similarity search
- pgvector on Cloud SQL PostgreSQL per data architecture; avoids separate vector DB cost
- Embeddings are stored alongside domain records (observation, media) not in a separate store
- Knowledge base embeddings are pre-computed at build time per embedding strategy
- Recommendation engine uses cosine similarity retrieval for context assembly per recommendation engine architecture
- Worker subscribes to `embedding-requests` topic, receiving messages from STT worker (11.2), Vision AI worker (11.3), and Acoustic worker (11.4)

### TDD Requirements (Tests First!)
- Test 1: **Text embedding generation** -- Send embedding request with text content; mock Vertex AI to return 1408-dim vector; assert vector is stored in `observation.embedding` column.
- Test 2: **Image embedding generation** -- Send embedding request with image path; mock GCS download and Vertex AI; assert vector stored in `media.embedding` column.
- Test 3: **Audio embedding generation** -- Send embedding request with audio path; mock GCS download and Vertex AI; assert vector stored in appropriate column.
- Test 4: **Dimension validation** -- Assert all generated embeddings have exactly 1408 dimensions. Reject and log error if dimension mismatch occurs.
- Test 5: **Cosine similarity search** -- Insert three observation embeddings with known vectors; query with a target vector; assert results are returned in descending similarity order. Use testcontainers with pgvector-enabled PostgreSQL.
- Test 6: **Cross-modal retrieval** -- Insert one text embedding and one image embedding for related content (mock similar vectors); query with text; assert image result is returned with high similarity score.
- Test 7: **Tenant isolation** -- Insert embeddings for two different tenants; query for tenant A; assert no results from tenant B are returned.
- Test 8: **Dead-letter on failure** -- Mock Vertex AI to fail permanently; assert DLQ routing and record updated to `embedding_failed`.
- Test 9: **Idempotency** -- Send same `eventId` twice; assert embedding is generated and stored only once.
- Test 10: **Knowledge base batch embedding** -- Provide 3 text chunks; assert all 3 are embedded and stored in `knowledge_embeddings` table with correct source references.

### Technical Specifications
- **Embedding Model:** Vertex AI Embedding 2.0 (`multimodalembedding@001`)
- **Embedding dimension:** 1408 (multimodal output)
- **Vector type:** `vector(1408)` in pgvector
- **Index type:** IVFFlat with cosine distance (`vector_cosine_ops`), 100 lists (suitable for MVP scale)
- **Similarity metric:** cosine similarity (1 - cosine distance)
- **Go packages:** `cloud.google.com/go/aiplatform` for Vertex AI, `pgvector/pgvector-go` for pgvector integration with pgx
- **PostgreSQL extension:** `CREATE EXTENSION IF NOT EXISTS vector` (pgvector)
- **Batch size for knowledge base:** 50 texts per API call (Vertex AI batch limit)
- **Time window for similarity search:** current season + prior season (configurable, default 12 months)
- **Top-N results:** default 10 for recommendation context, configurable per query

### Anti-Patterns to Avoid
- DO NOT use separate embedding models for different modalities -- Vertex AI Embedding 2.0 multimodal handles all types in one shared vector space
- DO NOT store embeddings in a separate vector database (Pinecone, Weaviate) -- use pgvector on Cloud SQL to avoid additional cost and complexity
- DO NOT skip tenant_id filtering on similarity queries -- all vector searches must be tenant-scoped
- DO NOT use HNSW indexes at MVP scale -- IVFFlat is sufficient and simpler to tune for < 1M vectors
- DO NOT embed raw audio/image bytes without the Vertex AI model -- always use the Embedding 2.0 API
- DO NOT generate embeddings synchronously in the API service -- all embedding generation is async via the worker
- DO NOT skip idempotency checks -- duplicate messages are expected from Pub/Sub
- DO NOT hardcode the embedding dimension -- read from configuration to support model upgrades
- DO NOT query embeddings without a time window -- unbounded similarity search degrades with scale

### Project Structure Notes
- Embedding client: `apps/api/internal/ai/embedding.go`
- Knowledge embedder: `apps/api/internal/ai/knowledge_embedder.go`
- pgvector repository: `apps/api/internal/repository/embedding.go`
- Similarity search queries: `apps/api/internal/repository/similarity.go`
- SQL migrations: `apps/api/migrations/XXXXXX_add_pgvector_embeddings.up.sql`
- sqlc queries: `apps/api/internal/repository/queries/embedding.sql`
- Terraform: `infra/terraform/modules/pubsub/main.tf` (subscription, DLQ)
- Terraform: `infra/terraform/modules/cloud-sql/main.tf` (pgvector extension)

### References
- [Source: architecture.md#AI/ML Architecture -- Embedding Strategy for Beekeeping Domain]
- [Source: architecture.md#Data Architecture -- Embedding store: PostgreSQL with pgvector]
- [Source: architecture.md#Recommendation Engine Architecture -- Multimodal Semantic Retrieval]
- [Source: architecture.md#Infrastructure & Deployment -- Async worker service]
- [Source: architecture.md#Event Architecture -- embedding-requests topic]
- [Source: architecture.md#Cost and Scaling Analysis -- pgvector over dedicated vector DB]
- [Source: epics.md#Epic 11 -- Story 11.5]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
