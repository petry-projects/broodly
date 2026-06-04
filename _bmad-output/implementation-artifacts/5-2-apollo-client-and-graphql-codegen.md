# Story 5.2: GraphQL Client (urql) and TanStack Query Integration

Status: done

## Story

As a developer,
I want urql configured as the GraphQL client with TanStack React Query for cache-first persistent reads and GraphQL Code Generator for type-safe operations,
so that all screens share a single, persistent, type-safe data fetching layer with offline-tolerant caching.

## Acceptance Criteria (BDD)

1. GIVEN the GraphQL client is initialized WHEN a query is executed THEN the request includes a valid Firebase ID token in the `Authorization: Bearer <token>` header.
2. GIVEN a query has been fetched previously WHEN the same query is requested again THEN TanStack Query returns the cached result immediately and revalidates in the background (stale-while-revalidate).
3. GIVEN TanStack Query persistent cache is configured WHEN the app restarts THEN previously cached query results are available before any network request completes.
4. GIVEN the device loses network connectivity WHEN a cached query is requested THEN the cached data is returned with a stale indicator (dataUpdatedAt is in the past).
5. GIVEN a request fails with a 401 (token expired) WHEN the auth exchange detects the error THEN it refreshes the Firebase ID token and retries the failed request automatically.
6. GIVEN any GraphQL operation WHEN it encounters an unrecoverable error THEN the error boundary catches it and renders a user-friendly error state.
7. GIVEN a `.graphql` operation file WHEN GraphQL Code Generator runs THEN typed TypeScript hooks and types are generated in `packages/graphql-types/`.

## Tasks / Subtasks

