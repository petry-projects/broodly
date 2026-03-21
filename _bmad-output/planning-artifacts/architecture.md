---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-15'
inputDocuments:
  - /workspaces/bmad-method/_bmad-output/planning-artifacts/product-brief-bmad-method-2026-03-15.md
  - /workspaces/bmad-method/_bmad-output/planning-artifacts/prd.md
  - /workspaces/bmad-method/_bmad-output/planning-artifacts/ux-design-specification.md
  - /workspaces/bmad-method/_bmad-output/planning-artifacts/research/domain-beekeeping-research-2026-03-15.md
  - /workspaces/bmad-method/_bmad-output/planning-artifacts/research/market-beekeeping-app-improve-outcomes-research-2026-03-15.md
workflowType: 'architecture'
project_name: 'bmad-method'
user_name: 'Humans'
date: '2026-03-15'

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The PRD defines 55 functional requirements centered on identity/profile management, localization-aware guidance, weekly planning and prioritization, guided inspection decision support, voice/media logging, skill progression, integrations, and support/audit workflows. Architecturally, this implies a modular domain model where recommendation logic, inspection workflows, notification orchestration, and telemetry ingestion are isolated but composable.

**Non-Functional Requirements:**
The NFR set drives a reliability-first, trust-first architecture: low-latency mobile interactions, offline-first capture and deferred sync, explicit confidence signaling, encryption in transit/at rest, RBAC, auditability, and observability for recommendation/sync/notification pipelines. These requirements require clear service boundaries, resilient client state handling, and robust telemetry around confidence and action outcomes.

**Scale & Complexity:**
The project is medium-high complexity due to multi-persona workflows, explainable recommendations, optional real-time integrations, and strong traceability constraints.

- Primary domain: mobile decision-support platform with backend intelligence services
- Complexity level: high (product complexity), medium (initial operational scale)
- Estimated architectural components: 14-18 bounded components/services

### Technical Constraints & Dependencies

- Mobile-first operation with full offline workflow continuity during inspections
- Region/season localization as a hard prerequisite for high-confidence recommendations
- Telemetry/weather/flora integrations must influence ranking logic, not only UI presentation
- Recommendation contract must always return action + rationale + confidence + fallback
- Evidence traceability must support support-case replay and trust debugging
- Export and collaboration controls are required in MVP, influencing data contracts early

### Cross-Cutting Concerns Identified

- Identity, roles, and permission boundaries across owner/collaborator/support contexts
- Data quality and freshness handling for external signals (staleness-aware confidence)
- Event and audit logging for recommendation generation, user actions, and sync lifecycle
- Error handling and degraded-mode behavior across mobile, sync, and recommendation layers
- Security/privacy controls for location/media/voice data and third-party integrations
- Consistent recommendation explainability across every decision surface

## Starter Template Evaluation

### Primary Technology Domain

Mobile-first application with cloud backend services, plus a future web/admin companion. This is based on PRD classification (`mobile_app`) and user clarification to keep mobile-first while allowing later web/admin expansion.

### Starter Options Considered

- `create-expo-app` (Expo managed workflow) — fastest and most consistent for cross-platform iOS/Android delivery, OTA updates, and mature React Native ecosystem.
- React Native CLI baseline — higher flexibility but more native configuration overhead in MVP stage.
- Flutter starter — strong option, but lower alignment with existing React-oriented preference and lower near-term velocity for this context.

### Selected Starter: Expo + TypeScript

**Rationale for Selection:**
Best fit for rapid, reliable mobile MVP delivery with offline-first flows, camera/mic/location support, and maintainable cross-platform development while preserving optional migration paths for deeper native customization later.

**Initialization Command:**

```bash
npx create-expo-app@latest bmad-method-app --template
```

### Verified Current Versions

- `expo`: 55.0.6
- `create-expo-app`: 3.5.3
- `react-native`: 0.84.1
- `typescript`: 5.9.3
- Rust toolchain: 1.85 (stable)
- `axum`: 0.8.x (HTTP framework)
- `sqlx`: 0.8.x (async PostgreSQL driver with compile-time query checking)
- `tokio`: 1.x (async runtime)
- `serde`: 1.x (serialization)
- Google Cloud SDK: latest
- `@react-native-firebase/app`: 21.x (client-side Firebase integration)

