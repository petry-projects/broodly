---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'revised'
completedAt: '2026-03-15'
revisedAt: '2026-03-21'
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
The NFR set drives a reliability-first, trust-first architecture: low-latency mobile interactions, cache-first reads with local media staging, explicit confidence signaling, encryption in transit/at rest, RBAC, auditability, and observability for recommendation/notification pipelines. These requirements require clear service boundaries, resilient client state handling, and robust telemetry around confidence and action outcomes.

**Scale & Complexity:**
The project is medium-high complexity due to multi-persona workflows, explainable recommendations, optional real-time integrations, and strong traceability constraints.

- Primary domain: mobile decision-support platform with backend intelligence services
- Complexity level: high (product complexity), medium (initial operational scale)
- Estimated architectural components: 14-18 bounded components/services

### Technical Constraints & Dependencies

- Mobile-first operation with cache-first reads and local media staging (full offline sync deferred post-MVP)
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

Mobile-first application with cloud backend services, publishing to iOS, Android, and web via React Native for Web. Single Expo codebase targets all platforms. This is based on PRD classification (`mobile_app`) with web delivery via Expo's built-in web support.

### Starter Options Considered

- `create-expo-app` (Expo managed workflow) — fastest and most consistent for cross-platform iOS/Android delivery, OTA updates, and mature React Native ecosystem.
- React Native CLI baseline — higher flexibility but more native configuration overhead in MVP stage.
- Flutter starter — strong option, but lower alignment with existing React-oriented preference and lower near-term velocity for this context.

### Selected Starter: Expo + TypeScript (Mobile + Web)

**Rationale for Selection:**
Best fit for rapid, reliable cross-platform MVP delivery with camera/mic/location support, React Native for Web publishing, and maintainable development across iOS/Android/web from a single codebase.

**Initialization Command:**

```bash
npx create-expo-app@latest broodly --template
```

### Verified Current Versions

- `expo`: 55.0.6
- `create-expo-app`: 3.5.3
- `react-native`: 0.84.1
- `react-native-web`: 0.19.x (React Native for Web)
- `typescript`: 5.9.3
- Go: 1.24 (stable)
- `gqlgen`: 0.17.x (GraphQL server code generation)
- `sqlc`: 1.27.x (type-safe SQL code generation)
- `chi`: 5.x (HTTP router / middleware)
- Google Cloud SDK: latest
- `@react-native-firebase/app`: 21.x (client-side Firebase integration)

### Architectural Decisions Provided by Starter

**Language & Runtime:**
TypeScript-based React Native runtime on Expo managed workflow, targeting iOS, Android, and web (via React Native for Web).

**Styling Solution:**
React Native StyleSheet primitives by default; design system layer can be added without changing core starter shape. Platform-aware styles for web-specific layouts.

**Build Tooling:**
Expo toolchain with Metro bundling, platform targets (ios, android, web), and managed app lifecycle.

**Testing Framework:**
Jest-compatible baseline and React Native testing ecosystem compatibility.

**Code Organization:**
Feature-oriented `app/` or `src/` structure with modular services for recommendation, telemetry, and notifications.

**Development Experience:**
Fast local preview, OTA workflow support, and low-friction iteration across iOS/Android/web.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Primary product is Expo React Native, publishing to iOS, Android, and web via React Native for Web (single codebase).
- API strategy is GraphQL with schema-first design (`gqlgen` in Go), generated TypeScript client types via GraphQL Code Generator.
- Auth uses Firebase Authentication (Google + Apple Sign-In only, no passwords).
- Primary data store is Cloud SQL for PostgreSQL with application-level authorization. GCP is the sole hosting platform.
- Backend is Go (chi + gqlgen) deployed as a containerized microservice on Google Cloud Run (free tier for MVP).
- MVP uses cache-first reads with local media staging; full offline sync is deferred post-MVP.
- Recommendation contract is mandatory in GraphQL responses: action + rationale + confidence + fallback.
- AI/ML inference uses Vertex AI Embedding 2.0 (multimodal: text, image, audio, video) and Gemini for recommendation scoring.

**Important Decisions (Shape Architecture):**
- Backend separates GraphQL API service and async worker service (both Go, separate Cloud Run containers).
- Media and export storage uses Google Cloud Storage.
- Asynchronous processing uses Cloud Pub/Sub for event dispatch and Cloud Run jobs for batch work.
- Voice processing uses Gemini STT/TTS via Vertex AI API.
- Observability uses Cloud Logging, Cloud Trace, and Cloud Monitoring with structured audit events.

