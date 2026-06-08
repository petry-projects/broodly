# Broodly — GitHub Copilot Instructions

## About

Broodly is a field-first beekeeping decision-support app built with Expo + React Native (mobile/web) and a Go GraphQL API backend on GCP, featuring zero-tap voice-driven inspection flows.

## Tech Stack

- **Runtime:** Node.js >= 20 (LTS) · Go 1.24 (toolchain go1.26.2)
- **Mobile/Web:** Expo 55 · React Native 0.83 · React 19 · TypeScript 5.9 (strict)
- **Design System:** Gluestack UI v3 · NativeWind · Tailwind CSS
- **Routing:** Expo Router (file-based)
- **API:** Go · chi v5 · gqlgen (GraphQL) · sqlc (typed SQL)
- **Database:** PostgreSQL 16 + pgvector
- **State:** Zustand (UI state) · TanStack Query (server state, persistent cache)
- **Auth:** Firebase Authentication (Google + Apple Sign-In only)
- **AI/ML:** Vertex AI (Gemini, Embedding 2.0)
- **Hosting:** GCP Cloud Run · Terraform >= 1.5 (IaC)
- **Package manager:** pnpm 9.x (workspace monorepo)
- **Testing (mobile):** Jest 29 · jest-expo · @testing-library/react-native
- **Testing (api):** `go test ./...`
- **Linting:** ESLint 10 (flat config) · Prettier 3 · golangci-lint
- **Key libraries:** react-native-reanimated · react-native-svg · urql/Apollo Client · immer · tva (Tailwind Variant Authority)

## Project Structure

```
broodly/
├── apps/
│   ├── mobile/                     # Expo app (iOS, Android, Web)
│   │   ├── app/                    # Expo Router screens (file-based routing)
│   │   ├── src/features/           # Feature modules (inspection, recommendations, planning)
│   │   ├── src/services/           # GraphQL client, media upload
│   │   ├── src/store/              # Zustand stores, TanStack Query cache
│   │   └── src/platform/           # Platform-aware components (.ios.ts / .android.ts)
│   └── api/                        # Go GraphQL API service
│       ├── graph/schema/           # GraphQL schema (.graphql)
│       ├── internal/domain/        # Domain types and business logic (no infra imports)
│       ├── internal/service/       # Application services
│       └── internal/repository/    # sqlc queries and persistence
├── packages/
│   ├── ui/                         # Shared UI component library → export via index.ts
│   ├── graphql-types/              # Generated TypeScript types (never hand-write)
│   ├── domain-types/               # Shared constants and domain types
│   └── config/                     # Shared configuration (NativeWind tokens)
├── infra/terraform/                # GCP resources
├── tests/
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
└── docs/                           # Architecture docs, ADRs, runbooks
```

## Local Dev Commands

```bash
# Install all dependencies
pnpm install

# Run mobile app (Expo)
pnpm --filter mobile start

# Run API server (Go)
cd apps/api && go run cmd/server/main.go

# Run all tests
pnpm test                           # mobile: jest via jest-expo
cd apps/api && go test ./...        # api: go test

# Lint
pnpm lint                           # ESLint across all TS/TSX packages
cd apps/api && golangci-lint run    # Go linting

# Type check
pnpm typecheck                      # tsc --noEmit across all packages

# Format
pnpm format                         # Prettier write
pnpm format:check                   # Prettier check (CI)

# Dev-lead lint (CI mirrors)
bash ".dev-lead/scripts/dev-lead-lint.sh"
```

## Testing Framework

- **Mobile:** Jest 29 with `jest-expo` preset · `@testing-library/react-native` for component tests
- **API:** `go test ./...` with standard Go table-driven tests
- **TDD required:** write failing tests before implementation — no `.skip()` or coverage-ignore comments
- **Integration tests:** `tests/integration/` — must use real dependencies, no mocks for DB/infra boundaries
- **E2E tests:** `tests/e2e/`

## Org Standards

This repo follows all [petry-projects org standards](https://github.com/petry-projects/.github/blob/main/AGENTS.md). Key rules:

- **No `any` types** — use `unknown` with type guards when needed
- **Package boundaries are hard** — `packages/ui` must not import from `apps/`; shared types go in `packages/domain-types` or `packages/graphql-types`
- **GraphQL types** — always use generated types from `packages/graphql-types/`, never hand-write
- **sqlc for all queries** — no hand-written SQL in Go; define in `.sql` files, generate via sqlc
- **Domain-first Go** — `internal/domain/` has zero infra imports; resolvers stay thin, delegate to services
- **Secrets** — never commit; use environment variables or GCP Secret Manager
- **BMAD Method** — spec-driven development; planning artifacts in `_bmad-output/planning-artifacts/` precede implementation
- **Zero-tap inspection** — Broodly's core UX: voice-driven field inspection with no required taps