### Architectural Decisions Provided by Starter

**Language & Runtime:**
TypeScript-based React Native runtime on Expo managed workflow.

**Styling Solution:**
React Native StyleSheet primitives by default; design system layer can be added without changing core starter shape.

**Build Tooling:**
Expo toolchain with Metro bundling, platform targets, and managed app lifecycle.

**Testing Framework:**
Jest-compatible baseline and React Native testing ecosystem compatibility.

**Code Organization:**
Feature-oriented `app/` or `src/` structure with modular services for recommendation, sync, telemetry, and notifications.

**Development Experience:**
Fast local preview, OTA workflow support, and low-friction iteration across iOS/Android.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Primary product remains mobile-first (Expo React Native), with separate React + Vite web admin companion.
- API strategy is REST-first with OpenAPI 3.1 typed schema contract, generated TypeScript client types.
- Auth uses Firebase Authentication (email/password, optional OAuth providers).
- Primary data store is Cloud SQL for PostgreSQL with application-level authorization.
- Backend is Rust (axum) deployed as a container on Cloud Run.
- Mobile experience is offline-first using local SQLite + deterministic queue-based sync.
- Recommendation contract is mandatory in API responses: action + rationale + confidence + fallback.
- AI/ML inference uses Vertex AI endpoints for embeddings, image analysis, and recommendation scoring.

**Important Decisions (Shape Architecture):**
- Backend separates REST API service and async worker service (both Rust, separate Cloud Run services).
- Media and export storage uses Google Cloud Storage.
- Asynchronous processing uses Cloud Pub/Sub for event dispatch and Cloud Run jobs for batch work.
- Voice processing uses Gemini STT/TTS via Vertex AI API.
- Observability uses Cloud Logging, Cloud Trace, and Cloud Monitoring with structured audit events.
- Admin web focuses on support, audit, integration health, and settings.

**Deferred Decisions (Post-MVP):**
- Non-critical real-time subscriptions (consider Firestore for specific live-update surfaces).
- Advanced route optimization across many apiaries.
- Multi-region Cloud Run deployment.
- Cloud Spanner evaluation if write-heavy multi-region becomes necessary.

### Data Architecture

- **Primary store:** Cloud SQL for PostgreSQL (managed, HA-capable, automatic backups). PostgreSQL 16 with pgvector extension.
- **Authorization model:** application-level RBAC enforced in Rust middleware; no RLS dependency. Authorization checks are composable middleware functions validated at the request boundary and query construction layer. All database queries include `WHERE tenant_id = $1` as a mandatory parameter, enforced by repository trait signatures.
- **Domain schema:** users, apiaries, hives, inspections, recommendations, tasks, integrations, events, audit.
- **Validation:** OpenAPI schema validation at API boundary + DB constraints + Rust type system compile-time guarantees.
- **Migrations:** versioned SQL migrations via `sqlx migrate`, forward-only in production. Migration CI gate blocks deployment on unapplied or conflicting migrations.
- **Caching:** persisted client SQLite cache for offline behavior; server-side read cache via Cloud Memorystore (Redis) for context assembly and recommendation input pre-computation.
- **Object storage:** Google Cloud Storage bucket for inspection media (photos, voice recordings), data exports, and backup archives. Signed URLs for secure client upload/download. Lifecycle rules: move to Nearline after 90 days, Archive after 1 year.
- **Embedding store:** PostgreSQL with `pgvector` extension on Cloud SQL for semantic search vectors. Vertex AI Embedding 2.0 generates embeddings; stored and queried via pgvector cosine similarity.
- **Longitudinal data strategy:** inspection history, recommendation traces, and media records shall be partitioned by time period (e.g., by season/year). The recommendation engine shall use a rolling window of recent history (configurable, default: current season plus prior season) for real-time queries, with older history available for trend analysis via async computation. Media storage shall support tiered retention: full-resolution for current season, compressed for prior seasons, with user-controlled archival and deletion.
- **Analytics data layer:** maintain a separate, anonymized analytical store optimized for aggregation queries across regions, seasons, and management patterns. Design schema to support cohort-level outcome analysis without exposing individual user data. This layer is the foundation for recommendation model training, regional baselines, and future research partnerships.