**Deferred Decisions (Post-MVP):**
- Full offline sync engine (bidirectional mutation queue, conflict resolution).
- GraphQL subscriptions for real-time updates.
- Advanced route optimization across many apiaries.
- Multi-region Cloud Run deployment.
- Cloud Spanner evaluation if write-heavy multi-region becomes necessary.

### Data Architecture

- **Primary store:** Cloud SQL for PostgreSQL (managed, HA-capable, automatic backups). PostgreSQL 16 with pgvector extension.
- **Authorization model:** application-level RBAC enforced in Go middleware; no RLS dependency. Authorization checks are composable middleware functions validated at the request boundary and query construction layer. All database queries include `WHERE tenant_id = $1` as a mandatory parameter, enforced by repository interface signatures.
- **Domain schema:** users, apiaries, hives, inspections, recommendations, tasks, integrations, events, audit.
- **Validation:** GraphQL schema validation at API boundary + DB constraints + Go type system compile-time guarantees via `sqlc`.
- **Migrations:** versioned SQL migrations via `golang-migrate`, forward-only in production. Migration CI gate blocks deployment on unapplied or conflicting migrations.
- **Caching:** `@tanstack/react-query` persistent cache for client-side cache-first reads; server-side read cache via Cloud Memorystore (Redis) for context assembly and recommendation input pre-computation.
- **Object storage:** Google Cloud Storage bucket for inspection media (photos, voice recordings), data exports, and backup archives. Signed URLs for secure client upload/download. Lifecycle rules: move to Nearline after 90 days, Archive after 1 year.
- **Embedding store:** PostgreSQL with `pgvector` extension on Cloud SQL for semantic search vectors. Vertex AI Embedding 2.0 (multimodal) generates unified embeddings for text, images, audio, and video; stored and queried via pgvector cosine similarity.
- **Longitudinal data strategy:** inspection history, recommendation traces, and media records shall be partitioned by time period (e.g., by season/year). The recommendation engine shall use a rolling window of recent history (configurable, default: current season plus prior season) for real-time queries, with older history available for trend analysis via async computation. Media storage shall support tiered retention: full-resolution for current season, compressed for prior seasons, with user-controlled archival and deletion.
- **Analytics data layer:** maintain a separate, anonymized analytical store optimized for aggregation queries across regions, seasons, and management patterns. Design schema to support cohort-level outcome analysis without exposing individual user data. This layer is the foundation for recommendation model training, regional baselines, and future research partnerships.

### Authentication & Security

- **Authentication:** Firebase Authentication (Google Sign-In, Apple Sign-In). Social login only — no passwords. Firebase Admin SDK validates ID tokens server-side via Go JWT validation against Google public keys (`golang-jwt/jwt` package).
- **Authorization:** RBAC enforced in Go chi middleware. Roles: owner, collaborator (read-only), support. Permission checks occur at the resolver/handler level before any data access.
- **Token strategy:** Firebase ID tokens (short-lived, 1 hour) + Firebase refresh tokens (client-managed rotation). Server validates JWT signature, expiry, and claims on every request.
- **API security:** rate limiting via Cloud Armor or chi middleware (`httprate`), per-user and per-device limits. Request size limits enforced. API keys for integration partners.
- **Encryption:** TLS in transit (Cloud Run default), Cloud SQL encryption at rest (Google-managed keys, option for CMEK). Cloud Storage encryption at rest. Sensitive fields (location coordinates, media metadata) encrypted at application level with envelope encryption via Cloud KMS.
- **Auditability:** immutable audit event log in PostgreSQL with append-only table, covering recommendation generation, user actions, and access changes. Audit records include `event_id`, `event_type`, `actor_id`, `tenant_id`, `occurred_at`, `payload_version`, `payload` (JSONB).

### API & Communication Patterns

