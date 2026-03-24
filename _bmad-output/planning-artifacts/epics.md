# Broodly MVP Epics & Stories

**Author:** Bob (Scrum Master)
**Date:** 2026-03-21
**Source Documents:** PRD (55 FRs, 27 NFRs), Architecture Decision Document, UX Review

---

## Epic 1: Project Scaffolding & Monorepo Setup

**Goal:** Establish the monorepo structure, CI pipeline, and development tooling so all subsequent epics have a consistent, tested foundation to build on.
**FRs:** None directly (infrastructure prerequisite for all FRs)

### Story 1.1: Initialize Expo App and Monorepo Structure

**As a** developer, **I want** the monorepo scaffolded with apps/mobile, apps/api, packages/ui, packages/graphql-types, packages/domain-types, packages/config, and infra/terraform directories, **so that** all teams work from a single, consistent repository layout from day one.
**FRs:** N/A (prerequisite)
**TDD Requirements:**
- Test: Verify monorepo workspace resolution — each package can be imported by its workspace name in a trivial test file.
- Test: Verify `npx create-expo-app` generated app boots without errors (Expo doctor check script).
**Acceptance Criteria:**
- [ ] Monorepo root with pnpm/yarn workspaces configured
- [ ] `apps/mobile/` initialized via `npx create-expo-app@latest broodly --template` with TypeScript
- [ ] `apps/api/` initialized as a Go module with `go.mod`
- [ ] `packages/ui/`, `packages/graphql-types/`, `packages/domain-types/`, `packages/config/` exist with stub `index.ts` exports
- [ ] `infra/terraform/` directory with placeholder `main.tf`
- [ ] Root `README.md` with setup instructions
**Tech Notes:** Use pnpm workspaces. Expo SDK 55. Go 1.24. Refer to architecture doc directory structure.

### Story 1.2: Configure CI Pipeline (Lint, Type-Check, Test Gates)

**As a** developer, **I want** GitHub Actions CI running lint, type-check, and test for both TypeScript and Go on every PR, **so that** code quality is enforced automatically.
**FRs:** N/A (prerequisite)
**TDD Requirements:**
- Test: CI workflow YAML is validated via `actionlint` or equivalent.
- Test: A deliberately failing lint rule triggers CI failure (negative test via a branch).
**Acceptance Criteria:**
- [ ] GitHub Actions workflow for TypeScript: ESLint, `tsc --noEmit`, Jest
- [ ] GitHub Actions workflow for Go: `go vet`, `golangci-lint`, `go test ./...`
- [ ] Migration guard step blocks deploy if unapplied migrations exist
- [ ] Docker build step for `apps/api/` targeting distroless container
- [ ] PR status checks required before merge
**Tech Notes:** Use matrix strategy for parallel TS/Go jobs. Artifact Registry for Docker images.

### Story 1.3: Configure Gluestack UI v3 and NativeWind in Expo

**As a** developer, **I want** Gluestack UI v3 with NativeWind configured and a smoke-test component rendering, **so that** all UI work uses the shared design system from the start.
**FRs:** N/A (prerequisite; supports NFR18, NFR19)
**TDD Requirements:**
- Test: Render a `<Button>` from Gluestack with `action="primary"` and assert it renders `ButtonText` child.
- Test: Verify NativeWind class `bg-primary-500` resolves to the correct color token value.
**Acceptance Criteria:**
- [ ] Gluestack UI v3 installed and provider configured in app root
- [ ] NativeWind configured with Broodly color tokens (primary, secondary, success, warning, error, info, typography, background, outline)
- [ ] Tailwind config extends with 8px spacing scale
- [ ] Smoke test screen renders a styled Gluestack Button and Text
**Tech Notes:** Follow CLAUDE.md design system rules. Color tokens per the specification: primary #D4880F, secondary #E8B931, etc.

### Story 1.4: Terraform Baseline for GCP Dev Environment

**As a** developer, **I want** Terraform provisioning a dev GCP project with Cloud SQL, Cloud Run placeholder, Cloud Storage bucket, and Pub/Sub topics, **so that** backend stories have infrastructure ready.
**FRs:** N/A (prerequisite)
**TDD Requirements:**
- Test: `terraform plan` succeeds with no errors on a clean state.
- Test: `terraform validate` passes for all `.tf` files.
**Acceptance Criteria:**
- [ ] Terraform provisions: Cloud SQL for PostgreSQL 16 (db-f1-micro), Cloud Storage bucket (`broodly-media-dev`), Pub/Sub topics (inspection-events, media-uploaded, telemetry-ingested, notification-dispatch, embedding-requests)
- [ ] Secret Manager entries for Firebase service account and DB credentials
- [ ] Separate state file per environment
- [ ] IAM service accounts for Cloud Run API and worker
**Tech Notes:** Use `google` and `google-beta` Terraform providers. pgvector extension enabled on Cloud SQL.

---

## Epic 2: Authentication & User Identity

**Goal:** Users can create accounts via social login (Google + Apple Sign-In), sign in, and delete accounts. Server validates Firebase tokens on every request. RBAC middleware enforces roles.
**FRs:** FR1a, FR1b, FR1d, FR55

### Story 2.1: Firebase Auth Setup — Google and Apple Sign-In

**As a** new user, **I want** to create an account with Google or Apple Sign-In, **so that** I can access the app quickly using my preferred social login.
**FRs:** FR1a
**TDD Requirements:**
- Test: Unit test Firebase Auth client wrapper — mock Google OAuth flow, assert user object returned.
- Test: Unit test sign-in flow — mock Apple Sign-In flow, assert auth state updates in Zustand store.
- Test: Unit test OAuth flow — mock Google provider, assert redirect and token capture.
**Acceptance Criteria:**
- [ ] Google Sign-In functional
- [ ] Apple Sign-In functional (iOS, required by App Store)
- [ ] Auth state persisted via `@react-native-firebase/auth` onAuthStateChanged
- [ ] Loading and error states displayed during auth operations
**Tech Notes:** Use `@react-native-firebase/auth`. Store auth state in Zustand. Firebase project configured with Google and Apple providers. No email/password — social login only.

### Story 2.2: Go Server JWT Validation Middleware

**As a** backend service, **I want** every GraphQL request validated against Firebase ID tokens, **so that** only authenticated users can access the API.
**FRs:** FR1a, FR55
**TDD Requirements:**
- Test: Middleware rejects requests with missing Authorization header (401).
- Test: Middleware rejects requests with expired or malformed JWT (401).
- Test: Middleware extracts user ID and role claims from a valid token and injects into request context.
- Test: Middleware allows requests with valid Firebase ID token (200).
**Acceptance Criteria:**
- [ ] chi middleware validates JWT signature against Google public keys
- [ ] Extracts `uid`, `email`, and custom claims (role) into Go context
- [ ] Returns structured GraphQL error on auth failure
- [ ] Token refresh handled client-side; server only validates
**Tech Notes:** Use `golang-jwt/jwt` with Firebase public key endpoint. Cache public keys with TTL.

### Story 2.3: Account Settings — Update Display Name

**As a** user, **I want** to update my display name from settings, **so that** I can keep my account information current.
**FRs:** FR1b
**TDD Requirements:**
- Test: Update display name mutation succeeds and returns updated profile.
**Acceptance Criteria:**
- [ ] Settings screen with editable display name and read-only linked social account info
- [ ] Success/error feedback via toast notifications
**Tech Notes:** Social login only — email and authentication are managed by the social provider (Google/Apple). No password fields.

### Story 2.4: Account Deletion

**As a** user, **I want** to permanently delete my account and data, **so that** I have control over my account lifecycle.
**FRs:** FR1d
**TDD Requirements:**
- Test: Account deletion mutation removes user record, marks associated data for purge.
- Test: Account deletion triggers cascading soft-delete of apiaries, hives, inspections in database.
- Test: Verify deletion completes within 30-day NFR14b window (unit test for purge job scheduling).
**Acceptance Criteria:**
- [ ] Account deletion requires confirmation dialog (irreversible action)
- [ ] Deletion removes Firebase account and schedules data purge
- [ ] All user data purged within 30 days per NFR14b
**Tech Notes:** Use Cloud Tasks for scheduled data purge job. Soft-delete with `deleted_at` timestamp, hard purge via async worker. Account recovery is handled by social login providers (Google/Apple).

### Story 2.5: RBAC Middleware — Owner, Collaborator, Support Roles

**As a** system, **I want** role-based access control enforced at the resolver level, **so that** collaborators see only what they are permitted and support roles have audit access.
**FRs:** FR5, FR6, FR7, FR55
**TDD Requirements:**
- Test: Owner role can access all resources for their account.
- Test: Collaborator role can read but not mutate hive data.
- Test: Support role can read recommendation history and audit logs.
- Test: Unauthorized role access returns a structured permission error.
- Test: All repository queries include `tenant_id` parameter (static analysis or integration test).
**Acceptance Criteria:**
- [ ] Roles defined: owner, collaborator, support
- [ ] chi middleware composes role checks at resolver boundary
- [ ] Every DB query includes `WHERE tenant_id = $1` enforced by repository interface
- [ ] Access changes logged to audit table (FR7)
**Tech Notes:** Roles stored as Firebase custom claims. Middleware reads claims from validated JWT context.

---

## Epic 3: Database Schema & Migrations

**Goal:** PostgreSQL schema supports all MVP domain entities with versioned, forward-only migrations. sqlc generates type-safe Go repository code.
**FRs:** FR3, FR4, FR31, FR53 (data model foundation for all FRs)

### Story 3.1: Core Domain Schema — Users, Apiaries, Hives

**As a** developer, **I want** the foundational database tables for users, apiaries, and hives with proper constraints and indexes, **so that** all CRUD operations have a reliable data layer.
**FRs:** FR3, FR4
**TDD Requirements:**
- Test: Migration applies cleanly to empty database.
- Test: Migration rolls forward idempotently (re-run does not error).
- Test: Foreign key constraint: hive cannot reference non-existent apiary.
- Test: Unique constraint: no duplicate hive names within an apiary.
- Test: sqlc-generated Go code compiles and type-checks.
**Acceptance Criteria:**
- [ ] `users` table: id, firebase_uid, email, display_name, experience_level, region, created_at, updated_at, deleted_at
- [ ] `apiaries` table: id, user_id, name, location (lat/lng), region, elevation_offset, bloom_offset, created_at, updated_at
- [ ] `hives` table: id, apiary_id, name, type, status, notes, created_at, updated_at
- [ ] Indexes on foreign keys and common query patterns
- [ ] golang-migrate migration files numbered sequentially
**Tech Notes:** Use `golang-migrate` CLI. All tables include `tenant_id` alias via user_id for authorization. UUIDs for primary keys.

