# Copilot Instructions — broodly

> **Note:** This file applies to the `petry-projects/broodly` repository only. Org-wide rules are in [`petry-projects/.github/copilot-instructions.md`](https://github.com/petry-projects/.github/blob/main/.github/copilot-instructions.md). This file covers only what is specific to broodly.

## About

Broodly is a field-first beekeeping decision-support app — a pnpm monorepo with an Expo React Native mobile frontend and a Go backend, helping beekeepers make data-driven hive management decisions.

## Tech Stack

- **Runtime:** Node.js ≥ 20 (mobile/packages) · Go 1.24 / toolchain go1.26.2 (API)
- **Framework:** Expo SDK 55 · React Native 0.83 · React 19 · Gluestack UI v3 · NativeWind v4
- **Testing:** Jest with jest-expo preset (mobile) · React Testing Library for Native · `go test ./...` (API)
- **Linting:** ESLint ^10 + Prettier ^3 (root workspace) · `golangci-lint` (Go)
- **Key libraries:** `@gluestack-ui/core` ^3, `nativewind` ^4, `react-native-reanimated` ^4, `go-chi/chi` v5, TypeScript ~5.9.3

## Project Structure

```text
apps/
  mobile/              # Expo React Native app (Expo SDK 55, jest-expo)
  api/                 # Go backend (go.mod: github.com/broodly/api, chi router)
packages/
  config/              # Shared ESLint / TypeScript config
  domain-types/        # Shared TypeScript domain types
  graphql-types/       # @graphql-codegen generated types (never edit directly)
  test-utils/          # Shared test helpers
  ui/                  # Shared Gluestack UI components
```

## Local Dev Commands

- Install:    `pnpm install`
- Test (all): `pnpm test`
- Lint (all): `pnpm lint`
- Typecheck:  `pnpm typecheck`
- Mobile dev: `pnpm --filter mobile start`
- API dev:    `cd apps/api && go run ./cmd/...`

## Required Environment Variables

- `FIREBASE_PROJECT_ID`: GCP Firebase project ID
- `FIREBASE_API_KEY`: Firebase web API key
- `CLOUD_SQL_URL`: PostgreSQL connection string (Cloud SQL proxy for local dev)

## Testing Framework

- Mobile runner: Jest with jest-expo preset; React Testing Library (`@testing-library/react-native`)
- API runner: `go test ./...` with `golangci-lint run`
- Coverage thresholds: defined per-package (see each `jest.config.js`)
- Mutation testing: not configured

## Repo-Specific Overrides

**pnpm workspace** — always run commands from the monorepo root using `pnpm -r` or `pnpm --filter <package>`. Do not `cd` into packages and run `npm` directly.

**Cross-package imports** — use workspace package names (`@broodly/domain-types`, `@broodly/ui`) declared in `package.json` workspaces; never use relative paths across package boundaries.

**Go module** — the API module is `github.com/broodly/api` with toolchain pinned to go1.26.2 for crypto/tls security fixes; the `go` directive stays at 1.24.

## Org Standards

See [petry-projects/.github — AGENTS.md](https://github.com/petry-projects/.github/blob/main/AGENTS.md) for org-wide development standards.

**Language-specific instructions** (applied automatically by Copilot when you open matching file types):

- [TypeScript / TSX](.github/instructions/typescript.instructions.md) — strict config, branded types, DDD/CQRS patterns, React, pino logging
- [JavaScript](.github/instructions/javascript.instructions.md) — style, JSDoc type annotations, error handling
- [Go](.github/instructions/go.instructions.md) — naming, gofmt, slog logging, error wrapping, concurrency, testing