### Authentication & Security

- **Authentication:** Firebase Authentication (email/password, Google OAuth, Apple Sign-In). Firebase Admin SDK validates ID tokens server-side via Rust JWT validation against Google public keys (`jsonwebtoken` crate).
- **Authorization:** RBAC enforced in Rust axum middleware extractors. Roles: owner, collaborator (read-only), support. Permission checks occur at the handler level before any data access.
- **Token strategy:** Firebase ID tokens (short-lived, 1 hour) + Firebase refresh tokens (client-managed rotation). Server validates JWT signature, expiry, and claims on every request.
- **API security:** rate limiting via Cloud Armor or axum middleware (`tower` rate-limit layer), per-user and per-device limits. Request size limits enforced. API keys for integration partners.
- **Encryption:** TLS in transit (Cloud Run default), Cloud SQL encryption at rest (Google-managed keys, option for CMEK). Cloud Storage encryption at rest. Sensitive fields (location coordinates, media metadata) encrypted at application level with envelope encryption via Cloud KMS.
- **Auditability:** immutable audit event log in PostgreSQL with append-only table, covering recommendation generation, user actions, access changes, and sync events. Audit records include `event_id`, `event_type`, `actor_id`, `tenant_id`, `occurred_at`, `payload_version`, `payload` (JSONB).

### API & Communication Patterns

- **API pattern:** REST with OpenAPI 3.1 specification. `utoipa` crate generates OpenAPI docs from Rust handler annotations. TypeScript client types generated via `openapi-typescript`. Resource-oriented endpoints with consistent envelope: `{ data, meta, errors }`.
- **Schema evolution:** additive field changes with explicit versioned deprecation headers. Breaking changes via URL version prefix (`/v2/`).
- **Error handling:** typed domain errors with stable machine-readable `code`, human `message`, and `retryable` boolean. HTTP status codes follow REST conventions. Rust `thiserror` for domain error types.
- **Service communication:** synchronous request/response for interactive paths. Cloud Pub/Sub for async event dispatch (telemetry recompute, notification triggers, embedding generation, media processing). Cloud Tasks for delayed/scheduled work.
- **Integration contract:** adapters normalize weather/flora/sensor data into canonical internal events published to Pub/Sub topics. Each adapter is a separate Rust module with a shared `ExternalSignal` trait.
- **Voice payload:** audio uploaded to Cloud Storage via signed URL; Cloud Storage notification triggers STT processing via Pub/Sub; transcription result written back to inspection record.

### Frontend Architecture

- **Mobile app (primary):** Expo + TypeScript + feature-sliced modules. `@react-native-firebase/auth` for authentication. `expo-sqlite` for local offline database. `expo-file-system` for media staging before upload.
- **Admin web companion:** React + Vite + TypeScript. Firebase Auth web SDK.
- **State model:** server state managed via `@tanstack/react-query` with persistent offline query cache backed by SQLite. Workflow/UI state in Zustand stores.
- **Routing:** Expo Router (mobile), React Router (web).
- **Performance:** route/screen code splitting, query prefetching for guided flows, bounded SQLite cache with LRU eviction, media compression (HEIC/WebP, opus audio) before upload.
- **Offline sync engine:** custom queue-based sync in TypeScript. Mutations are enqueued in SQLite with monotonic sequence IDs. On connectivity restoration, queue replays in order. Conflict resolution policy: server-wins for shared data, client-wins for in-progress inspections, manual resolution for concurrent edits to same record. Sync status exposed via React context for UI indicators.

### Infrastructure & Deployment