- **API pattern:** GraphQL with schema-first design. `gqlgen` generates Go resolvers from `.graphql` schema files. TypeScript client types generated via `@graphql-codegen/cli`. Consistent error handling via GraphQL error extensions.
- **Schema evolution:** additive field changes with `@deprecated` directive. Breaking changes via schema versioning strategy (new types/fields, deprecated old ones).
- **Error handling:** typed domain errors returned via GraphQL error extensions with stable machine-readable `code`, human `message`, and `retryable` boolean. Go `errors` package with custom error types.
- **Service communication:** synchronous request/response for interactive GraphQL queries/mutations. Cloud Pub/Sub for async event dispatch (telemetry recompute, notification triggers, embedding generation, media processing). Cloud Tasks for delayed/scheduled work.
- **Integration contract:** adapters normalize weather/flora/sensor data into canonical internal events published to Pub/Sub topics. Each adapter is a separate Go package with a shared `ExternalSignal` interface.
- **Voice payload:** audio uploaded to Cloud Storage via signed URL; Cloud Storage notification triggers STT processing via Pub/Sub; transcription result written back to inspection record.

### Frontend Architecture

- **Single codebase:** Expo + TypeScript + React Native for Web. One codebase targets iOS, Android, and web. `@react-native-firebase/auth` for authentication. `expo-file-system` for media staging before upload.
- **State model:** server state managed via `@tanstack/react-query` with persistent query cache for cache-first reads. Workflow/UI state in Zustand stores. GraphQL client via `urql` or `@apollo/client` with TanStack Query integration.
- **Routing:** Expo Router for all platforms (mobile + web).
- **Performance:** route/screen code splitting, query prefetching for guided flows, media compression (HEIC/WebP, opus audio) before upload. Platform-aware responsive layouts for web.
- **MVP connectivity model:** cache-first reads via TanStack Query persistent cache. Local media staging (photos/voice captured locally, uploaded when connected). No offline writes — inspections require connectivity to save. Clear "offline" indicator in UI. Full offline sync engine deferred to post-MVP.

### Infrastructure & Deployment

- **Hosting platform:** Google Cloud Platform (GCP) exclusively. All services, storage, AI/ML, and infrastructure on GCP.
- **Mobile:** Expo EAS channels for build/distribution (iOS, Android).
- **Web:** Expo web build deployed to Firebase Hosting (CDN-backed static deployment). Same codebase as mobile via React Native for Web.
- **API service:** Go binary in distroless container on Google Cloud Run (free tier for MVP, min 0 instances for dev). CPU always-allocated for consistent latency. 512 MiB memory, 1 vCPU baseline; autoscale to 10 instances.
- **Async worker service:** Go binary in container on Cloud Run triggered by Pub/Sub push subscriptions. Handles: media processing, STT transcription, embedding generation, notification dispatch, telemetry normalization.
- **Database:** Cloud SQL for PostgreSQL 16 with pgvector extension. db-f1-micro for dev, db-custom-2-4096 for prod. Automated backups, point-in-time recovery enabled.
- **Object storage:** Google Cloud Storage bucket (`broodly-media-{env}`) with lifecycle rules. Signed URL upload/download with 15-minute expiry.
- **Cache:** Cloud Memorystore (Redis) basic tier, 1 GiB for prod. Used for recommendation context pre-assembly and session rate limiting.
- **AI/ML:** Vertex AI Embedding 2.0 multimodal (unified text, image, audio, video embeddings), Gemini for STT/TTS, Gemini Vision for inspection photo analysis. All accessed via Vertex AI API from Go backend using `google-cloud-go` SDK with service account credentials.
- **Event infrastructure:** Cloud Pub/Sub topics: `inspection-events`, `media-uploaded`, `telemetry-ingested`, `notification-dispatch`, `embedding-requests`. Dead-letter topics with Cloud Monitoring alerts on DLQ depth. Cloud Storage Notifications on media bucket trigger `media-uploaded` topic.
- **CI/CD:** GitHub Actions monorepo pipeline. Go: `go vet`, `golangci-lint`, `go test`, migration guard. TypeScript: lint, type-check, test. Docker build and push to Artifact Registry. Cloud Run deploy via `gcloud run deploy` or Terraform.
- **Infrastructure-as-Code:** Terraform for all GCP resources. Separate state files for dev/staging/prod.
- **Environments:** dev/staging/prod with strict IAM separation, separate GCP projects per environment, Secret Manager for credentials and API keys.
- **Observability:** Cloud Logging (structured JSON logs via `slog`), Cloud Trace (OpenTelemetry integration via `go.opentelemetry.io/otel`), Cloud Monitoring dashboards and alerts for: API latency p50/p95/p99, error rates, Pub/Sub backlog depth, Cloud SQL connection pool utilization, recommendation generation latency.

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialize monorepo structure; scaffold Expo app (with web target) and Go API module with chi + gqlgen hello-world.
2. Provision GCP project with Terraform: Cloud SQL, Cloud Run, GCS bucket, Firebase Auth project.
3. Implement Firebase Auth integration (Expo client + Go JWT validation).
4. Implement PostgreSQL schema with golang-migrate migrations; core domain tables.
5. Build GraphQL schema and resolvers for core domain: hives, apiaries, inspections.
6. Implement cache-first reads (TanStack Query persistent cache) and local media staging.
7. Integrate Vertex AI Embedding 2.0 (multimodal): embedding pipeline, recommendation scoring, vision analysis.
8. Implement Gemini STT for voice logging; Pub/Sub media processing pipeline.
9. Deliver mobile + web inspection and recommendation workflows end-to-end.