### Story 3.2: Inspection, Observation, and Media Schema

**As a** developer, **I want** tables for inspections, observations, and media attachments, **so that** the guided inspection flow can persist structured records.
**FRs:** FR27, FR28, FR29, FR30, FR31
**TDD Requirements:**
- Test: Inspection record links to exactly one hive.
- Test: Observations link to exactly one inspection with ordering preserved.
- Test: Media record stores Cloud Storage path and content type.
- Test: Cascade: deleting an inspection soft-deletes its observations and media.
**Acceptance Criteria:**
- [ ] `inspections` table: id, hive_id, user_id, type (full/quick), status (in_progress/paused/completed), started_at, completed_at, notes
- [ ] `observations` table: id, inspection_id, sequence_order, observation_type, structured_data (JSONB), raw_voice_url, transcription, transcription_confidence, created_at
- [ ] `media` table: id, observation_id, storage_path, content_type, analysis_status, analysis_result (JSONB), created_at
- [ ] sqlc queries for CRUD operations
**Tech Notes:** JSONB for flexible structured_data allows schema evolution without migration. Voice URL points to Cloud Storage.

### Story 3.3: Recommendations, Tasks, and Audit Schema

**As a** developer, **I want** tables for recommendations, tasks, and audit events, **so that** the recommendation engine, planning queue, and trust/support features have persistent storage.
**FRs:** FR13, FR14, FR50, FR51, FR53
**TDD Requirements:**
- Test: Recommendation record includes action, rationale, confidence, fallback fields (not nullable).
- Test: Audit event table is append-only (no UPDATE or DELETE operations allowed via sqlc queries).
- Test: Task links to recommendation and hive with status lifecycle (pending/completed/deferred/dismissed).
- Test: Recommendation evidence JSONB stores source references.
**Acceptance Criteria:**
- [ ] `recommendations` table: id, hive_id, user_id, action, rationale, confidence_level, confidence_type (insufficient_data/conflicting_evidence/high), fallback_action, evidence_context (JSONB), source_versions (JSONB), created_at, expires_at
- [ ] `tasks` table: id, recommendation_id, hive_id, user_id, title, priority, status, due_date, deferred_reason, completed_at, created_at
- [ ] `audit_events` table: id, event_type, actor_id, tenant_id, occurred_at, payload_version, payload (JSONB) — append-only
- [ ] `user_feedback` table: id, recommendation_id, user_id, outcome_report, created_at
**Tech Notes:** Audit table: no sqlc UPDATE/DELETE queries generated. Use trigger or application-level enforcement. Partition audit_events by month for performance.

### Story 3.4: Integrations, Telemetry, and External Context Schema

**As a** developer, **I want** tables for integration connections, telemetry readings, and external context cache, **so that** weather/flora/sensor data can be stored and linked to recommendations.
**FRs:** FR44, FR45, FR46, FR48a, FR48b, FR48c
**TDD Requirements:**
- Test: Integration record tracks provider, status, and last_sync_at.
- Test: Telemetry reading links to specific hive and integration with timestamp.
- Test: External context cache stores freshness timestamp and staleness threshold.
- Test: Staleness check query correctly identifies stale records.
**Acceptance Criteria:**
- [ ] `integrations` table: id, user_id, provider, credentials_ref (Secret Manager path), status, hive_mappings (JSONB), last_sync_at, created_at
- [ ] `telemetry_readings` table: id, integration_id, hive_id, reading_type, value, unit, recorded_at, ingested_at, plausibility_status
- [ ] `external_context` table: id, apiary_id, source_type (weather/flora), data (JSONB), fetched_at, staleness_threshold_hours
- [ ] Indexes on (hive_id, recorded_at) for telemetry time-series queries
**Tech Notes:** Telemetry partitioned by month. Plausibility_status enum: confirmed, unconfirmed, anomalous (FR47a).

### Story 3.5: Skill Progression and Notification Preferences Schema

**As a** developer, **I want** tables for user skill progression milestones and notification preferences, **so that** adaptive guidance and configurable alerts are data-driven.
**FRs:** FR34, FR35, FR40, FR42
**TDD Requirements:**
- Test: Skill progression record tracks level, milestones completed, and last_assessed_at.
- Test: Notification preference record stores global sensitivity settings (per-apiary sensitivity removed per FR40 update).
- Test: Default notification preferences created on user registration.
**Acceptance Criteria:**
- [ ] `skill_progression` table: id, user_id, current_level (newbie/amateur/sideliner), milestones_completed (JSONB), total_inspections, last_assessed_at, created_at, updated_at
- [ ] `notification_preferences` table: id, user_id, apiary_id (nullable for global), sensitivity_level, suppression_window_start, suppression_window_end, escalation_enabled, created_at, updated_at
- [ ] `treatment_registry` table: id, treatment_name, region, legal_status (approved/restricted/prescription_required/prohibited), notes, updated_at
**Tech Notes:** Treatment registry seeded via migration with initial dataset. FR12a/FR12b.

---

## Epic 4: GraphQL Schema & Core Resolvers

**Goal:** Schema-first GraphQL API exposes all MVP domain operations with generated Go resolvers and TypeScript client types. Recommendation contract (action + rationale + confidence + fallback) is a first-class type.
**FRs:** FR2, FR3, FR4, FR21-FR24 (contract), FR32, FR33

### Story 4.1: GraphQL Schema Definition — Core Types and Recommendation Contract

**As a** developer, **I want** the GraphQL schema defined with all MVP types including the mandatory Recommendation contract, **so that** frontend and backend share a single source of truth.
**FRs:** FR21, FR22, FR23, FR24
**TDD Requirements:**
- Test: Schema parses without errors via `gqlgen generate`.
- Test: Recommendation type includes non-nullable fields: action, rationale, confidenceLevel, confidenceType, fallbackAction.
- Test: GraphQL Code Generator produces TypeScript types without errors.
- Test: Generated TypeScript Recommendation type matches schema contract.
**Acceptance Criteria:**
- [ ] `.graphql` schema files in `apps/api/graph/schema/`
- [ ] Types: User, Apiary, Hive, Inspection, Observation, Recommendation, Task, AuditEvent
- [ ] Recommendation type: `action: String!`, `rationale: String!`, `confidenceLevel: Float!`, `confidenceType: ConfidenceType!`, `fallbackAction: String!`, `evidenceContext: JSON`
- [ ] ConfidenceType enum: `HIGH`, `MODERATE`, `LOW`, `INSUFFICIENT_DATA`, `CONFLICTING_EVIDENCE`, `LIMITED_EXPERIENCE`
- [ ] Queries: me, apiaries, hives, inspections, tasks, recommendations
- [ ] Mutations: createApiary, updateApiary, deleteApiary, createHive, updateHive, deleteHive, startInspection, completeInspection, addObservation, deferTask, completeTask
- [ ] Generated TypeScript types in `packages/graphql-types/`
**Tech Notes:** Use `@graphql-codegen/cli` with `typescript` and `typescript-operations` plugins. Schema-first with gqlgen.

### Story 4.2: Apiary and Hive CRUD Resolvers

**As a** developer, **I want** GraphQL resolvers for apiary and hive CRUD backed by sqlc repository, **so that** the mobile app can manage apiaries and hives.
**FRs:** FR3, FR4
**TDD Requirements:**
- Test: CreateApiary resolver creates record and returns it with ID.
- Test: CreateApiary enforces 5-location limit per account (NFR17a).
- Test: CreateHive enforces 100-hive limit per account (NFR17a).
- Test: UpdateApiary resolver validates ownership before mutation.
- Test: DeleteApiary soft-deletes and cascades to hives.
- Test: ListApiaries resolver returns only current user's apiaries (tenant isolation).
**Acceptance Criteria:**
- [ ] All CRUD resolvers functional with authorization checks
- [ ] Scale limits enforced: 5 apiaries, 100 hives per account
- [ ] Soft-delete pattern for all destructive operations
- [ ] Structured error responses for validation failures
**Tech Notes:** Resolvers compose authorization middleware + sqlc repository calls. Use dataloader pattern to avoid N+1 on hive lists.

### Story 4.3: Inspection and Observation Resolvers

**As a** developer, **I want** resolvers for starting, pausing, resuming, and completing inspections with observation recording, **so that** the guided inspection flow has a functional API.
**FRs:** FR19, FR25, FR25b, FR27, FR28, FR29, FR30
**TDD Requirements:**
- Test: StartInspection creates an in-progress inspection linked to hive.
- Test: AddObservation appends observation with correct sequence order.
- Test: PauseInspection updates status and preserves all observations.
- Test: ResumeInspection restores from paused state.
- Test: CompleteInspection validates at least one observation exists.
- Test: Only hive owner can start inspection on their hive.
**Acceptance Criteria:**
- [ ] StartInspection mutation: creates inspection, returns ID and initial guidance
- [ ] AddObservation mutation: accepts structured data, voice URL, or media reference
- [ ] PauseInspection / ResumeInspection mutations functional (FR25b)
- [ ] CompleteInspection mutation: finalizes record, triggers async recommendation generation
- [ ] Quick inspection mode via type parameter (FR25)
**Tech Notes:** CompleteInspection publishes to `inspection-events` Pub/Sub topic for async processing.

### Story 4.4: Task and Planning Resolvers

**As a** developer, **I want** resolvers for querying the weekly task queue and updating task status, **so that** the planning features have API support.
**FRs:** FR13, FR14, FR16, FR16b
**TDD Requirements:**
- Test: WeeklyQueue query returns tasks ordered by priority for current week.
- Test: DeferTask mutation updates status and adjusts sibling priorities.
- Test: CompleteTask mutation records completion timestamp.
- Test: Overdue tasks are flagged in query response (FR16).
- Test: Queue pagination works for accounts with >20 tasks per apiary (NFR17b).
**Acceptance Criteria:**
- [ ] WeeklyQueue query with filters: apiary, priority, status
- [ ] Tasks sorted by urgency and impact (FR14)
- [ ] DeferTask, CompleteTask, DismissTask mutations with optional reason (FR16b)
- [ ] Overdue flag and catch-up guidance field
- [ ] Pagination support for large queues
**Tech Notes:** Priority computation is a Go service function called by resolver. Progressive loading for large accounts (NFR17c).

