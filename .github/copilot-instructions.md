# Broodly — Copilot Instructions

## About

Broodly is a field-first beekeeping decision-support app: a single Expo + React Native codebase (iOS, Android, web) backed by a Go GraphQL API on GCP.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile/Web | Expo + React Native + TypeScript |
| Design System | Gluestack UI v3 + NativeWind |
| Routing | Expo Router |
| Server State | TanStack React Query (persistent cache) |
| UI State | Zustand |
| GraphQL Client | urql or Apollo Client |
| Backend | Go 1.24 / toolchain 1.26.2 (chi + gqlgen) |
| Database | PostgreSQL 16 + pgvector |
| Auth | Firebase Authentication (Google + Apple Sign-In only) |
| AI/ML | Vertex AI (Gemini, Embedding 2.0) |
| Hosting | GCP Cloud Run |
| IaC | Terraform |
| Package Manager | pnpm (monorepo workspaces) |
| Linting | ESLint (TS/JS), golangci-lint (Go) |
| Formatting | Prettier (TS/JS/JSON/MD) |
| Testing | Jest (mobile/packages), `go test` (API) |

## Project Structure

```
broodly/
├── apps/
│   ├── mobile/          # Expo app — screens in app/, features in src/features/
│   └── api/             # Go GraphQL API — domain/, service/, repository/ under internal/
├── packages/
│   ├── ui/              # Shared Gluestack-based component library
│   ├── graphql-types/   # Generated TypeScript types (never hand-write these)
│   ├── domain-types/    # Shared constants and domain types
│   ├── config/          # Shared configuration
│   └── test-utils/      # Shared testing utilities
├── infra/terraform/     # GCP infrastructure as code
├── tests/               # Integration and e2e tests
└── docs/                # ADRs, architecture docs, runbooks
```

Key conventions:
- Shared UI components → `packages/ui/src/`, exported from `packages/ui/src/index.ts`
- Feature components → `apps/mobile/src/features/<feature>/components/`
- Screen files → `apps/mobile/app/` (Expo Router file-based routing)
- Package boundaries are hard: `packages/ui` must not import from `apps/mobile`

## Local Dev Commands

```bash
# Install all dependencies (run from repo root)
pnpm install

# --- Mobile app (Expo) ---
pnpm --filter mobile start          # Start Expo dev server
pnpm --filter mobile start -- --ios      # Open on iOS simulator
pnpm --filter mobile start -- --android  # Open on Android emulator
pnpm --filter mobile test           # Run Jest tests (mobile)
pnpm --filter mobile lint           # ESLint (mobile)
pnpm --filter mobile typecheck      # TypeScript check (mobile)

# --- API server (Go) ---
cd apps/api
go run cmd/server/main.go                        # Start API server
go test ./... -race -coverprofile=coverage.out   # Run all Go tests (matches CI)
go vet ./...                                     # Go static analysis
golangci-lint run ./...                          # Lint (matches CI; install: https://golangci-lint.run/welcome/install/)

# --- Monorepo-wide (run from repo root) ---
cd ../..
pnpm test                           # Run all JS/TS tests across all packages
pnpm lint                           # ESLint across all packages
pnpm typecheck                      # TypeScript check across all packages
pnpm format                         # Prettier format all files
pnpm format:check                   # Prettier check (CI-safe, no writes)

# --- Code generation (run from apps/api) ---
cd apps/api
go run github.com/99designs/gqlgen generate   # Regenerate gqlgen resolvers
sqlc generate                                  # Regenerate sqlc queries
```

## Required Environment Variables

Key variables (copy into `apps/mobile/.env` and `apps/api/.env` respectively):

| Variable | Where used | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | mobile | GraphQL API base URL |
| `FIREBASE_PROJECT_ID` | mobile + api | Firebase project for auth |
| `DATABASE_URL` | api | PostgreSQL connection string |
| `GCP_PROJECT_ID` | api | GCP project for Vertex AI and Cloud Storage |

Never commit `.env` files. Use GCP Secret Manager in deployed environments.

## Testing Framework

- **Mobile / packages:** Jest with `@testing-library/react-native`. Tests co-located as `ComponentName/ComponentName.test.tsx`. Run with `pnpm --filter mobile test`.
- **API:** `go test ./... -race -coverprofile=coverage.out` (matches CI). Integration tests require a running PostgreSQL instance (see README or ask in #dev for local DB setup steps).
- **E2E:** Maestro flows planned under `tests/e2e/` — not yet wired into CI (deferred until 3+ screens exist).
- TDD is required: write failing tests before implementation. No `.skip()`, no coverage-ignore comments.

## Repo-Specific Overrides

- Use Gluestack UI v3 compound component patterns exclusively — never build custom primitives when a Gluestack component exists.
- Never hardcode hex colors; use Gluestack design tokens (`bg-primary-500`, `text-error-600`, etc.).
- Minimum touch target is 48×48 px (gloved field use); primary inspection actions are 56×48 px.
- All server data fetching goes through TanStack Query. Mutations must invalidate relevant queries on success.
- GraphQL types come from `packages/graphql-types/` — never hand-write response types.
- The zero-tap beeyard inspection flow is the core differentiator: voice-driven, no taps required in the field.