**Cross-Component Dependencies:**
- Recommendation quality depends on API freshness, normalized integrations, and embedding index completeness.
- Support/audit UX depends on complete event and action history in audit tables.
- Vision AI and STT depend on GCS upload pipeline and Pub/Sub event flow.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database:** snake_case table/column names; UUID `id`; foreign keys as `<entity>_id`; indexes as `idx_<table>_<columns>`.

**API:** GraphQL types in PascalCase; fields in camelCase; event names as `domain.entity.action.v1`.

**Code:** components/classes in PascalCase; functions/variables/hooks in camelCase; files in kebab-case (framework exceptions allowed).

### Structure Patterns

- Monorepo with `apps/` and `packages/`.
- Runtime separation: `apps/mobile` (iOS, Android, web via React Native for Web), `apps/api`.
- Shared schema/types/config in `packages/*`.
- Unit tests co-located, integration/e2e in top-level `tests/`.

### Format Patterns

- API timestamps are ISO-8601 UTC strings.
- API IDs are opaque UUID strings.
- GraphQL fields use camelCase.
- DB remains snake_case; mapping occurs in data access layer (Go struct tags).

### Communication Patterns

- Required event envelope: `eventId`, `eventType`, `occurredAt`, `tenantId`, `payloadVersion`, `payload`.
- Event consumers are idempotent by `eventId`.
- MVP: all mutations require connectivity. Cache-first reads provide fast UI with stale-while-revalidate semantics.
- Post-MVP: offline queue replay order will be deterministic; conflicts will resolve via policy order: hard constraint > server truth > merge > manual resolution.

### Process Patterns

- All domain errors expose stable code and retryability metadata.
- Async views use unified states: `idle|loading|success|error`.
- Recommendation/notification failures are always logged and auditable.

### Enforcement Guidelines

- Shared contracts package is the source of truth for cross-app types.
- CI enforces lint, type safety, schema compatibility, migration safety, and tests.
- Architecture deviations require ADR documentation before merge.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
broodly/
├── apps/
│   ├── mobile/                     # Expo app (iOS, Android, Web via React Native for Web)
│   │   ├── app/                    # Expo Router screens (all platforms)
│   │   ├── src/features/           # Feature modules (inspection, recommendations, planning)
│   │   ├── src/services/           # GraphQL client, media upload
│   │   ├── src/store/              # Zustand stores, TanStack Query cache
│   │   ├── src/platform/           # Platform-aware components (web vs native)
│   │   └── package.json
│   └── api/                        # Go GraphQL API service
│       ├── cmd/
│       │   ├── server/main.go      # API server entrypoint
│       │   └── worker/main.go      # Async worker entrypoint
│       ├── graph/
│       │   ├── schema/             # GraphQL .graphql schema files
│       │   ├── model/              # Generated Go types (gqlgen)
│       │   └── resolver/           # GraphQL resolvers by domain
│       ├── internal/
│       │   ├── domain/             # Core domain types and business logic
│       │   ├── service/            # Application services (recommendation engine, planning)
│       │   ├── adapter/            # External integrations (weather, flora, telemetry)
│       │   ├── ai/                 # Vertex AI client, embedding generation, vision analysis
│       │   ├── voice/              # Gemini STT/TTS integration
│       │   ├── event/              # Pub/Sub publishers and subscribers
│       │   ├── repository/         # sqlc queries, repository interfaces and implementations
│       │   ├── auth/               # Firebase token validation, RBAC middleware
│       │   └── middleware/         # Rate limiting, tracing, error handling
│       ├── migrations/             # SQL migrations (golang-migrate)
│       ├── sqlc.yaml               # sqlc configuration
│       ├── gqlgen.yml              # gqlgen configuration
│       ├── go.mod
│       ├── Dockerfile
│       └── Dockerfile.worker
├── packages/
│   ├── graphql-types/              # Generated TypeScript types from GraphQL schema
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
    ├── api/                        # Generated GraphQL schema docs
    └── runbooks/