- [ ] Write GraphQL client integration tests before implementation (AC: #1, #4, #5)
  - [ ] Test: urql client attaches `Authorization: Bearer <token>` header via auth exchange
  - [ ] Test: on 401 response, auth exchange calls Firebase `getIdToken(true)` and retries
  - [ ] Test: network error returns cached data without throwing
- [ ] Write TanStack Query persistence tests (AC: #2, #3)
  - [ ] Test: query result is served from cache on second request (cache hit)
  - [ ] Test: persistent cache restores data after simulated app restart
  - [ ] Test: stale-while-revalidate triggers background refetch while returning cached data
- [ ] Write error boundary tests (AC: #6)
  - [ ] Test: GraphQL error renders error boundary fallback UI
  - [ ] Test: error boundary provides retry action
- [ ] Install and configure urql (AC: #1, #5)
  - [ ] Install `urql`, `@urql/exchange-auth`, `@urql/exchange-retry`, `graphql`
  - [ ] Create `apps/mobile/src/services/graphql/client.ts` — urql client factory
  - [ ] Configure `authExchange` to inject Firebase ID token from auth store
  - [ ] Configure `retryExchange` for transient network failures
  - [ ] Configure `fetchExchange` pointing to Cloud Run API URL (env-configurable)
- [ ] Install and configure TanStack React Query with persistence (AC: #2, #3)
  - [ ] Install `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `react-native-mmkv`
  - [ ] Create `apps/mobile/src/services/query/query-client.ts` — QueryClient factory
  - [ ] Configure default `staleTime`, `gcTime`, and `retry` policies
  - [ ] Create MMKV-based persister for `persistQueryClient`
  - [ ] Set `staleTime: 5 * 60 * 1000` (5 min) default, `gcTime: 24 * 60 * 60 * 1000` (24h)
- [ ] Create QueryClient provider in root layout (AC: #2, #3)
  - [ ] Wrap app with `PersistQueryClientProvider` in `apps/mobile/app/_layout.tsx`
  - [ ] Wrap app with urql `Provider` inside the QueryClient provider
- [ ] Configure GraphQL Code Generator (AC: #7)
  - [ ] Install `@graphql-codegen/cli`, `@graphql-codegen/typescript`, `@graphql-codegen/typescript-operations`, `@graphql-codegen/typescript-urql`
  - [ ] Create `codegen.ts` config at monorepo root or `packages/graphql-types/`
  - [ ] Point codegen at `apps/api/graph/schema/*.graphql` schema source
  - [ ] Output generated types to `packages/graphql-types/src/generated/`
  - [ ] Add `codegen` script to `package.json`
- [ ] Create custom query hooks pattern (AC: #2, #4)
  - [ ] Create `apps/mobile/src/services/query/use-graphql-query.ts` — wrapper combining urql + TanStack Query
  - [ ] Pattern: urql executes the GraphQL operation; TanStack Query manages caching/persistence
  - [ ] Expose `dataUpdatedAt` for staleness calculation (used in Story 5.5)
- [ ] Create GraphQL error boundary component (AC: #6)
  - [ ] Create `apps/mobile/src/services/graphql/graphql-error-boundary.tsx`
  - [ ] Use Gluestack `Alert` with `action="error"` for error display
  - [ ] Include retry button
- [ ] Create a smoke-test query (AC: #1, #2)
  - [ ] Create a simple `health` or `ping` query stub
  - [ ] Verify end-to-end: codegen -> typed hook -> urql fetch -> TanStack cache

## Dev Notes

### Architecture Compliance
- Architecture specifies `urql` or `@apollo/client` — this story uses **urql** per the tech notes in epics.md ("Use urql with @urql/exchange-auth")
- TanStack React Query with persistent cache is the primary caching layer per architecture.md
- Cache-first reads with stale-while-revalidate is the MVP connectivity model
- GraphQL Code Generator produces TypeScript types from the Go gqlgen schema
- All mutations require connectivity (no offline mutation queue in MVP)
- Server state in TanStack Query; UI state in Zustand (Story 5.3)

### TDD Requirements (Tests First!)
- Test 1: **Auth header injection** — Mock Firebase auth, create urql client, execute a query, assert the outgoing request has `Authorization: Bearer <mock-token>`.
- Test 2: **Token refresh on 401** — Mock a 401 response, assert `getIdToken(true)` is called, then the request is retried with the new token.
- Test 3: **Cache-first read** — Fetch a query, assert result cached. Fetch again, assert cache hit (no additional network request). Assert background revalidation triggered.
- Test 4: **Persistence across restart** — Populate TanStack cache, create a new QueryClient with the same persister, assert the cached data is restored.
- Test 5: **Offline graceful degradation** — Simulate offline, request a previously cached query, assert data returned without error.
- Test 6: **Error boundary** — Render a component that throws a GraphQL error inside the error boundary, assert fallback UI renders.

### Technical Specifications
- **urql:** latest stable with `authExchange`, `retryExchange`, `fetchExchange`
- **TanStack React Query:** v5.x with `persistQueryClient`
- **Persistence backend:** `react-native-mmkv` (fast synchronous key-value for RN)
- **GraphQL endpoint:** configurable via env var `EXPO_PUBLIC_API_URL`
- **Default cache policies:**
  - `staleTime`: 5 minutes (data considered fresh)
  - `gcTime`: 24 hours (cached data retained)
  - `retry`: 3 attempts with exponential backoff for network errors
- **Auth token source:** Firebase `auth().currentUser.getIdToken()` via Zustand auth store
- **Generated types output:** `packages/graphql-types/src/generated/`

### Anti-Patterns to Avoid
- DO NOT use urql's built-in cache (`cacheExchange`) as the primary cache — TanStack Query manages caching; urql handles transport
- DO NOT store sensitive tokens in MMKV persistent cache — only query response data
- DO NOT hardcode the GraphQL API URL — use `EXPO_PUBLIC_API_URL` environment variable
- DO NOT import Firebase directly in the GraphQL client — access the token via the Zustand auth store interface
- DO NOT create per-screen QueryClient instances — one singleton shared across the app
- DO NOT skip error boundaries — every screen with GraphQL data must be wrapped
- DO NOT use `@apollo/client` alongside urql — pick one (urql is selected)

### Project Structure Notes
- GraphQL client: `apps/mobile/src/services/graphql/client.ts`
- Query client: `apps/mobile/src/services/query/query-client.ts`
- Custom hooks: `apps/mobile/src/services/query/use-graphql-query.ts`
- Error boundary: `apps/mobile/src/services/graphql/graphql-error-boundary.tsx`
- Codegen config: `packages/graphql-types/codegen.ts`
- Generated types: `packages/graphql-types/src/generated/`
- Tests co-located with source files

### References
- [Source: architecture.md#Frontend Architecture — urql or @apollo/client with TanStack Query integration]
- [Source: architecture.md#Data Architecture — @tanstack/react-query persistent cache for client-side cache-first reads]
- [Source: architecture.md#API & Communication Patterns — TypeScript client types generated via @graphql-codegen/cli]
- [Source: architecture.md#MVP Connectivity & Caching Strategy]
- [Source: CLAUDE.md#Tech Stack Quick Reference — urql or Apollo Client, TanStack React Query]
- [Source: epics.md#Story 5.2 — urql with @urql/exchange-auth, TanStack Query persistQueryClient with MMKV]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Installed urql, @urql/exchange-auth, @urql/exchange-retry, graphql
- Installed @tanstack/react-query, @tanstack/react-query-persist-client, @tanstack/query-sync-storage-persister, react-native-mmkv
- Installed @graphql-codegen/typescript-operations, @graphql-codegen/typescript-urql
- Created urql client factory with authExchange (Firebase ID token from auth store), retryExchange (3 attempts), fetchExchange
- API URL configurable via EXPO_PUBLIC_API_URL env var
- Created TanStack QueryClient factory: staleTime 5min, gcTime 24h, retry 3, no refetchOnWindowFocus
- Created MMKV-backed sync persister for offline-first cache
- Created useGraphQLQuery hook combining urql transport with TanStack Query caching
- Created GraphQLErrorBoundary with retry action and custom fallback support
- Wired all providers into root layout: SafeArea → Gluestack → PersistQueryClient → Urql → ErrorBoundary → Slot
- Updated codegen.ts to generate urql operation hooks (typescript-operations + typescript-urql)
- Added __mocks__/react-native-mmkv.js for native module mock in Jest
- 19 new tests: client creation, auth store integration, query client config, error boundary rendering/retry

### File List
- apps/mobile/src/services/graphql/client.ts — urql client factory
- apps/mobile/src/services/graphql/client.test.ts — Client tests (5 tests)
- apps/mobile/src/services/graphql/graphql-error-boundary.tsx — Error boundary component
- apps/mobile/src/services/graphql/graphql-error-boundary.test.tsx — Error boundary tests (5 tests)
- apps/mobile/src/services/query/query-client.ts — TanStack QueryClient + MMKV persister
- apps/mobile/src/services/query/query-client.test.ts — QueryClient config tests (8 tests)
- apps/mobile/src/services/query/use-graphql-query.ts — Combined urql+TanStack Query hook
- apps/mobile/app/_layout.tsx — Updated root layout with providers
- apps/mobile/__mocks__/react-native-mmkv.js — MMKV native module mock
- packages/graphql-types/codegen.ts — Updated with operations codegen
