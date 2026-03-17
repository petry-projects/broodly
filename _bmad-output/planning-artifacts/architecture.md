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
- `@supabase/supabase-js`: 2.99.1

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
- API strategy is GraphQL-first with a single typed schema contract.
- Auth and primary data platform use Supabase Auth + PostgreSQL with RLS authorization.
- Mobile experience is offline-first with deterministic sync and conflict handling.
- Recommendation contract is mandatory in API responses: action + rationale + confidence + fallback.

**Important Decisions (Shape Architecture):**
- Backend separates GraphQL API gateway and domain modules (recommendations, inspections, planning, notifications).
- Asynchronous integration and notification workflows use events.
- Observability includes structured logs, traces, and audit events.
- Admin web focuses on support, audit, integration health, and settings.

**Deferred Decisions (Post-MVP):**
- Non-critical real-time subscriptions.
- Advanced route optimization across many apiaries.
- Multi-region deployment strategy.

### Data Architecture

- **Primary store:** PostgreSQL (Supabase managed).
- **Authorization model:** tenant + role-scoped Row-Level Security.
- **Domain schema:** users, apiaries, hives, inspections, recommendations, tasks, integrations, events, audit.
- **Validation:** GraphQL boundary validation + DB constraints.
- **Migrations:** versioned SQL migrations, forward-only in production.
- **Caching:** persisted client cache for offline behavior and short-lived API read cache for context assembly.

### Authentication & Security

- **Authentication:** Supabase Auth (email/password with optional OAuth).
- **Authorization:** RBAC plus policy checks in API and RLS at data layer.
- **Token strategy:** short-lived access token + refresh rotation.
- **API security:** persisted operations for mobile, query depth/complexity limits, and per-user/device rate limits.
- **Encryption:** TLS in transit, managed encryption at rest, extra safeguards for sensitive location/media metadata.
- **Auditability:** immutable recommendation/action timeline for support replay and trust analysis.

### API & Communication Patterns

- **API pattern:** GraphQL-first BFF for mobile and admin clients.
- **Schema evolution:** additive changes with explicit deprecations.
- **Error handling:** typed domain errors with stable machine codes.
- **Service communication:** sync request/response for interactive paths; async events for telemetry, recompute, notifications.
- **Integration contract:** adapters normalize weather/flora/sensor data into canonical internal events.

### Frontend Architecture

- **Mobile app (primary):** Expo + TypeScript + feature-sliced modules.
- **Admin web companion:** React + Vite + TypeScript.
- **State model:** server state in GraphQL cache, workflow/UI state in lightweight local stores.
- **Routing:** Expo Router (mobile), React Router (web).
- **Performance:** route/screen code splitting, query prefetching for guided flows, bounded cache, media compression before upload.

### Infrastructure & Deployment

- **Mobile:** Expo EAS channels for build/distribution.
- **Web admin:** edge-hosted static deployment.
- **API:** containerized GraphQL service + worker process for async jobs.
- **Data platform:** Supabase-managed Postgres/Auth.
- **CI/CD:** monorepo pipeline with schema/type checks, migration guard, and test gates.
- **Environments:** dev/staging/prod with strict secret separation and feature flags.

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialize monorepo and Expo app.
2. Provision auth, Postgres schema, and RLS.
3. Implement GraphQL schema + core domain modules.
4. Deliver mobile inspection and recommendation workflows.
5. Add sync hardening and integrations.
6. Implement admin web operational surfaces.

**Cross-Component Dependencies:**
- Recommendation quality depends on sync freshness and normalized integrations.
- Support/audit UX depends on complete event and action history.
- Offline reliability depends on queue semantics shared by client and API.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database:** snake_case table/column names; UUID `id`; foreign keys as `<entity>_id`; indexes as `idx_<table>_<columns>`.

**API:** GraphQL types in PascalCase; fields/args in camelCase; operation names as VerbNoun; event names as `domain.entity.action.v1`.

**Code:** components/classes in PascalCase; functions/variables/hooks in camelCase; files in kebab-case (framework exceptions allowed).

### Structure Patterns

- Monorepo with `apps/` and `packages/`.
- Runtime separation: `apps/mobile`, `apps/admin-web`, `apps/api`.
- Shared schema/types/config in `packages/*`.
- Unit tests co-located, integration/e2e in top-level `tests/`.

### Format Patterns

- API timestamps are ISO-8601 UTC strings.
- API IDs are opaque UUID strings.
- API boundary JSON/GraphQL fields use camelCase.
- DB remains snake_case; mapping occurs in data access layer.

### Communication Patterns

- Required event envelope: `eventId`, `eventType`, `occurredAt`, `tenantId`, `payloadVersion`, `payload`.
- Event consumers are idempotent by `eventId`.
- Offline queue replay order is deterministic; conflicts resolve via policy order: hard constraint > server truth > merge > manual resolution.

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
bmad-method/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   ├── src/features/
│   │   ├── src/services/
│   │   ├── src/store/
│   │   └── package.json
│   ├── admin-web/
│   │   ├── src/pages/
│   │   ├── src/components/
│   │   ├── src/services/
│   │   └── package.json
│   └── api/
│       ├── src/modules/
│       ├── src/adapters/
│       ├── src/events/
│       ├── src/persistence/
│       └── package.json
├── packages/
│   ├── graphql-schema/
│   ├── domain-types/
│   ├── config/
│   ├── ui/
│   └── test-utils/
├── infra/
│   ├── migrations/
│   ├── supabase/
│   └── monitoring/
├── tests/
│   ├── integration/
│   └── e2e/
└── docs/
  ├── architecture/
  ├── adr/
  └── runbooks/
```

### Architectural Boundaries

- `apps/api` is the only client-facing API surface.
- Mobile and admin clients never access DB directly.
- Domain modules communicate via explicit interfaces/events only.
- Recommendation, inspection, planning, and notification ownership remains separate.

### Requirements to Structure Mapping

- Guided inspections/logging -> `apps/mobile/src/features/inspection`, `apps/api/src/modules/inspections`.
- Explainable recommendations -> `apps/mobile/src/features/recommendations`, `apps/api/src/modules/recommendations`.
- Weekly planning/prioritization -> `apps/mobile/src/features/weekly-plan`, `apps/api/src/modules/planning`.
- Integrations -> `apps/api/src/adapters/*`, `apps/api/src/modules/telemetry`.
- Admin/support/audit -> `apps/admin-web/src/pages/*`, `apps/api/src/modules/support`.

### Integration Points

- Client -> GraphQL API.
- API modules -> event bus/workers for async tasks.
- External adapters -> canonical event normalization before persistence.

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