### Story 4.5: Data Export Resolvers (JSON/CSV)

**As a** user, **I want** to export my records in JSON and CSV format, **so that** I own my data and can use it elsewhere.
**FRs:** FR32, FR33
**TDD Requirements:**
- Test: Export mutation generates JSON file in Cloud Storage and returns signed URL.
- Test: Export mutation generates CSV file in Cloud Storage and returns signed URL.
- Test: Export includes inspections, observations, recommendations, and hive history.
- Test: Export respects tenant isolation — only current user's data.
- Test: Signed URL expires after 15 minutes.
**Acceptance Criteria:**
- [ ] ExportData mutation accepts format parameter (JSON/CSV)
- [ ] Generates file asynchronously, returns download URL
- [ ] Includes disclaimer text in export (per compliance requirement)
- [ ] Signed URL with 15-minute expiry
**Tech Notes:** Use Cloud Storage signed URLs. Export job may be async via Pub/Sub for large accounts. Include recommendation evidence context in export.

---

## Epic 5: Core Mobile App Shell

**Goal:** Expo app with routing, navigation, authentication flow, state management, and GraphQL client — the structural skeleton that all feature screens plug into.
**FRs:** FR1a (auth UI), NFR1, NFR18, NFR19, NFR20

### Story 5.1: Expo Router Setup with Bottom Tab Navigation