- **Mobile:** Expo EAS channels for build/distribution.
- **Web admin:** Firebase Hosting (CDN-backed static deployment).
- **API service:** Rust binary in distroless container on Cloud Run (min 0 instances for dev, min 1 for prod). CPU always-allocated for consistent latency. 1 GiB memory, 1 vCPU baseline; autoscale to 10 instances for MVP.
- **Async worker service:** Rust binary on Cloud Run triggered by Pub/Sub push subscriptions. Handles: media processing, STT transcription, embedding generation, notification dispatch, telemetry normalization.
- **Database:** Cloud SQL for PostgreSQL 16 with pgvector extension. db-f1-micro for dev, db-custom-2-4096 for prod. Automated backups, point-in-time recovery enabled.
- **Object storage:** Google Cloud Storage bucket (`broodly-media-{env}`) with lifecycle rules. Signed URL upload/download with 15-minute expiry.
- **Cache:** Cloud Memorystore (Redis) basic tier, 1 GiB for prod. Used for recommendation context pre-assembly and session rate limiting.
- **AI/ML:** Vertex AI endpoints for Embedding 2.0 (text + image embeddings), Gemini for STT/TTS, Gemini Vision for inspection photo analysis. All accessed via Vertex AI API from Rust backend using direct REST with service account credentials.
- **Event infrastructure:** Cloud Pub/Sub topics: `inspection-events`, `media-uploaded`, `telemetry-ingested`, `notification-dispatch`, `embedding-requests`. Dead-letter topics with Cloud Monitoring alerts on DLQ depth. Cloud Storage Notifications on media bucket trigger `media-uploaded` topic.
- **CI/CD:** GitHub Actions monorepo pipeline. Rust: `cargo check`, `cargo clippy`, `cargo test`, migration guard. TypeScript: lint, type-check, test. Docker build and push to Artifact Registry. Cloud Run deploy via `gcloud run deploy` or Terraform.
- **Infrastructure-as-Code:** Terraform for all GCP resources. Separate state files for dev/staging/prod.
- **Environments:** dev/staging/prod with strict IAM separation, separate GCP projects per environment, Secret Manager for credentials and API keys.
- **Observability:** Cloud Logging (structured JSON logs from `tracing` crate), Cloud Trace (OpenTelemetry integration via `tracing-opentelemetry`), Cloud Monitoring dashboards and alerts for: API latency p50/p95/p99, error rates, Pub/Sub backlog depth, Cloud SQL connection pool utilization, recommendation generation latency.

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialize monorepo structure; scaffold Expo app and Rust API crate with axum hello-world.
2. Provision GCP project with Terraform: Cloud SQL, Cloud Run, GCS bucket, Firebase Auth project.
3. Implement Firebase Auth integration (Expo client + Rust JWT validation).
4. Implement PostgreSQL schema with sqlx migrations; core domain tables.
5. Build REST API handlers for core domain: hives, apiaries, inspections.
6. Implement offline sync engine (SQLite client + push/pull endpoints).
7. Integrate Vertex AI: embedding pipeline, recommendation scoring, vision analysis.
8. Implement Gemini STT for voice logging; Pub/Sub media processing pipeline.
9. Deliver mobile inspection and recommendation workflows end-to-end.
10. Implement admin web operational surfaces.

**Cross-Component Dependencies:**
- Recommendation quality depends on sync freshness, normalized integrations, and embedding index completeness.
- Support/audit UX depends on complete event and action history in audit tables.
- Offline reliability depends on sync queue semantics and conflict resolution shared by client and API.
- Vision AI and STT depend on GCS upload pipeline and Pub/Sub event flow.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database:** snake_case table/column names; UUID `id`; foreign keys as `<entity>_id`; indexes as `idx_<table>_<columns>`.

**API:** REST resource types in PascalCase; fields in camelCase; endpoint paths in kebab-case; event names as `domain.entity.action.v1`.

**Code:** components/classes in PascalCase; functions/variables/hooks in camelCase; files in kebab-case (framework exceptions allowed).

### Structure Patterns