```

### Architectural Boundaries

- `apps/api` is the only client-facing GraphQL API surface.
- Mobile and web clients never access DB directly.
- Domain modules communicate via explicit interfaces/events only.
- Recommendation, inspection, planning, and notification ownership remains separate.

### Requirements to Structure Mapping

- Guided inspections/logging -> `apps/mobile/src/features/inspection`, `apps/api/graph/resolver/inspection`, `apps/api/internal/domain/inspection`.
- Explainable recommendations -> `apps/mobile/src/features/recommendations`, `apps/api/internal/service/recommendation`, `apps/api/internal/ai/`.
- Weekly planning/prioritization -> `apps/mobile/src/features/weekly-plan`, `apps/api/internal/service/planning`.
- Voice processing -> `apps/mobile/src/services/voice`, `apps/api/internal/voice/`.
- Vision AI -> `apps/mobile/src/features/inspection` (capture), `apps/api/internal/ai/` (analysis).
- Integrations -> `apps/api/internal/adapter/*`, `apps/api/internal/event/`.
- Admin/support/audit -> `apps/mobile/src/features/admin` (web-optimized views), `apps/api/graph/resolver/support`.

### Integration Points

- Client -> GraphQL API (Cloud Run).
- API service -> Cloud Pub/Sub -> Worker service for async tasks.
- External adapters -> canonical event normalization via Pub/Sub before persistence.
- Media upload -> GCS signed URL -> Cloud Storage Notification -> Pub/Sub -> Worker (STT/Vision AI).
- Weather integration quality contract: the weather adapter shall record and expose the distance between the user's apiary coordinates and the weather data source location. When this distance exceeds a configurable threshold (default: 15 miles / 25 km), the system shall display a proximity warning on weather-derived context cards and apply a confidence penalty to weather-dependent recommendations.

## AI/ML Architecture

### Embedding Strategy for Beekeeping Domain

**What gets embedded:**
1. **Inspection observations** — user-entered text and STT transcriptions are embedded to enable semantic search across inspection history.
2. **Inspection photos** — inspection images are embedded in the same vector space as text, enabling cross-modal similarity search (e.g., find text descriptions similar to a photo, or photos similar to a text query).
3. **Inspection audio** — voice recordings are embedded alongside text and images for unified multimodal retrieval.
4. **Beekeeping knowledge base** — regional best practices, seasonal guidance documents, treatment protocols are chunked and embedded at build time. Stored in pgvector.
5. **Recommendation rationale** — embedded to enable similarity matching against past successful recommendations for similar conditions.

**Embedding model:** Vertex AI Embedding 2.0 (`multimodalembedding@001`) — a single multimodal model that embeds text, images, audio, and video into a shared vector space. This enables cross-modal similarity search across all content types. Batch embedding via Vertex AI API for knowledge base; real-time embedding for user observations and media.

### Recommendation Engine Architecture

```
User Request (inspection observation, weekly plan request)
    │
    ├── 1. Context Assembly (Go service)
    │   ├── User profile + skill level
    │   ├── Hive history (recent inspections, treatments, observations)
    │   ├── Regional seasonal state (from localization data)
    │   ├── Weather + flora signals (from adapter cache)
    │   └── Telemetry signals (if connected)
    │
    ├── 2. Multimodal Semantic Retrieval (pgvector)
    │   ├── Embed current observation (text, photos, audio via Embedding 2.0)
    │   ├── Cross-modal retrieval: find similar past inspections across text + image + audio
    │   └── Retrieve relevant knowledge base chunks
    │
    ├── 3. Recommendation Scoring (Vertex AI Gemini)
    │   ├── Structured prompt with assembled context + retrieved knowledge
    │   ├── Request: action, rationale, confidence (0-1), fallback action
    │   ├── Response parsed into typed Go struct
    │   └── Confidence calibration: if model confidence < threshold, downgrade to safe fallback
    │
    └── 4. Response (typed recommendation contract via GraphQL)
        ├── action: String
        ├── rationale: String
        ├── confidence: Float
        ├── fallbackAction: String
        ├── evidenceSources: [EvidenceSource]
        └── skillAdaptedExplanation: String
```

### Vision AI for Inspection Photos

```
Photo captured on device
    → Compressed (HEIC/WebP, max 2048px)
    → Uploaded to GCS via signed URL
    → GCS notification → Pub/Sub `media-uploaded` topic
    → Worker service (Go):
        1. Call Vertex AI Gemini Vision with inspection-specific prompt
        2. Generate image embedding via Embedding 2.0 multimodal (shared vector space with text/audio)
        3. Store findings + embedding in PostgreSQL (pgvector)
        4. If inspection is active, push findings to recommendation context
    → Client polls or receives push notification when analysis complete
```

## Voice Architecture: Gemini STT/TTS

### Transcription Pipeline

```
Audio recorded on device (expo-av, opus format)
    → Uploaded to GCS via signed URL
    → GCS notification → Pub/Sub `media-uploaded`
    → Worker (Go): Gemini STT (via Vertex AI)
      - Model: gemini-2.0-flash (low latency)
      - Config: language_code="en-US", field/outdoor audio profile
    → Generate audio embedding via Embedding 2.0 multimodal (shared vector space)
    → Transcription stored in inspection record
    → Structured extraction: parse into observation fields
    → Update inspection record with structured data + embedding
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

## MVP Connectivity & Caching Strategy

```
Mobile/Web Client                      Cloud
┌─────────────────┐                   ┌──────────────┐
│ TanStack Query   │                   │ Cloud Run API│
│ ┌──────────────┐ │    ──query──>    │ (GraphQL)    │
│ │ Persistent   │ │                   │              │
│ │ Query Cache  │ │    <──data──     │ Cloud SQL    │
│ │ (cache-first)│ │                   │ (PostgreSQL) │
│ └──────────────┘ │                   └──────────────┘
│ ┌──────────────┐ │
│ │ Media Staging│ │   ──upload──>    GCS bucket
│ │ (file system)│ │
│ └──────────────┘ │
└─────────────────┘
```

**MVP caching strategy:**
1. Cache-first reads via TanStack Query persistent cache with stale-while-revalidate.
2. All mutations (creating/editing inspections, submitting feedback) require connectivity.
3. Media (photos, voice) captured locally via `expo-file-system`, uploaded to GCS when connected.
4. Clear "offline" indicator when connectivity is lost. Read-only cached data remains accessible.
5. No bidirectional sync, no conflict resolution, no mutation queue in MVP.

**What's available without connectivity:** cached data browsing (hives, apiaries, past inspections, recommendations), photo/voice capture (staged locally).

**What requires connectivity:** all writes (new inspections, edits, feedback), fresh recommendation generation, STT/TTS, Vision AI, telemetry/weather refresh, push notifications.

**Post-MVP: Full Offline Sync** (deferred)
- Bidirectional sync engine with mutation outbox queue
- Conflict resolution policies (client-wins for active inspections, server-wins for completed, merge for feedback)
- Conflict notification and collaborator collision handling
- Full offline inspection workflow

## Cost and Scaling Analysis

### MVP Monthly Cost Estimate (50-200 active users)

| Service | Configuration | Estimated Monthly Cost |
|---------|--------------|----------------------|
| Cloud Run (API) | Go container, 1 vCPU, 512 MiB, free tier for MVP | $0-15 |
| Cloud Run (Worker) | 0 min instances, scales on demand | $5-15 |
| Cloud SQL | db-custom-1-3840 (prod) | $30-50 |
| Cloud Memorystore | Basic 1 GiB | $35 |
| Cloud Storage | <10 GiB media | $1-2 |
| Pub/Sub | <1M messages/month | $0-1 |
| Vertex AI (Gemini) | ~1000 recommendation calls/month | $5-15 |
| Vertex AI (Embedding 2.0 multimodal) | ~5000 embeddings/month (text+image+audio) | $1-3 |
| Vertex AI (Vision) | ~500 photo analyses/month | $3-5 |
| Vertex AI (STT) | ~100 hours audio/month | $10-20 |
| Firebase Auth | Free tier (50k MAU) | $0 |
| **Total** | | **$85-165/month** |

### Scaling Leverage Points

1. **Cloud Run autoscaling** — services scale to zero in dev, scale horizontally in prod. Go binary's low memory footprint (50-100 MiB) means high density per instance.
2. **Go performance** — a single Cloud Run instance handles 3-5x the throughput of equivalent Node.js, delaying horizontal scaling needs. Fast cold starts (~100ms).
3. **Pub/Sub decoupling** — media processing, embedding generation, and notification delivery scale independently of API latency.
4. **pgvector over dedicated vector DB** — avoids separate Pinecone/Weaviate cost. Migrate to Vertex AI Vector Search only if vector count exceeds millions.
5. **Cloud SQL read replicas** — add when read load exceeds single-instance capacity. No application changes needed.
6. **Gemini model tiering** — `gemini-2.0-flash` for STT and quick analyses; `gemini-2.0-pro` for complex recommendation scoring.
7. **Unified multimodal embedding** — single Embedding 2.0 model handles all content types, simplifying the pipeline and reducing API call overhead vs separate models.

### Cost Risks

- STT costs scale with audio duration. Cap recording at 5 minutes per segment.
- Vision AI costs scale with photo count. Limit to 5 analyzed photos per inspection in MVP.
- Cloud SQL is the largest fixed cost. Use db-f1-micro for dev/staging.

## Key Go Package Recommendations

| Purpose | Package | Rationale |
|---------|---------|-----------|
| HTTP router | `go-chi/chi` v5 | Lightweight, composable middleware, stdlib-compatible |
| GraphQL server | `99designs/gqlgen` | Schema-first code generation, type-safe resolvers |
| Database queries | `sqlc-dev/sqlc` | Compile-time type-safe SQL, generates Go code from queries |
| Database driver | `jackc/pgx` v5 | High-performance PostgreSQL driver, pgvector support |
| Migrations | `golang-migrate/migrate` | Versioned SQL migrations, CLI + library |
| JWT validation | `golang-jwt/jwt` v5 | Firebase ID token verification |
| HTTP client | `net/http` (stdlib) | For Vertex AI API calls, external integrations |
| GCP SDK | `cloud.google.com/go` | Native GCP service clients (Pub/Sub, Storage, Vertex AI) |
| Logging | `log/slog` (stdlib) | Structured JSON logging, Cloud Logging compatible |
| Tracing | `go.opentelemetry.io/otel` | OpenTelemetry integration, Cloud Trace |
| Configuration | `caarlos0/env` | Environment-based config with struct tags |
| pgvector | `pgvector/pgvector-go` | Vector similarity queries with pgx |
| Testing | `stretchr/testify` + `testcontainers/testcontainers-go` | Assertions + PostgreSQL integration tests |
| UUID | `google/uuid` | UUID v7 time-ordered ID generation |

## Architecture Validation Results

### Coherence Validation ✅

- Decisions are compatible: mobile-first Expo (iOS/Android/Web via React Native for Web) + GraphQL (gqlgen) + Firebase Auth + Cloud SQL PostgreSQL + Go API on Cloud Run.
- Patterns align across naming, data formats, events, and error handling.
- Structure enforces boundaries and reduces cross-layer coupling.
- Unified Vertex AI Embedding 2.0 multimodal model simplifies embedding pipeline across text, image, audio.

### Requirements Coverage Validation ✅

- Core PRD capabilities map to explicit modules/features.
- Trust/explainability, RBAC, auditability, and observability are covered architecturally.
- Offline sync descoped for MVP; cache-first reads + local media staging cover core field usability.
- Web delivery via React Native for Web covers admin/support surfaces without a separate app.

### Implementation Readiness Validation ✅

- Critical choices and sequence are explicit enough for consistent AI-agent implementation.
- Project structure and conventions are concrete and enforceable through CI.
- GCP as sole hosting platform eliminates multi-vendor ambiguity.

### Gap Analysis Results

- **Critical gaps:** none identified.
- **Important gaps:** validate React Native for Web compatibility for admin-specific views during early implementation.
- **Post-MVP planning:** full offline sync engine design should begin after MVP validation with field users.
- **Nice-to-have:** expand ADR index and runbooks after first implementation stories.

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** High

### Implementation Handoff

- Follow this document as source of truth for implementation decisions.
- Extend GraphQL schema and shared types first when introducing new features.
- Preserve service boundaries and event contracts.
- All hosting on GCP. Cloud Run (free tier) for MVP API and worker services.