**As a** user, **I want** bottom tab navigation with Home, Apiaries, Plan, and Settings tabs, **so that** I can navigate the app's primary sections.
**FRs:** NFR18 (accessibility)
**TDD Requirements:**
- Test: All four tabs render their respective screen stubs.
- Test: Tab navigation updates active tab indicator.
- Test: Deep linking to `/apiaries/:id` resolves correctly.
- Test: Bottom nav renders consistently across screen sizes (snapshot test).
**Acceptance Criteria:**
- [ ] Bottom navigation: Home, Apiaries, Plan, Settings (4 tabs per UX review blocker #1)
- [ ] Expo Router file-based routing configured
- [ ] Stack navigation within each tab for drill-down screens
- [ ] Active tab highlighting with correct icons
- [ ] 48px minimum touch targets on nav items (UX review blocker #3)
**Tech Notes:** Use Expo Router `(tabs)` layout. Fix the 4-vs-5 tab inconsistency called out in UX review.

### Story 5.2: GraphQL Client and TanStack Query Integration

**As a** developer, **I want** urql or Apollo Client configured with TanStack React Query for cache-first reads, **so that** all screens share a single, persistent data fetching layer.
**FRs:** NFR1 (performance), NFR6 (offline tolerance)
**TDD Requirements:**
- Test: GraphQL client attaches Firebase ID token to every request header.
- Test: TanStack Query persistent cache stores and retrieves a mock query result.
- Test: Network error returns cached data with stale indicator.
- Test: Token refresh triggers re-fetch of failed queries.
**Acceptance Criteria:**
- [ ] GraphQL client configured with auth header injection
- [ ] TanStack React Query with persistent cache (AsyncStorage or MMKV)
- [ ] Cache-first read strategy: serve from cache, revalidate in background
- [ ] Stale-while-revalidate pattern for all list queries
- [ ] Error boundary wrapping GraphQL operations
**Tech Notes:** Use `urql` with `@urql/exchange-auth` for token management. TanStack Query `persistQueryClient` with MMKV for RN performance.

### Story 5.3: Zustand State Stores — Auth, UI, and Connectivity

**As a** developer, **I want** Zustand stores for auth state, UI preferences, and connectivity status, **so that** cross-cutting client state is centralized and testable.
**FRs:** NFR6, NFR9
**TDD Requirements:**
- Test: Auth store updates on Firebase auth state change.
- Test: Connectivity store detects online/offline transitions.
- Test: Offline banner shows when connectivity store reports offline.
- Test: UI preference store persists theme/preference selections.
**Acceptance Criteria:**
- [ ] Auth store: user object, isAuthenticated, isLoading
- [ ] Connectivity store: isOnline, lastOnlineAt
- [ ] UI store: onboarding completion status, active apiary selection
- [ ] Offline banner component using `<Alert action="info">` with cloud-offline icon
- [ ] Stores persist across app restarts where appropriate
**Tech Notes:** Use `zustand/middleware` for persistence. NetInfo for connectivity detection.

### Story 5.4: Auth Screens — Social Login (Google + Apple Sign-In)

**As a** user, **I want** polished sign-in screens with Google and Apple Sign-In, **so that** I have a smooth entry into the app.
**FRs:** FR1a
**TDD Requirements:**
- Test: Google Sign-In button triggers OAuth flow and updates auth state.
- Test: Apple Sign-In button triggers OAuth flow and updates auth state.
- Test: Auth error messages display user-friendly text (not Firebase error codes).
**Acceptance Criteria:**
- [ ] Sign-in screen: Google Sign-In and Apple Sign-In buttons
- [ ] Loading states during auth operations
- [ ] Error messages styled with `<Alert action="error">`
- [ ] Navigation to onboarding after first sign-in
**Tech Notes:** Use Gluestack Button, Alert components. Follow CLAUDE.md button hierarchy. Social login only — no email/password forms.

### Story 5.5: Staleness Indicator and Connectivity UX

**As a** user, **I want** clear visual indicators when data is stale or I am offline, **so that** I understand the reliability of what I am seeing.
**FRs:** NFR6, NFR9, FR48a, FR48b
**TDD Requirements:**
- Test: Staleness badge renders "subtle" variant for <24h staleness.
- Test: Staleness badge renders amber warning for 24-72h staleness.
- Test: Staleness badge renders red banner for >72h staleness.
- Test: Offline banner appears within 2 seconds of connectivity loss.
**Acceptance Criteria:**
- [ ] Three-tier staleness display per CLAUDE.md: <24h subtle, 24-72h amber, >72h red
- [ ] Offline banner: Sky Blue `<Alert action="info">` with icon
- [ ] Per-source staleness for weather, flora, telemetry (FR48a)
- [ ] Confidence downgrade messaging when sources are stale (FR48b)
**Tech Notes:** Staleness thresholds: weather 24h, flora 7d, telemetry configurable (FR48c). Use TanStack Query `dataUpdatedAt` for client-side staleness.

---

## Epic 6: Onboarding Flow

**Goal:** New users complete a guided onboarding capturing region, experience level, hive configuration, goals, interaction preference, and disclaimer acceptance — the minimum context for personalized guidance. Profile data model supports progressive enrichment for future versions.
**FRs:** FR2, FR2a, FR2b, FR2c, FR2d, FR2e, FR8, FR19a

### Story 6.1: Onboarding Flow — Region and Seasonal Context

**As a** new user, **I want** to set my region during onboarding, **so that** all guidance is localized to my area and current season.
**FRs:** FR2b, FR8
**TDD Requirements:**
- Test: Region selection updates user profile and triggers seasonal context resolution.
- Test: Onboarding cannot proceed past region step without a selection.
- Test: Location permission request shows purpose-specific messaging.
- Test: Manual region entry works when location permission is denied.
**Acceptance Criteria:**
- [ ] Region selection screen with map or search interface
- [ ] Optional device location detection with permission request (purpose-specific messaging per NFR14)
- [ ] Manual region entry fallback
- [ ] Seasonal context resolved from region and current date
- [ ] Region stored on user profile
**Tech Notes:** Progressive permission — request location only at this step with clear "why" messaging.

### Story 6.2: Onboarding Flow — Experience Level and Goals

**As a** new user, **I want** to set my experience level and management goals, **so that** guidance adapts to my skill level.
**FRs:** FR2, FR2b
**TDD Requirements:**
- Test: Experience level selection persists to user profile.
- Test: Goals selection persists (multi-select: honey production, colony health, learning, expansion).
- Test: Guidance depth parameter changes based on experience level selection.
**Acceptance Criteria:**
- [ ] Experience level selector: Newbie, Amateur, Sideliner with clear descriptions
- [ ] Goals multi-select with beekeeping-relevant options
- [ ] Selections stored in user profile via GraphQL mutation
- [ ] Visual feedback on selection
**Tech Notes:** Experience level maps to skill_progression.current_level. Goals stored as JSONB on user profile.

### Story 6.3: Onboarding Flow — Apiary Setup, Management Focus, and Interaction Preference

**As a** new user, **I want** to register my first apiary and hives, set my management focus, and choose my interaction preference during onboarding, **so that** I get relevant, personalized recommendations immediately.
**FRs:** FR2b, FR2e, FR3, FR4
**TDD Requirements:**
- Test: Apiary creation during onboarding links to user account and captures apiary name.
- Test: Hive count is captured and persisted to user profile.
- Test: At least one hive must be added before proceeding.
- Test: Hive creation with name and type fields validates inputs.
- Test: Management focus slider value is captured and persisted (range: honey production ↔ making splits).
- Test: Slider defaults to midpoint on initial load.
- Test: Colony health priority is not affected by slider position (always prioritized).
- Test: Interaction preference (voice-first vs tap) is captured and persisted.
- Test: Skip path generates degraded guidance warning (FR2c).
**Acceptance Criteria:**
- [ ] Apiary name input (required) and optional location input
- [ ] Hive count captured during apiary setup
- [ ] Add one or more hives with name and type (Langstroth, Top Bar, Warre, etc.)
- [ ] Management focus slider: honey production on one end, making splits on the other, with clear labels and midpoint default
- [ ] Explanatory text: "Colony health is always prioritized regardless of this setting"
- [ ] Interaction preference selector: voice-first or tap-first (defaults to voice-first)
- [ ] Skip option available with warning about degraded guidance quality
- [ ] Data persisted via GraphQL mutations
- [ ] Profile data model supports progressive enrichment (FR2e) — extensible schema for future fields (hive types, queen marking preferences, treatment history, mentor relationship) without re-onboarding
**Tech Notes:** Hive types from domain research. Minimum one hive encouraged but not enforced to avoid blocking. Management focus stored as numeric value (0.0–1.0) on user profile, used to weight recommendation prioritization between honey production and split-making goals. Colony health recommendations are always surfaced at highest priority regardless of focus setting. Interaction preference stored on user profile and used to configure default inspection flow mode. Profile schema uses JSONB for extensible fields per FR2e.
**Note (FR2a alignment):** Profile & Preferences in Settings must mirror the onboarding Honey-to-Splits slider (numeric 0.0-1.0), NOT the old goal chips pattern. The Settings screen shall present the same slider control so users can adjust their management focus at any time with immediate effect on recommendations.

### Story 6.4: Onboarding Flow — Disclaimer Acceptance and Safety Checklist

**As a** new user, **I want** to review and accept the advisory disclaimer before receiving recommendations, **so that** I understand guidance is decision-support, not professional advice.
**FRs:** FR19a, compliance requirements
**TDD Requirements:**
- Test: Disclaimer screen blocks progress until accepted.
- Test: Disclaimer acceptance timestamp stored in user profile.
- Test: Safety checklist for first inspection is shown ONLY for Newbie persona (FR19a).
- Test: Amateur and Sideliner personas skip safety checklist entirely (FR19a).
- Test: Safety checklist appears for Newbie's first 3 inspections, then becomes optional (FR19a).
- Test: Disclaimer accessible from recommendation detail views after onboarding.
**Acceptance Criteria:**
- [ ] Disclaimer text: recommendations are decision-support, not professional advice
- [ ] Treatment disclaimer: verify suitability for specific conditions
- [ ] Must accept before first recommendation shown
- [ ] Safety awareness checklist: protective equipment, sting allergy, emergency preparedness — NEWBIE PERSONA ONLY, first 3 inspections then optional (FR19a). Amateur and Sideliner skip directly to inspection flow.
- [ ] Acceptance timestamp persisted
**Tech Notes:** UX review suggests soften disclaimer visual (info icon vs warning icon). Use `<Alert action="info">`.

### Story 6.5: Onboarding State Persistence and Resume

**As a** user who abandoned onboarding, **I want** to resume from where I left off, **so that** I do not have to start over.
**FRs:** FR2b (edge case: abandoned onboarding recovery)
**TDD Requirements:**
- Test: Partial onboarding state persists locally after app close.
- Test: Reopening app after incomplete onboarding resumes at last completed step.
- Test: Completing skipped optional steps later enriches profile.
- Test: Missing context results in degraded guidance flag (FR2c).
**Acceptance Criteria:**
- [ ] Onboarding progress tracked step-by-step in Zustand persistent store
- [ ] App launch checks onboarding completion status
- [ ] Resume from last completed step
- [ ] Incomplete profiles flagged with "limited guidance" indicator
**Tech Notes:** Store onboarding step index in Zustand with MMKV persistence. Server-side profile has `onboarding_completed_at`.

---

## Epic 7: Apiary & Hive Management (CRUD)

**Goal:** Users can fully manage their apiaries and hives — create, view, update, delete — with health status visualization and navigation hierarchy.
**FRs:** FR3, FR4, FR5, FR6, FR7, FR8a, FR8b, FR11a, FR11b

### Story 7.1: Apiary List Screen with Health Summary

**As a** user, **I want** to see all my apiaries with health status summaries, **so that** I can quickly identify which locations need attention.
**FRs:** FR3
**TDD Requirements:**
- Test: Apiary list renders all user apiaries with name and location.
- Test: Health status badge renders correct variant (healthy/attention/warning/critical).
- Test: Empty state renders when no apiaries exist with CTA to create one.
- Test: Pull-to-refresh triggers data re-fetch.
**Acceptance Criteria:**
- [ ] Apiary list with ApiaryHealthCard components
- [ ] Status badges per CLAUDE.md semantic mapping (success/warning/error)
- [ ] Hive count per apiary
- [ ] Empty state with "Add Apiary" CTA
- [ ] Pull-to-refresh
- [ ] Navigation to apiary detail on tap
**Tech Notes:** Use `<Card variant="elevated">` with status tva variant. Status derived from worst-case hive status within apiary.

### Story 7.2: Apiary Detail and Hive List

**As a** user, **I want** to view an apiary's details and its hives, **so that** I can manage a specific location.
**FRs:** FR3, FR4
**TDD Requirements:**
- Test: Apiary detail screen renders apiary name, location, and hive list.
- Test: Hive list renders HiveHealthCard for each hive with status.
- Test: Navigation breadcrumb shows Organization > Apiary context.
- Test: Edit and delete actions accessible from apiary detail.
**Acceptance Criteria:**
- [ ] Apiary detail header: name, location, hive count, overall status
- [ ] Hive list with HiveHealthCard components
- [ ] Breadcrumb context label (UX review should-fix #7)
- [ ] Edit apiary button (outline variant)
- [ ] Add hive FAB or button
**Tech Notes:** Breadcrumb: use `<Text size="sm">` with chevron separators. Apiary > Hive navigation per CLAUDE.md.
**Note (FR31a):** The hive detail screen (navigated to from this hive list) shall include an 'Activity Log' view showing a reverse chronological list of all actions logged for the hive, including inspections, treatments, observations, and system events. Each entry shows date, action type, summary, and any associated media. This may be implemented as a sub-story or tab within the hive detail view.

### Story 7.3: Create and Edit Apiary with Microclimate Adjustments

**As a** user, **I want** to create and edit apiaries including microclimate adjustments, **so that** seasonal guidance is tuned to my specific location.
**FRs:** FR3, FR11a, FR8a, FR8b
**TDD Requirements:**
- Test: Create apiary mutation succeeds with name and region.
- Test: Edit apiary updates name, location, and microclimate offsets.
- Test: Microclimate elevation offset adjusts seasonal context.
- Test: Creating apiary in new region triggers regional baseline reset message (FR8b).
- Test: 5-apiary limit enforced with user-friendly error.
**Acceptance Criteria:**
- [ ] Form: name, location (map pin or address), notes
- [ ] Microclimate adjustments: elevation offset, bloom timing offset (FR11a)
- [ ] Region change detection with informational message (FR8b)
- [ ] Device location divergence prompt (FR8a)
- [ ] Validation and error states
**Tech Notes:** Microclimate offsets stored on apiary record. Used by recommendation engine to adjust seasonal timing.

### Story 7.4: Create and Edit Hive

**As a** user, **I want** to create and edit hives within an apiary, **so that** I can track each colony individually.
**FRs:** FR4
**TDD Requirements:**
- Test: Create hive mutation succeeds with name, type, and apiary ID.
- Test: Edit hive updates name, type, status, and notes.
- Test: 100-hive-per-account limit enforced.
- Test: Hive name uniqueness within apiary enforced.
**Acceptance Criteria:**
- [ ] Form: name, type (Langstroth, Top Bar, Warre, Other), status, notes
- [ ] Type selector with icons/descriptions
- [ ] Linked to parent apiary
- [ ] Validation errors for duplicate names, limit exceeded
**Tech Notes:** Hive types from domain research. Status field for manual health override.

### Story 7.5: Delete Apiary/Hive with Confirmation

**As a** user, **I want** to delete an apiary or hive with a confirmation step, **so that** I do not accidentally lose data.
**FRs:** FR3, FR4
**TDD Requirements:**
- Test: Delete apiary shows confirmation modal (irreversible warning).
- Test: Confirming delete soft-deletes apiary and all child hives.
- Test: Delete hive shows confirmation and soft-deletes.
- Test: Cancelled delete does not modify data.
**Acceptance Criteria:**
- [ ] Confirmation dialog using `<AlertDialog>` for irreversible delete
- [ ] Soft-delete preserves data for recovery period
- [ ] Cascade: apiary delete soft-deletes all hives
- [ ] Success toast after deletion
**Tech Notes:** Use `<Button action="negative">` for delete trigger. Full modal per CLAUDE.md (irreversible operations only).

### Story 7.6: Collaborator Management — Grant and Revoke Access

**As an** account owner, **I want** to invite collaborators with read-only access, revoke their access, and view a history of all permission changes, **so that** I can share visibility without giving edit control and maintain governance.
**FRs:** FR5, FR5a, FR6, FR7
**TDD Requirements:**
- Test: Invite collaborator by email creates pending invitation.
- Test: Accepting invitation grants read-only access to all apiaries.
- Test: Revoking access removes collaborator permissions immediately.
- Test: Access change creates audit event (FR7).
- Test: Collaborator cannot mutate data (integration test).
- Test: Access history log displays all permission changes with timestamps (FR5a).
**Acceptance Criteria:**
- [ ] Collaborator management screen in settings
- [ ] Invite by email with pending/accepted status
- [ ] Revoke access button with confirmation
- [ ] Auditable access history log showing all collaborator permission changes with timestamps (FR5a)
- [ ] Collaborator sees read-only view of shared apiaries
**Tech Notes:** Collaborator role set as Firebase custom claim. Audit events written to audit_events table. Access history log reads from audit_events filtered by collaborator permission change events.

---

## Epic 8: Guided Inspection Flow

**Goal:** Users can run full or quick guided inspections with voice/media capture, adaptive prompts, pause/resume, and structured record output. This is the core field-use workflow.
**FRs:** FR19, FR19a, FR19b, FR19c, FR19d, FR20, FR21, FR22, FR23, FR24, FR25, FR25b, FR25c, FR26, FR27, FR28, FR29, FR30, FR30a, FR30b, FR30c, FR36, FR37, FR38, FR54, FR54a, FR56, FR57, FR58

### Story 8.1: Start Inspection — Scope Confirmation and Initial Guidance

**As a** beekeeper, **I want** to start an inspection on a selected hive with a scope confirmation, **so that** I know what to focus on before opening the hive.
**FRs:** FR19, FR19a, FR25
**TDD Requirements:**
- Test: Start inspection creates an in-progress inspection record.
- Test: Scope confirmation sheet presents inspection type options (full/quick).
- Test: Pre-inspection context loads: hive history, last inspection date, active recommendations.
- Test: First-ever inspection shows safety checklist (FR19a).
- Test: Quick mode presents abbreviated prompt set (FR25).
**Acceptance Criteria:**
- [ ] Hive selection or direct start from hive detail
- [ ] ScopeConfirmationSheet (Actionsheet) with full vs quick options
- [ ] Pre-inspection context card: last inspection date, active alerts, current recommendations
- [ ] Safety checklist on first inspection (FR19a)
- [ ] Inspection record created with status `in_progress`
**Tech Notes:** Use `<Actionsheet>` for scope confirmation. Safety checklist stored as acknowledged in user profile.

### Story 8.2: Guided Inspection Step Engine — Voice-First Conversational Flow

**As a** beekeeper during inspection, **I want** voice-first conversational prompts that guide me through each inspection step and adapt to my spoken observations, **so that** I am guided through what to look for without needing to interact with the screen.
**FRs:** FR19, FR19b, FR20, FR25c, FR26, FR35
**TDD Requirements:**
- Test: Each inspection step begins with the system immediately entering "listening" state (not "recording") for voice input.
- Test: Steps are presented as conversational voice exchanges — the system speaks the prompt and listens for the user's spoken response.
- Test: Natural language processing extracts structured observations from voice input in real-time.
- Test: User can advance to next step via voice commands ("done", "next", "skip") without touching the screen.
- Test: UI card-based option selection is available as a tap fallback but is NOT the primary interaction mode.
- Test: Saying "queen cells observed" adapts next prompts to swarm-risk path via NLP extraction.
- Test: Skill-level affects prompt conversational depth: newbie gets detailed explanations, sideliner gets compact prompts.
- Test: Normal/cautionary/urgent observations render with correct status semantics (FR26).
- Test: Each observation persists incrementally to local storage (NFR9d).
- Test: Minimum 5 required steps are present: entrance assessment, brood inspection, queen cell check, overall colony assessment, action planning (FR25c).
- Test: Live transcript displays as user speaks, with real-time conversational acknowledgment from the system.
**Acceptance Criteria:**
- [ ] Voice listening begins automatically upon entering each inspection step — no tap required to activate
- [ ] System presents each step prompt as a conversational voice message (text-to-speech)
- [ ] User's voice response displayed as live transcript in real-time
- [ ] System provides conversational acknowledgment of each response (e.g., "Got it — brood pattern looks healthy")
- [ ] NLP extracts structured observations from natural language descriptions
- [ ] User advances via voice ("done", "next", "skip") — primary advancement mode
- [ ] Tap-based card selection available as fallback, not default
- [ ] One observation prompt per screen with clear progress indicator
- [ ] Adaptive branching: voice-captured observations influence subsequent prompts
- [ ] Skill-adaptive conversational depth: newbie (detailed), amateur (standard), sideliner (exception-first)
- [ ] Status classification: normal (success), cautionary (warning), urgent (error) with icons
- [ ] Incremental local persistence of each observation
- [ ] Minimum 5 steps in full inspection: entrance assessment, brood inspection, queen cell check, overall colony assessment, action planning
**Tech Notes:** Prompt tree defined as configurable JSON. Adaptive logic in a TypeScript service. Persist each observation immediately (NFR9d). Voice-first paradigm: the "listening" state is the default state for each step. NLP extraction uses Gemini for real-time structured observation parsing. UI cards are rendered as fallback controls below the voice interaction area. Term "listening" must be used throughout — never "recording".

### Story 8.3: Voice Observation Capture — Default Interaction Mode

**As a** beekeeper with gloved hands, **I want** voice to be the DEFAULT way I capture observations during inspection, with listening beginning automatically at each step, **so that** I never need to put down my tools to interact with the app.
**FRs:** FR19, FR19b, FR27, FR29, FR30a, FR30b
**TDD Requirements:**
- Test: Voice listening begins automatically when each inspection step loads — no button tap required to start.
- Test: The UI displays "Listening..." state (not "Recording...") when voice capture is active.
- Test: Audio uploads to Cloud Storage via signed URL.
- Test: Transcription result populates observation text field as a live transcript during speech.
- Test: System provides conversational acknowledgment after processing each voice input.
- Test: Low-confidence transcriptions are flagged for review (FR30b).
- Test: Original audio retained alongside transcription (FR30a).
- Test: Microphone permission requested with purpose messaging on first use.
- Test: Tap-based input is available as a fallback but voice is the default active state.
- Test: The term "recording" does NOT appear anywhere in the UI — only "listening".
**Acceptance Criteria:**
- [ ] Voice listening is the DEFAULT mode — begins automatically at each inspection step
- [ ] VoiceLogCapture component states: listening (default on step entry) > processing > confirm > idle (fallback)
- [ ] UI terminology: "Listening..." not "Recording..." throughout all states and labels
- [ ] 56x56px Fab mic button available for manual re-activation (per CLAUDE.md) but auto-activation is primary
- [ ] Live transcript displayed as user speaks
- [ ] Conversational acknowledgment from system after voice input processed
- [ ] Audio uploaded to Cloud Storage, triggers STT via Pub/Sub
- [ ] Transcription displayed for confirmation/editing
- [ ] Low-confidence flag with "Review suggested" badge (FR30b)
- [ ] Original audio file preserved (FR30a)
- [ ] Tap-based quick-select available as fallback below voice interaction area
**Tech Notes:** Audio format: opus. Upload via signed URL from API. Cloud Storage notification triggers `media-uploaded` Pub/Sub topic. STT via Gemini. Voice is now the DEFAULT mode, not an option — the mic button serves as a re-activate control if the user pauses listening, not as the primary activation mechanism. All UI copy must use "listening" terminology per FR27.

### Story 8.4: Photo and Image Capture with Vision AI Analysis

**As a** beekeeper, **I want** to photograph brood frames and get AI-assisted interpretation, **so that** I can better understand what I am seeing.
**FRs:** FR28, FR36, FR37, FR38
**TDD Requirements:**
- Test: Camera capture stores image locally and uploads to Cloud Storage.
- Test: Image analysis request publishes to embedding-requests topic.
- Test: Analysis result displays findings with confidence badges.
- Test: Low-confidence analysis shows fallback guidance (NFR27).
- Test: Analysis results integrated as evidence in observation record.
**Acceptance Criteria:**
- [ ] InspectionImageCapture component with camera integration
- [ ] Image compressed (HEIC/WebP) before upload
- [ ] ImageAnalysisResultCard: findings, confidence, interpretation
- [ ] Supported categories: brood pattern, queen cells, pest/disease indicators
- [ ] Low confidence (<70%) shows "Analysis inconclusive — manual assessment recommended"
- [ ] Analysis result stored as observation evidence
**Tech Notes:** Vision AI via Vertex AI Gemini Vision. 70% precision gate per NFR28. Compress before upload per architecture doc.

### Story 8.5: In-Inspection Recommendation Display

**As a** beekeeper, **I want** to see the recommended next action during my inspection with rationale and confidence, **so that** I can make informed decisions in the field.
**FRs:** FR21, FR22, FR23, FR24, FR54, FR54a
**TDD Requirements:**
- Test: RecommendationCard renders action, rationale, confidence, and fallback.
- Test: High confidence renders with success styling, low with warning.
- Test: Insufficient data confidence shows "Not enough information" message (FR54a).
- Test: Conflicting evidence confidence shows "Mixed signals" message (FR54a).
- Test: Fallback action always present and accessible.
- Test: Recommendation includes treatment legality notice when applicable (FR12b).
**Acceptance Criteria:**
- [ ] RecommendationCard with hierarchy: action (Heading xl) > rationale (Text sm) > confidence (Progress) > fallback (Alert warning)
- [ ] Confidence type distinguished: insufficient data vs conflicting evidence (FR54a)
- [ ] Treatment regulatory notice when applicable (FR12b, FR12c)
- [ ] "Did It" (positive) and "Ignore" (link) buttons with context labels
- [ ] Recommendation dismissable to see alternative
**Tech Notes:** Per CLAUDE.md: action + rationale + confidence + fallback always present. Button labels include context per accessibility requirements.

### Story 8.6: Pause, Resume, and Complete Inspection

**As a** beekeeper, **I want** to pause and resume an inspection, and complete it with a summary, **so that** I can handle interruptions and review my findings.
**FRs:** FR25b, FR30
**TDD Requirements:**
- Test: Pause inspection preserves all captured observations and current position.
- Test: Resume inspection loads from paused state with correct prompt position.
- Test: App termination during inspection allows resume on relaunch (NFR9d).
- Test: Complete inspection shows summary of all observations and recommendations.
- Test: Post-inspection correction step allows editing transcriptions (FR30).
**Acceptance Criteria:**
- [ ] Pause button available throughout inspection flow
- [ ] "Resume inspection?" prompt on app relaunch if inspection was in progress
- [ ] Completion summary screen: observations, media, recommendations, actions taken
- [ ] Post-inspection review/correction step for voice transcriptions
- [ ] Inspection record status transitions: in_progress > paused > completed
- [ ] Voice-driven next-action discussion after observation steps: system proposes follow-up date and type based on observations; user agrees, modifies, or declines via voice (FR21a)
- [ ] Agreed follow-up actions auto-scheduled without requiring UI taps (FR29a)
- [ ] Inspection summary displays scheduled follow-ups as confirmations (e.g., 'Re-inspect Mar 28 — scheduled') rather than as actions requiring user input (FR29a)
**Tech Notes:** Local persistence via MMKV for in-progress state. Resume prompt via Zustand store check on app launch. Post-observation voice discussion (FR21a): after the final observation step, the system initiates a conversational exchange proposing a follow-up. The agreed follow-up is persisted as a scheduled task immediately (FR29a) and displayed as a confirmation in the summary.

### Story 8.7: Hive Audio Capture and Acoustic Analysis

**As a** beekeeper, **I want** to record hive entrance sounds for acoustic analysis, **so that** I get additional colony health signals without extra hardware.
**FRs:** FR56, FR57, FR58
**TDD Requirements:**
- Test: Audio capture records a 30-second sample from device microphone.
- Test: Audio uploaded and triggers acoustic analysis pipeline.
- Test: Analysis returns colony-state indicators: queenright, agitation, swarm readiness.
- Test: Results display with confidence levels.
- Test: Acoustic indicators feed into recommendation evidence context.
**Acceptance Criteria:**
- [ ] "Record hive sounds" option during inspection
- [ ] 30-second guided recording with visual waveform/timer
- [ ] Results: queenright confidence, agitation level, swarm readiness with confidence
- [ ] Results displayed as additional observation evidence
- [ ] Indicators included in recommendation generation
**Tech Notes:** Acoustic analysis via Vertex AI. Audio format: opus. Results stored as observation with type `acoustic_analysis`.

### Story 8.8: Continuous Multi-Hive Voice Session

**As a** beekeeper in the field, **I want** to flow through all my hives in one continuous voice session without touching my phone, **so that** I can keep my hands free, stay focused on the bees, and complete my yard visit efficiently.
**FRs:** FR19c, FR19d
**TDD Requirements:**
- Test: Voice command "next hive" saves current hive observations and loads next hive context
- Test: Voice command "move to Hive 4" navigates to specific hive
- Test: Voice command "which hive am I on?" announces current hive name and status
- Test: Voice command "how many hives left?" announces remaining count
- Test: Voice command "end session" triggers session summary
- Test: Per-hive context is preserved when navigating between hives
- Test: System announces next hive context (last inspection, status, recommended type) on transition
**Acceptance Criteria:**
- [ ] User can complete full multi-hive inspection without touching the phone
- [ ] Per-hive observations are saved automatically on hive transition
- [ ] Next hive context is announced via TTS on transition
- [ ] Voice navigation commands work reliably (next, specific hive, back, status)
- [ ] Session tracks total hives visited, time per hive, and completion status

### Story 8.9: Post-Session Evening Review

**As a** beekeeper who just completed a yard session, **I want** to review everything I captured across all hives that evening with a tap-friendly UI, **so that** I can correct transcriptions, add forgotten details, and confirm follow-up scheduling from the comfort of my home.
**FRs:** FR30c
**TDD Requirements:**
- Test: Evening review screen shows all hives from the session grouped chronologically
- Test: Each hive section shows: observations, voice transcripts, photos, AI results, follow-ups
- Test: User can edit any transcript or observation
- Test: User can add notes retroactively
- Test: User can confirm or reschedule follow-up actions
- Test: Original audio playback is available for each voice entry
**Acceptance Criteria:**
- [ ] Review accessible from homepage after a completed session ("Review today's session")
- [ ] All hives from session displayed with collapsible per-hive sections
- [ ] Transcripts editable with original audio available
- [ ] Follow-up actions confirmable or reschedulable
- [ ] Low-confidence transcriptions flagged for attention
- [ ] Review can be completed across multiple sittings (state persisted)

---

## Epic 9: Recommendation Engine

**Goal:** The backend recommendation service generates context-aware, explainable next-best-action recommendations using history, seasonal context, telemetry, and AI inference.
**FRs:** FR12, FR14, FR18, FR20, FR21, FR22, FR23, FR24, FR35, FR38, FR47, FR48, FR48b, FR52, FR54, FR54a, FR54b, FR54c

### Story 9.1: Recommendation Service — Core Context Assembly

**As a** system, **I want** to assemble the full context for recommendation generation (user history, seasonal phase, regional baselines, hive state, telemetry), **so that** recommendations are grounded in all available evidence.
**FRs:** FR12, FR35
**TDD Requirements:**
- Test: Context assembly includes user's last 3 inspections for the hive.
- Test: Context assembly includes regional seasonal phase for user's location.
- Test: Context assembly includes active telemetry readings if available.
- Test: Missing context sources are flagged with reason in assembly output.
- Test: Skill level included in context for guidance depth adaptation.
**Acceptance Criteria:**
- [ ] Go service function: `AssembleRecommendationContext(hiveID, userID) -> RecommendationContext`
- [ ] Sources assembled: inspection history, hive state, seasonal phase, weather, flora, telemetry, skill level
- [ ] Each source tagged with freshness timestamp
- [ ] Missing/stale sources flagged per FR48b thresholds
- [ ] Context cached in Redis for repeated access during session
**Tech Notes:** Redis pre-computation per architecture doc. Rolling window: current season + prior season for history.

### Story 9.2: Recommendation Scoring via Gemini

**As a** system, **I want** to score and rank recommended actions using Gemini AI with the assembled context, **so that** users get the most impactful next action.
**FRs:** FR14, FR21, FR22, FR23, FR24
**TDD Requirements:**
- Test: Scoring returns action, rationale, confidence, and fallback for every recommendation.
- Test: Confidence is downgraded when contributing context sources are stale (FR48b).
- Test: High-priority actions (pest treatment, starvation risk) rank above routine maintenance.
- Test: Fallback action differs from primary action and is safe/conservative.
- Test: Scoring respects treatment legality for user's jurisdiction (FR12a, FR12b).
- Test: Limited regional baseline coverage returns `LIMITED_EXPERIENCE` confidence type (FR54c).
**Acceptance Criteria:**
- [ ] Gemini API call with structured prompt including full context
- [ ] Response parsed into Recommendation type: action, rationale, confidence, confidenceType, fallback
- [ ] Confidence penalties applied for stale sources
- [ ] Treatment legality checked against jurisdiction registry
- [ ] `LIMITED_EXPERIENCE` confidence when regional data is sparse
**Tech Notes:** Vertex AI Gemini. Structured prompt template in Go. Rate limit Gemini calls. Cache recommendations with TTL.

### Story 9.3: Confidence Calibration and Evidence Tracing

**As a** system, **I want** every recommendation to include traceable evidence context, **so that** support can replay decisions and users understand the basis.
**FRs:** FR50, FR51, FR53, FR54a, FR54b
**TDD Requirements:**
- Test: Recommendation record includes evidence_context JSONB with all source references.
- Test: Confidence type correctly distinguishes insufficient data from conflicting evidence (FR54a).
- Test: User negative outcome feedback links to recommendation record (FR54b).
- Test: Audit event created for every recommendation generation.
- Test: Support query can retrieve full recommendation + evidence + user actions chain.
**Acceptance Criteria:**
- [ ] Evidence context stored: source IDs, freshness, contribution weight
- [ ] Two distinct low-confidence paths: "Not enough information" vs "Mixed signals"
- [ ] User feedback mutation: report negative outcome linked to recommendation
- [ ] Audit event: recommendation_generated with full payload
- [ ] Support query: recommendation history with evidence and user actions
**Tech Notes:** Audit events are append-only. Evidence context is the foundation for trust recovery (edge case in PRD).

### Story 9.4: Degraded Mode and Conservative Defaults

**As a** system, **I want** to provide safe recommendations when integrations are unavailable or data is stale, **so that** users always get actionable guidance even in degraded conditions.
**FRs:** FR9, FR48, FR48b, FR48c, FR52
**TDD Requirements:**
- Test: Missing weather data triggers conservative seasonal defaults.
- Test: Missing telemetry uses history-only recommendations with confidence downgrade.
- Test: Completely missing localization blocks recommendations with clear message (FR9).
- Test: Recovery guidance generated after missed/delayed actions (FR52).
- Test: Staleness thresholds configurable per data category.
**Acceptance Criteria:**
- [ ] Graceful degradation: always return a recommendation, even if conservative
- [ ] Confidence explicitly downgraded with degraded source identified
- [ ] No recommendations when region/season context unavailable (FR9) — show "Complete profile" CTA
- [ ] Recovery guidance for overdue tasks
- [ ] Staleness thresholds: weather 24h, flora 7d, telemetry configurable
**Tech Notes:** Conservative defaults from regional baselines. Recovery guidance is a special recommendation type.

### Story 9.5: Skill-Level Mismatch Detection

**As a** system, **I want** to detect when a user's behavior suggests their skill level is misconfigured, **so that** I can suggest a profile adjustment.
**FRs:** FR2d
**TDD Requirements:**
- Test: "Experienced" user frequently viewing educational explanations triggers mismatch signal.
- Test: "Newbie" user consistently dismissing guided steps triggers mismatch signal.
- Test: Mismatch detection suggests profile adjustment, does not auto-change.
- Test: Detection requires sustained pattern (not single instance).
**Acceptance Criteria:**
- [ ] Behavioral signal tracking: education view rate, guided step dismissal rate
- [ ] Mismatch threshold: 5+ signals in 2-week window
- [ ] Gentle suggestion: "Your experience setting might need updating" card
- [ ] One-tap adjustment from suggestion card
**Tech Notes:** Signals tracked as lightweight counters in user profile. Evaluated weekly or on inspection completion.

---

## Epic 10: Planning & Weekly Queue

**Goal:** Users see a prioritized weekly action queue and seasonal planning calendar. Actions can be completed, deferred, or dismissed with priority rebalancing.
**FRs:** FR13, FR14, FR15, FR16, FR16b, FR17, FR18

### Story 10.1: Happy Context Homepage

**As a** user, **I want** a home screen that shows my current context (weather, bloom, seasonal phase, regional scale data) and clear CTAs, **so that** I know what matters today without digging.
**FRs:** FR10, FR10a, FR11, FR11c, FR13, FR17
**TDD Requirements:**
- Test: Homepage renders HomepageContextCards for weather, bloom, and seasonal signals.
- Test: Homepage renders regional hive scale weight average card with daily weight change and freshness timestamp (FR10a).
- Test: Regional nectar flow indicator displays alongside weather and bloom data (FR11c).
- Test: Two primary CTAs render: "View My Apiaries" and "Start Today's Plan".
- Test: Risk-themed seasonal signals (swarm, starvation, pest, queen) display when relevant (FR17).
- Test: Homepage loads within 2 seconds (NFR1 — performance test).
**Acceptance Criteria:**
- [ ] HomepageContextCards: weather, bloom status, seasonal phase
- [ ] Regional scale weight card: average daily weight change for user's area with freshness timestamp (FR10a)
- [ ] Regional nectar flow indicator sourced from beecounted.org or equivalent (FR11c)
- [ ] Primary CTAs: "View My Apiaries" (outline), "Start Today's Plan" (solid primary)
- [ ] Seasonal risk signals with appropriate status badges
- [ ] Skill-adaptive greeting and tone
- [ ] Cache-first loading for instant display
**Tech Notes:** Context cards use `<Card variant="filled">` with semantic backgrounds. CTAs per button hierarchy in CLAUDE.md. Regional scale data sourced from beecounted.org API with graceful degradation if unavailable.
**Note (FR12b2):** The homepage shall include a 'Live Mode Briefing' option that verbally summarizes all current context via TTS (weather, bloom, scale weight trends, pending actions, alerts) for a hands-free morning briefing. This is a voice-driven entry point, not a card — consider a "Brief me" button or voice command.
**Note (FR46a):** When the user has configured weight telemetry access, the homepage shall display a 'Your Hives' scale weight card showing per-hive weight trends from the user's own connected sensors, in addition to the regional average card.

### Story 10.2: Weekly Action Queue by Apiary

**As a** user, **I want** a prioritized weekly action queue grouped by apiary with a materials checklist, **so that** I can plan my week efficiently and ensure I have everything I need.
**FRs:** FR13, FR13a, FR14, FR16
**TDD Requirements:**
- Test: Queue renders tasks grouped by apiary using ApiaryAccordionQueue.
- Test: Tasks ordered by priority (urgency x impact) within each apiary.
- Test: Overdue tasks highlighted inline within their apiary/hive context with URGENT badge and warning styling, not as a separate card (FR16).
- Test: Required Materials checklist renders before the action queue when materials are needed (FR13a).
- Test: Required Materials section is hidden when no materials are needed (FR13a).
- Test: Each material item links to the specific hive/action requiring it (FR13a).
- Test: Queue exceeding 20 items per apiary uses pagination (NFR17b).
- Test: Progressive loading: first apiary in <2s, rest loaded in background (NFR17c).
**Acceptance Criteria:**
- [ ] Required Materials checklist displayed before action queue when applicable (FR13a)
- [ ] Materials linked to specific hive/action (e.g., "Apivar strips — Hive 3 mite treatment")
- [ ] Materials section hidden when no materials needed
- [ ] ApiaryAccordionQueue component with expandable apiary sections
- [ ] Tasks show: title, hive, priority badge, due date, recommended action
- [ ] Overdue tasks highlighted inline within their apiary/hive context with URGENT badge and warning styling (not as a separate negative card at the top). Catch-up guidance shown inline with the overdue item. Weekly plan maintains a constructive tone (FR16).
- [ ] Pagination/grouping for large queues
- [ ] Pull-to-refresh to recalculate priorities
**Tech Notes:** Accordion per CLAUDE.md. Priority computation from recommendation engine. Background loading for large accounts. Materials derived from planned actions — each action type maps to a known set of required materials/equipment.

### Story 10.3: Task Actions — Complete, Defer, Dismiss

**As a** user, **I want** to mark tasks as done, defer them, or dismiss them with an optional reason, **so that** I can manage my workload flexibly.
**FRs:** FR16b
**TDD Requirements:**
- Test: "Did It" button completes task and updates status.
- Test: Defer task shows reason capture (optional) and new date picker.
- Test: Dismiss task removes from queue with optional reason.
- Test: Deferring/dismissing triggers priority rebalancing for remaining tasks.
- Test: Completed task count updates skill progression (FR34).
**Acceptance Criteria:**
- [ ] "Did It" button: `<Button action="positive">` with context label
- [ ] Defer: bottom sheet with optional reason and date selector
- [ ] Dismiss: `<Button action="secondary" variant="link">` with optional reason
- [ ] Priority rebalance after any status change (FR18)
- [ ] Success toast on action completion
**Tech Notes:** Context-rich button labels per accessibility: "Mark 'Add super to Hive 3' as done" not just "Did It".

### Story 10.4: Seasonal Planning Calendar

**As a** user, **I want** a seasonal planning calendar showing recommended activities by month, **so that** I can see what is coming and prepare.
**FRs:** FR15, FR17
**TDD Requirements:**
- Test: Calendar renders current season's months with activity indicators.
- Test: Tapping a month shows recommended activities for that period.
- Test: Risk windows (swarm, starvation) highlighted with appropriate status colors.
- Test: Calendar adapts to user's regional seasonal context.
**Acceptance Criteria:**
- [ ] SeasonalPlanningCalendar grid showing months with activity badges
- [ ] Risk window highlighting: swarm (warning), starvation (error), pest pressure (warning)
- [ ] Month detail view with recommended activities
- [ ] Regional and skill-level adaptation
- [ ] Current month highlighted
**Tech Notes:** Calendar data generated from regional seasonal templates + user's hive configuration. Use `<Box>` + `<Grid>` per CLAUDE.md component mapping.

### Story 10.5: Dynamic Priority Updates

**As a** user, **I want** my action queue to update when new context arrives (weather change, telemetry alert, completed inspection), **so that** priorities always reflect current reality.
**FRs:** FR18
**TDD Requirements:**
- Test: New telemetry reading triggers queue recomputation.
- Test: Completed inspection removes related tasks and may add new ones.
- Test: Weather change affecting urgency bumps relevant tasks up.
- Test: Recomputation is async and does not block UI.
**Acceptance Criteria:**
- [ ] Queue refreshes on pull-to-refresh and background polling
- [ ] New high-priority items surface with notification
- [ ] Completed inspections automatically update task statuses
- [ ] Priority changes visible with animation/highlight
**Tech Notes:** Server-side recomputation via Pub/Sub event handling. Client polls or uses TanStack Query refetch intervals.

---

## Epic 11: Voice Capture & Media Processing Pipeline

**Goal:** End-to-end pipeline for voice recording, transcription, image upload, and media processing — the async infrastructure that inspection and logging depend on.
**FRs:** FR27, FR28, FR29, FR30a, FR30b, FR36, FR37, FR56, FR57

### Story 11.1: Cloud Storage Upload with Signed URLs

**As a** mobile app, **I want** to upload audio and image files to Cloud Storage via short-lived signed URLs, **so that** media is stored securely without exposing bucket credentials.
**FRs:** FR27, FR28
**TDD Requirements:**
- Test: API generates signed upload URL with 15-minute expiry.
- Test: Client uploads file to signed URL successfully.
- Test: Expired URL rejects upload with clear error.
- Test: Upload triggers Cloud Storage notification to Pub/Sub topic.
- Test: Failed upload queues locally with "will upload when online" state.
**Acceptance Criteria:**
- [ ] GraphQL mutation: `generateUploadUrl(contentType, purpose) -> signedUrl, storagePath`
- [ ] Signed URL expiry: 15 minutes
- [ ] Cloud Storage notification triggers `media-uploaded` Pub/Sub topic
- [ ] Client-side retry with exponential backoff on failure
- [ ] Local queue for offline uploads
**Tech Notes:** Cloud Storage bucket `broodly-media-{env}` with lifecycle rules. Compress before upload: HEIC/WebP images, opus audio.

### Story 11.2: Speech-to-Text Worker (Gemini STT)

**As a** system, **I want** a Cloud Run worker that transcribes voice recordings when triggered, **so that** voice observations become structured text.
**FRs:** FR29, FR30a, FR30b, NFR5b
**TDD Requirements:**
- Test: Worker receives Pub/Sub message with audio storage path.
- Test: Worker calls Gemini STT API and receives transcription.
- Test: Transcription stored on observation record with confidence score.
- Test: Low-confidence transcriptions (<90% word accuracy) flagged for review (FR30b).
- Test: Original audio retained in storage (FR30a).
- Test: Worker handles beekeeping-specific vocabulary correctly (varroa, propolis, brood, nuc, etc.).
**Acceptance Criteria:**
- [ ] Cloud Run worker subscribed to `media-uploaded` topic (audio type)
- [ ] Gemini STT via Vertex AI API
- [ ] Transcription + confidence score written to observation record
- [ ] Low-confidence entries flagged with `needs_review` status
- [ ] Beekeeping domain terms handled with custom vocabulary hints
- [ ] Dead-letter queue for processing failures
**Tech Notes:** Separate Cloud Run container for async workers per architecture. Custom vocabulary/glossary for domain terms per FR technical constraints.

### Story 11.3: Vision AI Analysis Worker

**As a** system, **I want** a worker that analyzes inspection photos for brood patterns, queen cells, and pest indicators, **so that** image findings feed into recommendations.
**FRs:** FR36, FR37, FR38, NFR5, NFR27, NFR28
**TDD Requirements:**
- Test: Worker receives Pub/Sub message with image storage path.
- Test: Worker calls Gemini Vision API with inspection-specific prompt.
- Test: Analysis returns structured findings with confidence scores.
- Test: Results below 70% confidence show fallback message (NFR27).
- Test: Supported categories: brood pattern, queen cells, pest/disease indicators.
- Test: Results stored on media record as analysis_result JSONB.
**Acceptance Criteria:**
- [ ] Cloud Run worker subscribed to `media-uploaded` topic (image type)
- [ ] Gemini Vision analysis for supported categories
- [ ] Structured result: category, finding, confidence, interpretation
- [ ] Sub-threshold results (<70%) return "inconclusive" with manual assessment guidance
- [ ] Results written to media.analysis_result
- [ ] Processing within 5 seconds target (NFR5) or pending state feedback
**Tech Notes:** 80% precision target on expert-labeled validation sets (NFR28). Descope to capture-only if beta precision <70%.

### Story 11.4: Acoustic Analysis Worker

**As a** system, **I want** a worker that analyzes hive audio recordings for colony-state signals, **so that** acoustic data enriches recommendations.
**FRs:** FR57, FR58
**TDD Requirements:**
- Test: Worker receives audio recording and returns colony-state indicators.
- Test: Indicators include: queenright confidence, agitation level, swarm readiness.
- Test: Each indicator has an associated confidence score.
- Test: Results stored as observation evidence and feed recommendation context.
**Acceptance Criteria:**
- [ ] Cloud Run worker for acoustic analysis via Vertex AI
- [ ] Output: queenright (float), agitation (float), swarm_readiness (float) with confidence
- [ ] Results stored on observation record
- [ ] Results available to recommendation context assembly
**Tech Notes:** Acoustic analysis is novel; expect iterative model tuning. Conservative confidence thresholds initially.

### Story 11.5: Embedding Generation Worker (pgvector)

**As a** system, **I want** embeddings generated for inspection text, images, and audio, **so that** semantic search and similarity-based recommendation input are available.
**FRs:** FR12 (recommendation context enrichment)
**TDD Requirements:**
- Test: Worker generates embedding from text observation and stores in pgvector.
- Test: Worker generates embedding from image and stores in pgvector.
- Test: Cosine similarity query returns semantically related past observations.
- Test: Embedding dimension matches Vertex AI Embedding 2.0 output.
**Acceptance Criteria:**
- [ ] Cloud Run worker subscribed to `embedding-requests` topic
- [ ] Vertex AI Embedding 2.0 (multimodal) for text, image, audio
- [ ] Embeddings stored in PostgreSQL pgvector column
- [ ] Similarity search query function in sqlc repository
**Tech Notes:** pgvector extension on Cloud SQL. Embeddings used for finding similar past inspection scenarios for recommendation context.

---

## Epic 12: Notifications & Operational Alerts

**Goal:** Users receive actionable, risk-aware notifications with configurable sensitivity and escalation. Notification fatigue is managed through suppression and bundling. Per-apiary sensitivity and quiet hours provide fine-grained control.
**FRs:** FR39, FR40, FR40a, FR40b, FR41, FR42, FR43, FR47b, FR55b

### Story 12.1: Notification Dispatch Worker

**As a** system, **I want** a notification dispatch worker that sends push notifications based on events, **so that** users receive timely alerts about their hives.
**FRs:** FR39, FR43
**TDD Requirements:**
- Test: Worker receives notification-dispatch Pub/Sub message and sends push notification.
- Test: Notification includes: title, contextual reason, and recommended next step (FR43).
- Test: Notification payload includes deep link to relevant screen.
- Test: Failed delivery retried with exponential backoff.
- Test: Notification event logged in audit table.
**Acceptance Criteria:**
- [ ] Cloud Run worker subscribed to `notification-dispatch` topic
- [ ] Push notification via Firebase Cloud Messaging
- [ ] Notification payload: title, body (reason + next step), deep link, priority level
- [ ] Delivery status tracked
- [ ] Audit event for every notification sent
**Tech Notes:** FCM for cross-platform push. Expo notification configuration for iOS/Android.

### Story 12.2: Notification Center UI

**As a** user, **I want** an in-app notification center to see recent alerts and their context, **so that** I can review what needs attention.
**FRs:** FR39, FR43
**TDD Requirements:**
- Test: Notification center renders list of recent notifications.
- Test: Each notification shows ActionableNotificationCard with context.
- Test: Tapping notification navigates to relevant screen.
- Test: Unread count badge on navigation icon.
**Acceptance Criteria:**
- [ ] NotificationCenter drawer (per CLAUDE.md) accessible from home screen
- [ ] ActionableNotificationCard: title, reason, recommended action, timestamp
- [ ] Status-appropriate styling (success/warning/error/info)
- [ ] Tap navigates to relevant hive/inspection/task
- [ ] Unread count badge
**Tech Notes:** Use `<Drawer>` component per CLAUDE.md mapping.

### Story 12.3: Configurable Notification Controls and Suppression

**As a** user, **I want** global notification controls with quiet hours and seasonal auto-adjustment, **so that** I am not overwhelmed by low-value alerts.
**FRs:** FR40, FR40b, FR42
**TDD Requirements:**
- Test: Global on/off toggle enables or disables all non-critical notifications (FR40).
- Test: Seasonal escalation auto-adjustment increases sensitivity during high-risk windows (FR40).
- Test: Quiet hours with configurable start/end times block notifications during configured hours (FR40b).
- Test: Low-value notifications bundled instead of sent individually.
**Acceptance Criteria:**
- [ ] Settings screen: global notification on/off toggle (FR40)
- [ ] Seasonal escalation auto-adjustment toggle (global) (FR40)
- [ ] Quiet hours: configurable start time and end time (FR40b)
- [ ] Bundling for non-urgent notifications
- [ ] Changes take effect immediately
- [ ] Per-apiary sensitivity controls are NOT required for MVP (FR40 — removed FR40a)
**Tech Notes:** Notification preferences stored in notification_preferences table. Worker checks preferences before dispatch. Seasonal escalation uses current seasonal phase to auto-adjust sensitivity thresholds. Per-apiary sensitivity was descoped as over-engineered for MVP.

### Story 12.4: Escalation for Unresolved High-Priority Alerts

**As a** system, **I want** to escalate unresolved high-priority alerts, **so that** critical risks are not silently ignored.
**FRs:** FR41, FR47b
**TDD Requirements:**
- Test: Unresolved high-priority task after 48 hours triggers escalation notification.
- Test: Escalation uses stronger notification channel (higher priority push).
- Test: Telemetry-triggered alerts require corroboration before escalation (FR47b).
- Test: Escalation respects user's escalation_enabled preference.
- Test: Maximum 1 escalation per task per 48-hour window.
**Acceptance Criteria:**
- [ ] Escalation logic: unresolved high-priority task > 48h triggers re-notification
- [ ] Escalated notification clearly marked as escalation
- [ ] Telemetry alerts require corroboration from sustained trend or second signal (FR47b)
- [ ] Escalation can be disabled per apiary
- [ ] Escalation frequency capped
**Tech Notes:** Use Cloud Tasks for scheduled escalation checks. Corroboration logic evaluates multiple readings or sensor types.

### Story 12.5: In-App Feedback Prompts

**As a** system, **I want** to present periodic feedback prompts measuring decision confidence and perceived value, **so that** we can track product effectiveness.
**FRs:** FR55b
**TDD Requirements:**
- Test: Feedback prompt shows after completing 3rd inspection (not before).
- Test: Prompt asks confidence rating (1-5) and optional comment.
- Test: Dismissing prompt does not show again for 2 weeks.
- Test: Feedback stored in user_feedback table linked to recent recommendations.
**Acceptance Criteria:**
- [ ] Feedback prompt: "How confident did you feel making decisions this week?" (1-5 scale)
- [ ] Optional free-text comment
- [ ] Frequency: max once every 2 weeks, after qualifying activity
- [ ] Non-intrusive: dismissible, never blocks workflow
- [ ] Data stored for analytics
**Tech Notes:** Trigger logic in client based on inspection count and last prompt date. Use bottom sheet, not modal.

---

## Appendix: FR-to-Story Mapping

| FR | Story |
|---|---|
| FR1a | 2.1, 5.4 |
| FR1b | 2.3 |
| FR1c | (Removed — social providers handle account recovery) |
| FR1d | 2.4 |
| FR2 | 6.2 |
| FR2a | 6.2 |
| FR2b | 6.1, 6.2, 6.3, 6.5 |
| FR2c | 6.5, 9.4 |
| FR2d | 9.5 |
| FR2e | 6.3 |
| FR3 | 3.1, 4.2, 7.1, 7.2, 7.3, 7.5 |
| FR4 | 3.1, 4.2, 7.2, 7.4, 7.5 |
| FR5 | 2.5, 7.6 |
| FR5a | 7.6 |
| FR6 | 2.5, 7.6 |
| FR7 | 2.5, 7.6 |
| FR8 | 6.1 |
| FR8a | 7.3 |
| FR8b | 7.3 |
| FR9 | 9.4 |
| FR10 | 10.1 |
| FR11 | 10.1 |
| FR11a | 7.3 |
| FR11b | 7.3 |
| FR12 | 9.1, 9.2, 11.5 |
| FR12a | 9.2, 3.5 |
| FR12b | 8.5, 9.2 |
| FR12c | 8.5 |
| FR13 | 4.4, 10.1, 10.2 |
| FR14 | 3.3, 4.4, 9.2, 10.2 |
| FR15 | 10.4 |
| FR16 | 4.4, 10.2 |
| FR16b | 4.4, 10.3 |
| FR17 | 10.1, 10.4 |
| FR18 | 10.5 |
| FR19 | 8.1, 8.2, 8.3, 8.8 |
| FR19a | 6.4, 8.1 |
| FR19b | 8.2, 8.3 |
| FR19c | 8.8 |
| FR19d | 8.8 |
| FR20 | 8.2, 9.1 |
| FR21 | 4.1, 8.5, 9.2 |
| FR22 | 4.1, 8.5, 9.2 |
| FR23 | 4.1, 8.5, 9.2 |
| FR24 | 4.1, 8.5, 9.2 |
| FR25 | 8.1 |
| FR25b | 4.3, 8.6 |
| FR25c | 8.2 |
| FR26 | 8.2 |
| FR27 | 3.2, 4.3, 8.3, 11.1 |
| FR28 | 3.2, 4.3, 8.4, 11.1 |
| FR29 | 3.2, 8.3, 11.2 |
| FR30 | 3.2, 8.6 |
| FR30a | 8.3, 11.2 |
| FR30b | 8.3, 11.2 |
| FR30c | 8.9 |
| FR31 | 3.1, 3.2 |
| FR32 | 4.5 |
| FR33 | 4.5 |
| FR34 | 3.5, 10.3 |
| FR35 | 3.5, 8.2, 9.1 |
| FR36 | 8.4, 11.3 |
| FR37 | 8.4, 11.3 |
| FR38 | 8.4, 11.3 |
| FR39 | 12.1, 12.2 |
| FR40 | 3.5, 12.3 |
| FR40a | 12.3 |
| FR40b | 12.3 |
| FR41 | 12.4 |
| FR42 | 3.5, 12.3 |
| FR43 | 12.1, 12.2 |
| FR44 | 3.4 |
| FR44a | 3.4 |
| FR45 | 3.4 |
| FR46 | 3.4 |
| FR47 | 9.2 |
| FR47a | 3.4 |
| FR47b | 12.4 |
| FR48 | 9.4 |
| FR48a | 3.4, 5.5 |
| FR48b | 3.4, 5.5, 9.2, 9.4 |
| FR48c | 3.4, 9.4 |
| FR49 | 3.4 |
| FR50 | 3.3, 9.3 |
| FR51 | 3.3, 9.3 |
| FR52 | 9.4 |
| FR53 | 3.3, 9.3 |
| FR54 | 8.5, 9.2 |
| FR54a | 8.5, 9.3 |
| FR54b | 9.3 |
| FR54c | 9.2 |
| FR55 | 2.2, 2.5 |
| FR55b | 12.5 |
| FR56 | 8.7, 11.4 |
| FR57 | 8.7, 11.4 |
| FR58 | 8.7, 11.4 |

---

## Story Count Summary

| Epic | Stories | Estimated Days |
|---|---|---|
| 1: Project Scaffolding | 4 | 6-8 |
| 2: Authentication | 5 | 7-10 |
| 3: Database Schema | 5 | 5-8 |
| 4: GraphQL Schema & Resolvers | 5 | 8-12 |
| 5: Core Mobile Shell | 5 | 7-10 |
| 6: Onboarding Flow | 5 | 6-9 |
| 7: Apiary & Hive Management | 6 | 8-12 |
| 8: Guided Inspection Flow | 9 | 18-24 |
| 9: Recommendation Engine | 5 | 10-14 |
| 10: Planning & Weekly Queue | 5 | 8-12 |
| 11: Voice & Media Pipeline | 5 | 8-12 |
| 12: Notifications | 5 | 7-10 |
| **Total** | **64** | **98-141** |

---

## Implementation Sequencing Notes

- **Epics 1-3 are foundational** and must complete before feature work begins. They can partially overlap (scaffolding + schema work in parallel).
- **Epics 4-5 run in parallel**: API resolvers and mobile shell are independent until integration.
- **Epic 6 (Onboarding) is the first end-to-end user flow** and validates the full stack.
- **Epic 7 (CRUD) before Epic 8 (Inspection)**: inspections require existing hives.
- **Epic 9 (Recommendation Engine) powers Epics 8 and 10**: scaffold the engine early, refine iteratively.
- **Epic 11 (Media Pipeline) supports Epic 8**: voice and image workers needed for full inspection flow.
- **Epic 12 (Notifications) is the final layer**: depends on recommendation engine and planning queue being functional.
- **UX Review Blockers** (from ux-review-2026-03-21.md) should be addressed before implementing affected screens:
  - Blocker #1 (4-tab nav): addressed in Story 5.1
  - Blocker #2 (contrast ratios): addressed in Story 1.3 token configuration
  - Blocker #3 (touch targets): addressed across all UI stories, explicitly in Story 5.1
  - Blocker #4 (token names): addressed in Story 1.3