- Monorepo with `apps/` and `packages/`.
- Runtime separation: `apps/mobile`, `apps/admin-web`, `apps/api`.
- Shared schema/types/config in `packages/*`.
- Unit tests co-located, integration/e2e in top-level `tests/`.

### Format Patterns

- API timestamps are ISO-8601 UTC strings.
- API IDs are opaque UUID strings.
- API boundary JSON fields use camelCase.
- DB remains snake_case; mapping occurs in data access layer.

### Communication Patterns

- Required event envelope: `eventId`, `eventType`, `occurredAt`, `tenantId`, `payloadVersion`, `payload`.
- Event consumers are idempotent by `eventId`.
- Offline queue replay order is deterministic; conflicts resolve via policy order: hard constraint > server truth > merge > manual resolution.
- Conflict notification requirement: when sync conflict resolution modifies or discards user-submitted data, the system must generate a user-visible notification identifying: (a) which record was affected, (b) what the user submitted versus what was resolved, and (c) an option to review and amend the resolved record.
- Collaborator collision handling: when two users modify the same hive record within the same sync window, the system must preserve both submissions as separate audit entries and present the conflict to the account owner for resolution rather than silently merging.

### Process Patterns

- All domain errors expose stable code and retryability metadata.
- Async views use unified states: `idle|loading|success|error|syncing`.
- Recommendation/sync/notification failures are always logged and auditable.

### Enforcement Guidelines

- Shared contracts package is the source of truth for cross-app types.
- CI enforces lint, type safety, schema compatibility, migration safety, and tests.
- Architecture deviations require ADR documentation before merge.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
broodly/
├── apps/
│   ├── mobile/
│   │   ├── app/                    # Expo Router screens
│   │   ├── src/features/           # Feature modules (inspection, recommendations, planning)
│   │   ├── src/services/           # API client, sync engine, media upload
│   │   ├── src/store/              # Zustand stores, SQLite offline cache
│   │   └── package.json
│   ├── admin-web/
│   │   ├── src/pages/
│   │   ├── src/components/
│   │   ├── src/services/
│   │   └── package.json
│   └── api/
│       ├── src/
│       │   ├── main.rs             # Entrypoint, axum router setup
│       │   ├── handlers/           # HTTP handlers by domain
│       │   ├── domain/             # Core domain types and business logic
│       │   ├── services/           # Application services (recommendation engine, planning)
│       │   ├── adapters/           # External integrations (weather, flora, telemetry)
│       │   ├── ai/                 # Vertex AI client, embedding generation, vision analysis
│       │   ├── voice/              # Gemini STT/TTS integration
│       │   ├── events/             # Pub/Sub publishers and subscribers
│       │   ├── persistence/        # sqlx queries, repository traits and implementations
│       │   ├── auth/               # Firebase token validation, RBAC middleware
│       │   ├── middleware/         # Rate limiting, tracing, error handling
│       │   └── config.rs           # Environment configuration
│       ├── migrations/             # SQL migrations (sqlx migrate)
│       ├── Cargo.toml
│       └── Dockerfile
├── packages/
│   ├── api-types/                  # Generated TypeScript types from OpenAPI
│   ├── domain-types/               # Shared domain constants and enums
│   ├── config/                     # Shared configuration schemas
│   ├── ui/                         # Shared UI component library
│   └── test-utils/
├── infra/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── cloud-run/
│   │   │   ├── cloud-sql/
│   │   │   ├── pubsub/
│   │   │   ├── storage/
│   │   │   ├── vertex-ai/
│   │   │   └── firebase/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── main.tf
│   └── monitoring/
│       ├── dashboards/
│       └── alerts/
├── tests/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── architecture/
    ├── adr/
    ├── api/                        # Generated OpenAPI HTML docs
    └── runbooks/
