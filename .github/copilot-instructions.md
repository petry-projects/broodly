# Broodly — GitHub Copilot Instructions

> **Org standards apply.** See [AGENTS.md](../AGENTS.md) for shared standards (TDD, SOLID, DDD, CLEAN, security, CI requirements). The sections below are repo-specific additions and overrides.

---

## About

Broodly is a field-first beekeeping decision-support app (Expo + React Native mobile client, Go GraphQL API) that guides beekeepers through zero-tap hive inspections via voice-driven workflows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile/Web | Expo 55 + React Native 0.83 + TypeScript 5.9 |
| Design System | Gluestack UI v3 + NativeWind 4 + Tailwind CSS 3.3 |
| Routing | Expo Router (file-based) |
| Server State | TanStack React Query (persistent cache) |
| UI State | Zustand |
| GraphQL Client | urql or Apollo Client |
| Backend | Go 1.24 (toolchain 1.26.2) — chi v5 + gqlgen |
| Database | PostgreSQL 16 + pgvector |
| Auth | Firebase Authentication (Google + Apple Sign-In only) |
| AI/ML | Vertex AI (Embedding 2.0, Gemini) |
| Hosting | Google Cloud Platform (Cloud Run) |
| IaC | Terraform |
| Monorepo | pnpm 9 workspaces (`apps/*`, `packages/*`) |
| Linting (TS) | ESLint 10 + `@typescript-eslint` |
| Linting (Go) | golangci-lint v2.11+ |
| Formatting | Prettier 3 |
| Testing (TS) | Jest + jest-expo + `@testing-library/react-native` |
| Testing (Go) | `go test` with `-race` flag |

---

## Project Structure

```
broodly/
├── .github/                    # CI workflows, Copilot instructions
├── apps/
│   ├── mobile/                 # Expo app (iOS, Android, Web)
│   │   ├── app/                # Expo Router screens (file-based routing)
│   │   ├── src/features/       # Feature modules (inspection, recommendations, planning)
│   │   ├── src/services/       # GraphQL client, media upload
│   │   ├── src/store/          # Zustand stores, TanStack Query cache
│   │   └── src/platform/       # Platform-aware components (.ios.ts/.android.ts/.web.ts)
│   └── api/                    # Go GraphQL API (chi + gqlgen)
│       ├── cmd/server/         # main.go entry point
│       ├── graph/schema/       # GraphQL schema files (.graphql)
│       ├── internal/domain/    # Domain types and business logic (zero infra imports)
│       ├── internal/service/   # Application services (orchestrate domain)
│       └── internal/repository/# sqlc-generated persistence layer
├── packages/
│   ├── ui/                     # Shared UI component library (Gluestack + NativeWind)
│   ├── graphql-types/          # Generated TypeScript types from schema
│   ├── domain-types/           # Shared constants and domain types
│   └── config/                 # Shared NativeWind/Tailwind configuration
├── infra/terraform/            # GCP infrastructure (Cloud Run, Artifact Registry, etc.)
├── tests/
│   ├── e2e/                    # End-to-end tests
│   └── integration/            # Integration tests
└── _bmad-output/planning-artifacts/  # PRD, UX spec, architecture docs
```

**Naming conventions:**
- Components: `PascalCase` files, `ComponentName/index.tsx` structure
- Go packages: `snake_case` directories, standard Go naming
- Shared UI components: exported from `packages/ui/src/index.ts`
- Feature components: `apps/mobile/src/features/<feature>/components/`

---

## Local Dev Commands

### Prerequisites

```bash
# Install pnpm (if not already installed)
npm install -g pnpm@9

# Install Go 1.24+ with toolchain 1.26.2
# https://go.dev/dl/

# Install dependencies (run from repo root)
pnpm install --frozen-lockfile
```

### TypeScript / Mobile

```bash
# Start Expo dev server (iOS/Android/Web)
pnpm --filter mobile run start
pnpm --filter mobile run ios      # iOS simulator
pnpm --filter mobile run android  # Android emulator
pnpm --filter mobile run web      # Web browser

# Lint all TypeScript packages
pnpm run lint

# Type-check all TypeScript packages
pnpm run typecheck

# Run all TypeScript tests
pnpm run test

# Format code (check)
pnpm run format:check

# Format code (apply)
pnpm run format
```

### Go API

```bash
# Run from apps/api/
cd apps/api

# Vet
go vet ./...

# Lint (requires golangci-lint v2.11+)
golangci-lint run

# Test with race detector
go test ./... -race

# Test with coverage
go test ./... -race -coverprofile=coverage.out

# Run API server locally
go run ./cmd/server
```

### Code Generation

```bash
# Regenerate GraphQL resolvers (from apps/api/)
cd apps/api && go generate ./...

# Regenerate sqlc queries (from apps/api/)
cd apps/api && sqlc generate
```

### Repo Lint (pre-commit gate)

```bash
# Run the repo-specific lint checks (shellcheck + agent profile validation)
bash ".dev-lead/scripts/dev-lead-lint.sh"
```

---

## Required Environment Variables

> Do not commit real values. Use `.env.local` (mobile) or environment-specific config (API).

### API (`apps/api`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgres://user:pass@localhost:5432/broodly`) |
| `FIREBASE_PROJECT_ID` | Firebase project identifier for auth token verification |
| `GCP_PROJECT_ID` | GCP project ID (e.g. `broodly-491920`) |

### CI (GitHub Secrets)

| Secret | Description |
|---|---|
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full WIF provider resource name |
| `GCP_SERVICE_ACCOUNT` | Service account email for WIF |

---

## Testing Framework

### TypeScript

- **Runner:** Jest 29 with `jest-expo` preset
- **Library:** `@testing-library/react-native` 12
- **Location:** `__tests__/` adjacent to source, or `ComponentName.test.tsx` alongside component
- **Run:** `pnpm run test` (root) or `pnpm --filter <package> run test`
- **Coverage:** Not yet enforced in CI; aim for meaningful coverage on domain logic

### Go

- **Runner:** `go test` standard library
- **Flags:** `-race` required; `-coverprofile=coverage.out` in CI
- **Location:** `*_test.go` files adjacent to source (standard Go convention)
- **Run:** `go test ./... -race` from `apps/api/`

---

## Repo-Specific Overrides

- **Zero-tap field UX:** All inspection flows are voice-driven; tapping is a fallback only. Do not add mandatory tap interactions to inspection screens.
- **Gluestack compound components:** Always use full compound patterns (`<Button><ButtonText>…</ButtonText></Button>`). Never use shorthand alternatives.
- **Color tokens only:** Never hardcode hex colors. Use NativeWind design tokens (`bg-primary-500`, `text-error-600`, etc.).
- **Minimum touch target:** 48×48px for all interactive elements (gloved field use); voice mic button 56×56px.
- **sqlc for all DB queries:** No hand-written SQL in Go. All queries in `.sql` files generated via sqlc.
- **Thin resolvers:** gqlgen resolvers delegate immediately to services; no business logic in resolvers.
- **Package boundaries are hard:** `packages/ui` must not import from `apps/mobile`; `apps/mobile` must not import from `apps/api`.
