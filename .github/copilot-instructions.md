# Broodly — Copilot Instructions

## About

Broodly is a field-first beekeeping decision-support app with a zero-tap inspection experience, built as an Expo + React Native monorepo with a Go GraphQL backend on GCP.

## Tech Stack

**Mobile / Web**
- Runtime: Node.js ≥ 20, managed with pnpm ≥ 9
- Framework: Expo 55 + React Native 0.83 + TypeScript 5.9 (strict)
- Design system: Gluestack UI v3 + NativeWind (Tailwind CSS via NativeWind)
- Routing: Expo Router
- Server state: TanStack React Query (persistent cache)
- UI state: Zustand with immer middleware
- GraphQL client: urql or Apollo Client
- Testing: Jest (preset: jest-expo)
- Linting: ESLint (typescript-eslint), Prettier
- Type checking: `tsc --noEmit`

**API**
- Language: Go 1.24 (toolchain go1.26.2)
- Router: chi v5
- GraphQL: gqlgen
- Database: PostgreSQL 16 + pgvector via sqlc
- Linting: golangci-lint v2

**Infrastructure**
- Auth: Firebase Authentication (Google + Apple Sign-In only, no passwords)
- AI/ML: Vertex AI (Embedding 2.0, Gemini)
- Hosting: Google Cloud Platform (Cloud Run)
- IaC: Terraform

## Project Structure

```
broodly/
├── apps/
│   ├── mobile/          # Expo app (iOS, Android, Web)
│   │   ├── app/         # Expo Router screens (file-based routing)
│   │   ├── src/features/# Feature modules (inspection, recommendations, planning)
│   │   ├── src/services/# GraphQL client, media upload
│   │   ├── src/store/   # Zustand stores, TanStack Query cache
│   │   └── src/platform/# Platform-aware components (.ios.ts/.android.ts/.web.ts)
│   └── api/             # Go GraphQL API (chi + gqlgen)
│       ├── graph/schema/# GraphQL schema files (.graphql)
│       ├── internal/domain/    # Domain types and business logic (no infra imports)
│       ├── internal/service/   # Application services
│       └── internal/repository/# sqlc queries
├── packages/
│   ├── ui/              # Shared UI component library (export via index.ts)
│   ├── graphql-types/   # Generated TypeScript types — never hand-write these
│   ├── domain-types/    # Shared constants
│   └── config/          # Shared configuration
├── infra/terraform/     # GCP IaC
└── _bmad-output/planning-artifacts/  # PRD, UX spec, architecture docs
```

Package boundaries are hard: `packages/ui` must not import from `apps/mobile`; `apps/mobile` must not import from `apps/api`.

## Local Dev Commands

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run lint (all workspaces)
pnpm lint

# Type check (all workspaces)
pnpm typecheck

# Format all files
pnpm format

# Check formatting without writing
pnpm format:check

# Mobile — start dev server
cd apps/mobile && pnpm start

# API — test with race detector
cd apps/api && go test ./... -race

# API — lint
cd apps/api && golangci-lint run

# API — vet
cd apps/api && go vet ./...
```

## Required Environment Variables

| Variable | Description |
|---|---|
| `GCP_PROJECT_ID` | GCP project ID (e.g. `broodly-491920`) |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full WIF provider resource name |
| `GCP_SERVICE_ACCOUNT` | Service account email for WIF |
| `FIREBASE_*` | Firebase project credentials for auth |

Never commit secrets — use environment variables or GCP Secret Manager.

## Testing Framework

- **Mobile/TypeScript:** Jest with `jest-expo` preset. Run: `pnpm test` from repo root or `cd apps/mobile && pnpm test`.
- **API/Go:** `go test ./... -race -coverprofile=coverage.out` — race detector required.
- TDD is mandatory: write failing tests before implementation (red → green).
- No `.skip()`, no coverage-ignore comments, no suppressed failures.

## Repo-Specific Overrides

- **Gluestack compound components:** always use the full pattern (`<Button><ButtonText>…</ButtonText></Button>`), never standalone primitives.
- **Color tokens only:** never hardcode hex values — use `bg-primary-500`, `text-error-600`, etc.
- **Zero-tap inspection:** voice-driven field flow is the primary UX; tap is fallback only.
- **48px touch targets:** all interactive elements must meet gloved-field minimum.
- **Edit actions:** always use a pencil icon, never the word "Edit".
- **GraphQL types:** always use generated types from `packages/graphql-types/`, never hand-write them.
- **Path aliases:** use `@broodly/ui`, `@/features`, `@/services` — no deep relative paths or barrel files (except `packages/ui/src/index.ts`).

## Org Standards

See [AGENTS.md](../AGENTS.md) and [petry-projects/.github/AGENTS.md](https://github.com/petry-projects/.github/blob/main/AGENTS.md) for mandatory org-wide practices including TDD, SOLID/CLEAN/DRY, CI quality gates, multi-agent isolation, and security requirements.