```

### Architectural Boundaries

- `apps/api` is the only client-facing API surface.
- Mobile and admin clients never access DB directly.
- Domain modules communicate via explicit interfaces/events only.
- Recommendation, inspection, planning, and notification ownership remains separate.

### Requirements to Structure Mapping

- Guided inspections/logging -> `apps/mobile/src/features/inspection`, `apps/api/src/handlers/inspections`, `apps/api/src/domain/inspection`.
- Explainable recommendations -> `apps/mobile/src/features/recommendations`, `apps/api/src/services/recommendation`, `apps/api/src/ai/`.
- Weekly planning/prioritization -> `apps/mobile/src/features/weekly-plan`, `apps/api/src/services/planning`.
- Voice processing -> `apps/mobile/src/services/voice`, `apps/api/src/voice/`.
- Vision AI -> `apps/mobile/src/features/inspection` (capture), `apps/api/src/ai/` (analysis).
- Integrations -> `apps/api/src/adapters/*`, `apps/api/src/events/`.
- Admin/support/audit -> `apps/admin-web/src/pages/*`, `apps/api/src/handlers/support`.

### Integration Points

- Client -> REST API (Cloud Run).
- API service -> Cloud Pub/Sub -> Worker service for async tasks.
- External adapters -> canonical event normalization via Pub/Sub before persistence.
- Media upload -> GCS signed URL -> Cloud Storage Notification -> Pub/Sub -> Worker (STT/Vision AI).
- Weather integration quality contract: the weather adapter shall record and expose the distance between the user's apiary coordinates and the weather data source location. When this distance exceeds a configurable threshold (default: 15 miles / 25 km), the system shall display a proximity warning on weather-derived context cards and apply a confidence penalty to weather-dependent recommendations.

## AI/ML Architecture

### Embedding Strategy for Beekeeping Domain

**What gets embedded:**
1. **Inspection observations** — user-entered text and STT transcriptions are embedded to enable semantic search across inspection history.
2. **Beekeeping knowledge base** — regional best practices, seasonal guidance documents, treatment protocols are chunked and embedded at build time. Stored in pgvector.
3. **Recommendation rationale** — embedded to enable similarity matching against past successful recommendations for similar conditions.

**Embedding model:** Vertex AI `text-embedding-005` (Embedding 2.0). 768-dimensional vectors. Batch embedding via Vertex AI API for knowledge base; real-time embedding for user observations.

**Image embeddings:** Vertex AI `multimodalembedding` for inspection photos. Enables visual similarity search.

### Recommendation Engine Architecture

```
User Request (inspection observation, weekly plan request)
    │
    ├── 1. Context Assembly (Rust service)
    │   ├── User profile + skill level
    │   ├── Hive history (recent inspections, treatments, observations)
    │   ├── Regional seasonal state (from localization data)
    │   ├── Weather + flora signals (from adapter cache)
    │   └── Telemetry signals (if connected)
    │
    ├── 2. Semantic Retrieval (pgvector)
    │   ├── Embed current observation
    │   ├── Retrieve similar past inspection outcomes (user's + regional baseline)
    │   └── Retrieve relevant knowledge base chunks
    │
    ├── 3. Recommendation Scoring (Vertex AI Gemini)
    │   ├── Structured prompt with assembled context + retrieved knowledge
    │   ├── Request: action, rationale, confidence (0-1), fallback action
    │   ├── Response parsed into typed Rust struct
    │   └── Confidence calibration: if model confidence < threshold, downgrade to safe fallback
    │
    └── 4. Response (typed recommendation contract)
        ├── action: string
        ├── rationale: string
        ├── confidence: f64
        ├── fallback_action: string
        ├── evidence_sources: Vec<EvidenceSource>
        └── skill_adapted_explanation: string
```

### Vision AI for Inspection Photos

```
Photo captured on device
    → Compressed (HEIC/WebP, max 2048px)
    → Uploaded to GCS via signed URL
    → GCS notification → Pub/Sub `media-uploaded` topic
    → Worker service:
        1. Call Vertex AI Gemini Vision with inspection-specific prompt
        2. Generate image embedding via multimodalembedding
        3. Store findings + embedding in PostgreSQL
        4. If inspection is active, push findings to recommendation context
    → Client polls or receives push notification when analysis complete
```

## Voice Architecture: Gemini STT/TTS

### Transcription Pipeline

```
Audio recorded on device (expo-av, opus format)
    → Uploaded to GCS via signed URL
    → GCS notification → Pub/Sub `media-uploaded`
    → Worker: Gemini STT (via Vertex AI)
      - Model: gemini-2.0-flash (low latency)
      - Config: language_code="en-US", field/outdoor audio profile
    → Transcription stored in inspection record
    → Structured extraction: parse into observation fields
    → Update inspection record with structured data
```

### TTS for Guidance Playback

Gemini TTS generates spoken recommendation audio for hands-busy scenarios. Pre-generate common seasonal guidance audio; dynamic generation for personalized recommendations with caching.

### Offline Voice Strategy

- Audio is always captured locally first. No network dependency for recording.
- Transcription is deferred. Audio files queue in the sync pipeline.
- On-device fallback: for MVP, offline transcription is not required. Users review and manually tag voice notes after sync.
- Latency target: STT transcription completes within 5 seconds of upload for files under 60 seconds.

## Event Architecture: Cloud Pub/Sub

### Pub/Sub Topics (MVP)

| Topic | Publishers | Subscribers | Purpose |
|-------|-----------|-------------|---------|
| `media-uploaded` | GCS notification | Worker: STT, Vision AI, embedding | Process uploaded media |
| `inspection-events` | API service | Worker: recommendation recompute, audit log | Inspection lifecycle |
| `telemetry-ingested` | API service (adapters) | Worker: normalize, update context cache | External sensor/weather data |
| `notification-dispatch` | API service, workers | Worker: push notification delivery | Notification fan-out |
| `embedding-requests` | API service, workers | Worker: Vertex AI embedding generation | Async embedding pipeline |

Cloud Tasks for scheduled/delayed work: notification delivery with suppression windows, sync retry, daily seasonal context refresh.

## Offline Sync Architecture

```
Mobile Device                          Cloud
┌─────────────────┐                   ┌──────────────┐
│ expo-sqlite      │                   │ Cloud Run API│
│ ┌──────────────┐ │    ──sync──>     │              │
│ │ Local DB     │ │                   │ Cloud SQL    │
│ │ (full schema)│ │    <──pull──     │ (PostgreSQL) │
│ ├──────────────┤ │                   └──────────────┘
│ │ Mutation     │ │
│ │ Queue        │ │
│ │ (outbox tbl) │ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Media Staging│ │   ──upload──>    GCS bucket
│ │ (file system)│ │
│ └──────────────┘ │
└─────────────────┘
```

**Sync protocol:**
1. Client stores all mutations in an outbox table with monotonic `sequence_id` and `created_at`.
2. On connectivity, client sends mutations in order to `POST /sync/push` endpoint.
3. Server applies mutations transactionally, returns `server_sequence_id` and any conflicts.
4. Client pulls server changes since last known `server_sequence_id` via `GET /sync/pull?since={seq}`.
5. Conflict resolution rules:
   - Active inspection edits: client-wins (preserve in-field work)
   - Completed inspections modified by another user: server-wins with conflict notification
   - Concurrent recommendation feedback: merge (both inputs preserved)
   - Profile/settings: last-write-wins

**What's available offline:** full inspection workflow, cached recommendations (degraded confidence), hive/apiary browsing, voice and photo capture, weekly plan viewing.

**What requires connectivity:** fresh recommendation generation, STT/TTS, Vision AI, telemetry/weather refresh, push notifications.

## Cost and Scaling Analysis

### MVP Monthly Cost Estimate (50-200 active users)

| Service | Configuration | Estimated Monthly Cost |
|---------|--------------|----------------------|
| Cloud Run (API) | 1 instance, 1 vCPU, 1 GiB, always-on | $30-50 |
| Cloud Run (Worker) | 0 min instances, scales on demand | $5-15 |
| Cloud SQL | db-custom-1-3840 (prod) | $30-50 |
| Cloud Memorystore | Basic 1 GiB | $35 |
| Cloud Storage | <10 GiB media | $1-2 |
| Pub/Sub | <1M messages/month | $0-1 |
| Vertex AI (Gemini) | ~1000 recommendation calls/month | $5-15 |
| Vertex AI (Embeddings) | ~5000 embeddings/month | $1-2 |
| Vertex AI (Vision) | ~500 photo analyses/month | $3-5 |
| Vertex AI (STT) | ~100 hours audio/month | $10-20 |
| Firebase Auth | Free tier (50k MAU) | $0 |
| **Total** | | **$120-195/month** |

### Scaling Leverage Points

1. **Cloud Run autoscaling** — services scale to zero in dev, scale horizontally in prod. Rust binary's low memory footprint (50-100 MiB) means high density per instance.
2. **Rust performance** — a single Cloud Run instance handles 5-10x the throughput of equivalent Node.js, delaying horizontal scaling needs.
3. **Pub/Sub decoupling** — media processing, embedding generation, and notification delivery scale independently of API latency.
4. **pgvector over dedicated vector DB** — avoids separate Pinecone/Weaviate cost. Migrate to Vertex AI Vector Search only if vector count exceeds millions.
5. **Cloud SQL read replicas** — add when read load exceeds single-instance capacity. No application changes needed.
6. **Gemini model tiering** — `gemini-2.0-flash` for STT and quick analyses; `gemini-2.0-pro` for complex recommendation scoring.

### Cost Risks

- STT costs scale with audio duration. Cap recording at 5 minutes per segment.
- Vision AI costs scale with photo count. Limit to 5 analyzed photos per inspection in MVP.
- Cloud SQL is the largest fixed cost. Use db-f1-micro for dev/staging.

## Key Rust Crate Recommendations

| Purpose | Crate | Rationale |
|---------|-------|-----------|
| HTTP framework | `axum` 0.8 | Best ergonomics, tower middleware ecosystem |
| Async runtime | `tokio` 1.x | Industry standard, required by axum |
| Database | `sqlx` 0.8 | Compile-time checked queries, native PostgreSQL |
| Serialization | `serde` + `serde_json` | Standard, zero-cost deserialization |
| OpenAPI | `utoipa` + `utoipa-swagger-ui` | Generates OpenAPI from handler annotations |
| HTTP client | `reqwest` | For Vertex AI API calls, external integrations |
| JWT validation | `jsonwebtoken` | Firebase ID token verification |
| Tracing | `tracing` + `tracing-subscriber` + `tracing-opentelemetry` | Structured logging, Cloud Trace |
| Error handling | `thiserror` + `anyhow` | Domain errors + internal errors |
| Configuration | `config` | Environment-based config with defaults |
| GCP auth | `google-cloud-auth` | Service account credential management |
| pgvector | `pgvector` (sqlx feature) | Vector similarity queries |
| Testing | `cargo-nextest` + `testcontainers` | Fast tests + PostgreSQL integration tests |
| UUID | `uuid` v7 | Time-ordered ID generation |

## Architecture Validation Results

### Coherence Validation ✅

- Decisions are compatible: mobile-first Expo + GraphQL + Supabase Auth/Postgres + domain-module API.
- Patterns align across naming, data formats, events, and error handling.
- Structure enforces boundaries and reduces cross-layer coupling.

### Requirements Coverage Validation ✅

- Core PRD capabilities map to explicit modules/features.
- Offline, trust/explainability, RBAC, auditability, and observability are covered architecturally.

### Implementation Readiness Validation ✅

- Critical choices and sequence are explicit enough for consistent AI-agent implementation.
- Project structure and conventions are concrete and enforceable through CI.

### Gap Analysis Results

- **Critical gaps:** none identified.
- **Important gaps:** finalize concrete external providers and final API hosting target during infra bootstrap.
- **Nice-to-have:** expand ADR index and runbooks after first implementation stories.

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION  
**Confidence Level:** High

### Implementation Handoff

- Follow this document as source of truth for implementation decisions.
- Extend shared schema/types first when introducing new features.
- Preserve service boundaries and event contracts.
