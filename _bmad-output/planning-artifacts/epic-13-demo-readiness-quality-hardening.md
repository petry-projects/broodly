# Epic 13: Demo Readiness & Quality Hardening

**Goal:** Address all gaps identified in the full team review (2026-03-30) to achieve demo readiness, full E2E test coverage, and alignment with org standards.
**Priority:** Critical
**Source:** Consolidated findings from Architect, UX, Dev, QA, SM, and TEA reviews
**Last Updated:** 2026-03-31

---

## Infrastructure Dependency Analysis

### What's Available Now
- Firebase Auth Emulator (configured, port 9099, npm scripts ready)
- Playwright E2E framework (webServer auto-starts Expo on port 8081)
- PostgreSQL via testcontainers (Go integration tests)
- Expo web dev server (fully functional)
- Auth fixtures exist (`auth-fixture.ts`, `graphql-fixture.ts`) but are unused

### What's Blocked
The Go API server at `apps/api/cmd/server/main.go` has a **placeholder GraphQL handler** that returns `{"data":null}`. No database connection is initialized. This blocks:

| Capability | Blocked By | Impact |
|---|---|---|
| Authenticated CRUD E2E tests | GraphQL handler not wired (Story 13.1) | Cannot test create/read/update/delete flows |
| Data persistence verification | No DB connection in server | Cannot verify round-trip data integrity |
| Recommendation display | `Recommendations` resolver panics | Cannot show core product value |
| User profile management | `Me` resolver panics | Cannot test profile flows |

### E2E Coverage Achievable WITHOUT Backend

| Test Category | Backend Needed? | Current Coverage |
|---|---|---|
| UI rendering, branding, layout | No | 10 tests |
| Onboarding flow (all 7 steps) | No | 15 tests |
| Auth guards (redirect unauthenticated) | No | 6 tests |
| Form validation | No | 7 tests |
| Offline/connectivity behavior | No | 2 tests |
| Responsive viewports | No | 3 tests |
| Accessibility (touch targets, ARIA, keyboard) | No | 4 tests |
| **Authenticated routes (post-login UI)** | **Firebase Emulator only** | **0 tests** |
| **CRUD operations** | **Full stack** | **0 tests** |
| **Recommendation display** | **Full stack** | **0 tests** |
| **Inspection end-to-end** | **Full stack** | **0 tests** |

### Conclusion: Partial Block

**Not fully blocked.** We can expand E2E coverage significantly in two phases:
1. **Phase A (no backend needed):** Authenticated UI tests using Firebase Auth Emulator + `page.addInitScript()` to inject auth state. This validates all post-login screens render correctly, navigation works, and client-side state is correct. ~30 FRs unblocked.
2. **Phase B (backend required):** Full round-trip E2E tests (action → API → DB → response → UI). Blocked on Story 13.1. ~25 FRs remain blocked until backend wiring is complete.

---

## Story 13.1: Fix Backend Wiring — GraphQL Handler & Resolvers

**Priority:** P0 — Blocks Phase B E2E coverage
**Source:** Architect review
**Blocks:** Stories 13.9, 13.10, 13.11, 13.12

**Tasks:**
- [ ] Wire gqlgen handler in `apps/api/cmd/server/main.go` with DB connection, service instantiation, resolver registration
- [ ] Implement `Me` resolver (user lookup/upsert on first login)
- [ ] Implement `Recommendations` resolver (delegate to RecommendationService)
- [ ] Add `RecommendationService` and `UserService` to resolver struct
- [ ] Add migration 000007: fix `confidence_type` CHECK constraint (add moderate, low, limited_experience), add `in_progress` to task status
- [ ] Add Playwright webServer entry to start Go API on port 8080
- [ ] Tests for all new resolvers

---

## Story 13.2: Authenticated E2E Test Scaffolding (Phase A — No Backend)

**Priority:** P0 — Highest-leverage testing fix
**Source:** TEA review (Gap #1)
**Depends on:** Firebase Auth Emulator (available)
**Unblocks:** ~30 FRs for client-side validation

**Tasks:**
- [ ] Create Firebase Auth Emulator test user provisioning in `globalSetup`
- [ ] Implement authenticated test fixture using `page.addInitScript()` to inject Firebase auth state into Zustand store
- [ ] Create `AuthenticatedBasePage` page object that extends `BasePage` with auth setup
- [ ] Add E2E test: Authenticated user sees dashboard with summary bar (FR13)
- [ ] Add E2E test: Apiaries list renders empty state for new user (FR3)
- [ ] Add E2E test: Create apiary form renders with validation (FR3)
- [ ] Add E2E test: Hive list screen accessible from apiary (FR4)
- [ ] Add E2E test: Plan screen renders weekly queue layout (FR13)
- [ ] Add E2E test: Inspection entry shows full/quick options (FR19, FR25)
- [ ] Add E2E test: Inspection step engine advances through prompts (FR19, FR25c)
- [ ] Add E2E test: Settings tab is accessible and renders content (FR1b)
- [ ] Add E2E test: Evening review screen renders (FR30c)

**FRs Validated (client-side rendering):** FR1b, FR3, FR4, FR13, FR16, FR19, FR25, FR25b, FR25c, FR30c

---

## Story 13.3: Frontend Quick Fixes for Demo

**Priority:** P1 — Done (2026-03-31)
**Source:** Dev + UX reviews

**Tasks:**
- [x] Remove `signInWithFacebook` and `FacebookAuthProvider` from `auth.web.ts`
- [x] Consolidate duplicate `mapFirebaseError` to single `auth/error-messages.ts` module
- [x] Move `router.replace()` in `inspect/step.tsx` into `useEffect`
- [x] Add `size="lg"` to Did It / Not now buttons in `plan/index.tsx`
- [x] Replace hardcoded hex in `_layout.tsx` with `ICON_COLORS` imports

---

## Story 13.4: Settings Screen Implementation

**Priority:** P1 — Visible gap
**Source:** TEA (Gap #4), UX review
**FRs:** FR1b, FR1d, FR2a

**Tasks:**
- [ ] Implement Settings screen with display name editing (FR1b)
- [ ] Add sign-out button with confirmation
- [ ] Add account deletion with confirmation dialog (FR1d)
- [ ] Add "Edit Profile" to modify onboarding data (FR2a)
- [ ] Replace "coming soon" stub
- [ ] Use Gluestack components, color tokens, 48px touch targets
- [ ] Unit tests for Settings screen
- [ ] E2E test: Settings screen renders with all sections (requires Story 13.2)

---

## Story 13.5: Recommendation Display Components

**Priority:** P1 — Core product value
**Source:** TEA (Gap #3)
**FRs:** FR21, FR22, FR23, FR24

**Tasks:**
- [ ] Implement `RecommendationCard` per CLAUDE.md spec (action + rationale + confidence + fallback)
- [ ] Wire into inspection summary screen
- [ ] Wire into dashboard (top recommendation)
- [ ] Add mock data rendering for demo/offline mode
- [ ] Unit tests for RecommendationCard (all confidence variants)
- [ ] E2E test: RecommendationCard renders with mock data on dashboard (requires Story 13.2)

---

## Story 13.6: Sprint Status & Story File Integrity

**Priority:** P2 — Process health
**Source:** SM review

**Tasks:**
- [ ] Audit all 68 story files and update task checkboxes to match actual implementation
- [ ] Update sprint-status.yaml to accurately reflect file statuses
- [ ] Generate project-context.md via bmad-generate-project-context
- [ ] Create FR traceability matrix mapping all 90 sub-FRs to stories and tests

---

## Story 13.7: Responsive Layout for Key Screens

**Priority:** P2 — Needed for tablet/desktop demo
**Source:** UX review (40% compliance)
**FRs:** NFR19, NFR20

**Tasks:**
- [ ] Add NativeWind breakpoint classes to Homepage (md:flex-row, lg:grid-cols-2)
- [ ] Add responsive layout to Apiaries list
- [ ] Add responsive layout to Dashboard
- [ ] E2E test: Verify responsive layout at 768px and 1024px (expand responsive.spec.ts)

---

## Story 13.8: Infrastructure Completion

**Priority:** P3 — Post-demo
**Source:** Architect review

**Tasks:**
- [ ] Implement Cloud Run Terraform module
- [ ] Create staging environment config
- [ ] Add rate limiting middleware to Go server
- [ ] Replace placeholder GCP project IDs
- [ ] Add pgvector extension migration and embeddings table

---

## Story 13.9: Full Round-Trip E2E — Apiary & Hive CRUD

**Priority:** P1 — Requires Story 13.1
**Source:** TEA FR traceability analysis
**FRs:** FR3, FR4, FR5, FR6
**Depends on:** Story 13.1 (backend wiring), Story 13.2 (auth scaffolding)

Per org AGENTS.md: E2E tests must validate full round-trip (action → API → database → response → UI reflection).

**Tasks:**
- [ ] E2E test: Create apiary → verify appears in list → verify in DB via GraphQL query
- [ ] E2E test: Edit apiary name → verify updated in list
- [ ] E2E test: Delete apiary → confirm dialog → verify removed from list
- [ ] E2E test: Create hive under apiary → verify in hive list
- [ ] E2E test: Edit hive type → verify updated
- [ ] E2E test: Delete hive → confirm → verify removed
- [ ] E2E test: Scale limit validation (5 apiaries, 100 hives per account)
- [ ] E2E test: Grant collaborator read-only access (FR5)
- [ ] E2E test: Revoke collaborator access (FR6)

---

## Story 13.10: Full Round-Trip E2E — Inspection Flow

**Priority:** P1 — Requires Story 13.1
**Source:** TEA FR traceability analysis
**FRs:** FR19, FR19b, FR19c, FR19d, FR20, FR25, FR25b, FR25c, FR26, FR27, FR29, FR30c
**Depends on:** Story 13.1, Story 13.2

**Tasks:**
- [ ] E2E test: Start full inspection → walk 5+ steps → reach summary (FR19, FR25c)
- [ ] E2E test: Start quick inspection → abbreviated flow → summary (FR25)
- [ ] E2E test: Pause inspection → resume → complete (FR25b)
- [ ] E2E test: Multi-hive session — transition between 2 hives via UI (FR19c)
- [ ] E2E test: Observations saved per-hive and visible in summary (FR19d, FR27)
- [ ] E2E test: Observation classification (normal/cautionary/urgent) (FR26)
- [ ] E2E test: Evening review shows completed inspection with observations (FR30c)
- [ ] E2E test: Transcript editor allows corrections (FR30)
- [ ] E2E test: Inspection creates recommendation via backend (FR20, FR29) — verifies round-trip

---

## Story 13.11: Full Round-Trip E2E — Planning & Recommendations

**Priority:** P1 — Requires Story 13.1
**Source:** TEA FR traceability analysis
**FRs:** FR13, FR14, FR16, FR16b, FR21, FR22, FR23, FR24
**Depends on:** Story 13.1, Story 13.2

**Tasks:**
- [ ] E2E test: Weekly queue renders tasks sorted by priority (FR13, FR14)
- [ ] E2E test: Complete task → verify removed from queue (FR16b)
- [ ] E2E test: Defer task → verify status updated with reason (FR16b)
- [ ] E2E test: Dismiss task → verify removed (FR16b)
- [ ] E2E test: Overdue task shows URGENT indicator (FR16)
- [ ] E2E test: Recommendation card shows action + rationale + confidence + fallback (FR21-24)
- [ ] E2E test: Materials checklist visible for tasks requiring supplies (FR13a)

---

## Story 13.12: Full Round-Trip E2E — User Profile & Data Export

**Priority:** P2 — Requires Story 13.1
**Source:** TEA FR traceability analysis
**FRs:** FR1b, FR1d, FR2a, FR32, FR33
**Depends on:** Story 13.1, Story 13.2, Story 13.4

**Tasks:**
- [ ] E2E test: Update display name → verify persisted (FR1b)
- [ ] E2E test: Account deletion → confirm dialog → verify signed out (FR1d)
- [ ] E2E test: Export data as JSON → verify download link returned (FR32)
- [ ] E2E test: Export data as CSV → verify download link returned (FR33)

---

## Story 13.13: E2E — Notifications, Staleness & Integrations

**Priority:** P3 — Requires Story 13.1 + notification backend
**Source:** TEA FR traceability analysis
**FRs:** FR39-43, FR44-49, FR48a-c, FR54
**Depends on:** Story 13.1, Story 13.2

**Tasks:**
- [ ] E2E test: Notification center renders with actionable items (FR39, FR43)
- [ ] E2E test: Notification sensitivity controls functional (FR40)
- [ ] E2E test: Staleness escalation — <24h subtle, 24-72h amber, >72h red (FR48a)
- [ ] E2E test: Per-source staleness indicators (weather, flora, telemetry) (FR48b-c)
- [ ] E2E test: Confidence downgrade messaging when sources stale (FR54)
- [ ] E2E test: Connect/disconnect telemetry provider (FR44, FR49)

---

## Story 13.14: E2E — Learning Progression & Image Analysis

**Priority:** P3 — Requires Story 13.1 + AI backend
**Source:** TEA FR traceability analysis
**FRs:** FR34-38, FR56-58
**Depends on:** Story 13.1, Story 13.2, Vertex AI integration

**Tasks:**
- [ ] E2E test: Skill progression card shows current level and milestones (FR34)
- [ ] E2E test: Guidance adapts to skill level (FR35)
- [ ] E2E test: Photo capture triggers Vision AI analysis (FR36, FR37)
- [ ] E2E test: Image findings appear in recommendations (FR38)
- [ ] E2E test: Audio capture triggers acoustic analysis (FR56-58)

---

## Dependency Graph

```
Story 13.3 (Quick Fixes) ✅ DONE — no dependencies

Story 13.2 (Auth E2E Scaffolding) — depends on Firebase Emulator (available)
  ├─ Story 13.4 (Settings Screen)
  ├─ Story 13.5 (Recommendation Display)
  └─ Story 13.7 (Responsive Layout)

Story 13.1 (Backend Wiring) — depends on gqlgen, PostgreSQL
  ├─ Story 13.9  (CRUD E2E) — depends on 13.1 + 13.2
  ├─ Story 13.10 (Inspection E2E) — depends on 13.1 + 13.2
  ├─ Story 13.11 (Planning E2E) — depends on 13.1 + 13.2
  ├─ Story 13.12 (Profile/Export E2E) — depends on 13.1 + 13.2 + 13.4
  ├─ Story 13.13 (Notifications E2E) — depends on 13.1 + 13.2
  └─ Story 13.14 (AI Features E2E) — depends on 13.1 + 13.2 + Vertex AI

Story 13.6 (Sprint Integrity) — no dependencies
Story 13.8 (Infrastructure) — no dependencies
```

---

## FR Coverage Projection

| Phase | Stories | FRs Covered | E2E Tests Added | Blocked By |
|---|---|---|---|---|
| **Done** | 13.3 | — | 0 (fixes only) | — |
| **Phase A** (no backend) | 13.2, 13.4, 13.5, 13.7 | ~15 FRs (client-side) | ~20 tests | Nothing — ready now |
| **Phase B** (backend required) | 13.9, 13.10, 13.11, 13.12 | ~30 FRs (round-trip) | ~30 tests | Story 13.1 |
| **Phase C** (AI/integrations) | 13.13, 13.14 | ~20 FRs | ~10 tests | Story 13.1 + Vertex AI |
| **Total** | All | **~65/90 FRs** (72%) | **~60 new E2E tests** | — |

Remaining ~25 FRs (FR8a, FR8b, FR10a, FR11b, FR11c, FR12a-c, FR15, FR17, FR18, FR30a-b, FR31a, FR40a2, FR40b, FR41, FR42, FR47a-b, FR50-53, FR55b) require either deferred features, external integrations, or multi-user scenarios not suitable for automated E2E testing.

---

## Summary

| Story | Priority | Effort | Blocked By | FRs |
|---|---|---|---|---|
| 13.1 Backend wiring | P0 | Large | Nothing | Unblocks 13.9-13.14 |
| 13.2 Auth E2E scaffolding | P0 | Medium | Nothing | ~15 FRs |
| 13.3 Frontend quick fixes | P1 | Small | — | Done |
| 13.4 Settings screen | P1 | Medium | 13.2 | FR1b, FR1d, FR2a |
| 13.5 Recommendation display | P1 | Medium | 13.2 | FR21-24 |
| 13.6 Sprint integrity | P2 | Medium | Nothing | Process |
| 13.7 Responsive layout | P2 | Medium | 13.2 | NFR19-20 |
| 13.8 Infrastructure | P3 | Large | Nothing | Deployment |
| 13.9 CRUD E2E | P1 | Medium | 13.1 + 13.2 | FR3-6 |
| 13.10 Inspection E2E | P1 | Large | 13.1 + 13.2 | FR19-30 |
| 13.11 Planning E2E | P1 | Medium | 13.1 + 13.2 | FR13-16 |
| 13.12 Profile/Export E2E | P2 | Medium | 13.1 + 13.2 + 13.4 | FR1b, FR32-33 |
| 13.13 Notifications E2E | P3 | Medium | 13.1 + 13.2 | FR39-49 |
| 13.14 AI Features E2E | P3 | Large | 13.1 + Vertex AI | FR34-38, FR56-58 |
