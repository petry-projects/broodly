# Story 1.1: Initialize Expo App and Monorepo Structure

Status: ready-for-dev

## Story

As a developer,
I want the monorepo scaffolded with apps/mobile, apps/api, packages/ui, packages/graphql-types, packages/domain-types, packages/config, and infra/terraform directories,
so that all teams work from a single, consistent repository layout from day one.

## Acceptance Criteria (BDD)

1. GIVEN a clean repository WHEN I run `pnpm install` at the monorepo root THEN all workspace dependencies resolve without errors and each package is linked correctly.
2. GIVEN the `apps/mobile/` directory WHEN I run `npx expo doctor` THEN the Expo SDK 55 app reports no configuration errors.
3. GIVEN the `apps/api/` directory WHEN I run `go build ./...` THEN the Go module compiles successfully with Go 1.24.
4. GIVEN any package in `packages/` WHEN I import it by its workspace name from another workspace THEN the import resolves correctly in a trivial test file.
5. GIVEN the `infra/terraform/` directory WHEN I inspect the contents THEN a placeholder `main.tf` exists with a comment header.
6. GIVEN the monorepo root WHEN I inspect `pnpm-workspace.yaml` THEN it lists `apps/*` and `packages/*` as workspace globs.
7. GIVEN the monorepo root WHEN I inspect `README.md` THEN it contains setup instructions including prerequisites, install, and run commands.

## Tasks / Subtasks

- [ ] Initialize pnpm workspace at monorepo root (AC: #1, #6)
  - [ ] Create `pnpm-workspace.yaml` with `apps/*` and `packages/*` entries
  - [ ] Create root `package.json` with `"private": true`, workspace scripts, and engine constraints (`node >= 20`, `pnpm >= 9`)
  - [ ] Create root `.npmrc` with `shamefully-hoist=true` (required for Expo/React Native compatibility)
  - [ ] Create root `tsconfig.base.json` with shared TypeScript compiler options (strict mode, path aliases)
- [ ] Scaffold `apps/mobile/` via Expo (AC: #2)
  - [ ] Run `npx create-expo-app@latest broodly --template` inside `apps/mobile/`
  - [ ] Verify Expo SDK 55.0.6, React Native 0.84.1, TypeScript 5.9.3 versions in `package.json`
  - [ ] Configure `apps/mobile/tsconfig.json` to extend root `tsconfig.base.json`
  - [ ] Verify `npx expo doctor` passes
  - [ ] Add web target: ensure `expo-router` and `react-native-web@0.19.x` are present
- [ ] Scaffold `apps/api/` as Go module (AC: #3)
  - [ ] Run `go mod init github.com/broodly/api` (or appropriate module path)
  - [ ] Set Go version to 1.24 in `go.mod`
  - [ ] Create `cmd/server/main.go` with a minimal "hello world" HTTP handler using `chi` v5
  - [ ] Create `cmd/worker/main.go` with a placeholder main function
  - [ ] Create directory stubs: `graph/schema/`, `graph/model/`, `graph/resolver/`, `internal/domain/`, `internal/service/`, `internal/adapter/`, `internal/ai/`, `internal/voice/`, `internal/event/`, `internal/repository/`, `internal/auth/`, `internal/middleware/`, `migrations/`
  - [ ] Create `Dockerfile` targeting distroless base image (`gcr.io/distroless/static-debian12`)
  - [ ] Create `Dockerfile.worker` targeting distroless base image
  - [ ] Add `sqlc.yaml` placeholder config
  - [ ] Add `gqlgen.yml` placeholder config
- [ ] Create `packages/ui/` (AC: #4)
  - [ ] Create `package.json` with name `@broodly/ui`
  - [ ] Create `src/index.ts` with stub export (`export {}`)
  - [ ] Create `tsconfig.json` extending root base
- [ ] Create `packages/graphql-types/` (AC: #4)
  - [ ] Create `package.json` with name `@broodly/graphql-types`
  - [ ] Create `src/index.ts` with stub export
  - [ ] Create `tsconfig.json` extending root base
- [ ] Create `packages/domain-types/` (AC: #4)
  - [ ] Create `package.json` with name `@broodly/domain-types`
  - [ ] Create `src/index.ts` with stub export
  - [ ] Create `tsconfig.json` extending root base
- [ ] Create `packages/config/` (AC: #4)
  - [ ] Create `package.json` with name `@broodly/config`
  - [ ] Create `src/index.ts` with stub export
  - [ ] Create `tsconfig.json` extending root base
- [ ] Create `packages/test-utils/` (AC: #4)
  - [ ] Create `package.json` with name `@broodly/test-utils`
  - [ ] Create `src/index.ts` with stub export
- [ ] Create `infra/terraform/` structure (AC: #5)
  - [ ] Create `infra/terraform/main.tf` with header comment and empty `terraform {}` block
  - [ ] Create directory stubs: `modules/cloud-run/`, `modules/cloud-sql/`, `modules/pubsub/`, `modules/storage/`, `modules/vertex-ai/`, `modules/firebase/`
  - [ ] Create directory stubs: `environments/dev/`, `environments/staging/`, `environments/prod/`
  - [ ] Create `infra/monitoring/dashboards/` and `infra/monitoring/alerts/` directory stubs
- [ ] Create supporting directories (AC: #1)
  - [ ] Create `tests/integration/` and `tests/e2e/` directory stubs with `.gitkeep`
  - [ ] Create `docs/architecture/`, `docs/adr/`, `docs/api/`, `docs/runbooks/` directory stubs with `.gitkeep`
- [ ] Create root `README.md` (AC: #7)
  - [ ] Document prerequisites: Node.js 20+, pnpm 9+, Go 1.24+, Expo CLI, Terraform
  - [ ] Document install: `pnpm install`
  - [ ] Document run commands: `pnpm --filter mobile start`, `cd apps/api && go run cmd/server/main.go`
  - [ ] Document monorepo structure overview
- [ ] Create root configuration files (AC: #1)
  - [ ] `.gitignore` covering Node, Go, Expo, Terraform, and IDE files
  - [ ] `.editorconfig` with consistent formatting rules (2-space indent for TS/JSON, tabs for Go)
  - [ ] `prettier.config.js` for TypeScript formatting
  - [ ] `.eslintrc.js` or `eslint.config.js` root config

## Dev Notes

### Architecture Compliance
- Follow the exact directory structure defined in architecture.md section "Complete Project Directory Structure"
- Monorepo uses `apps/` for deployable applications and `packages/` for shared libraries
- `apps/mobile/` is a single Expo codebase targeting iOS, Android, and web via React Native for Web
- `apps/api/` is Go with chi v5 for HTTP routing and gqlgen for GraphQL
- Unit tests are co-located with source files; integration/e2e tests go in top-level `tests/`
- Files use kebab-case naming; components/classes use PascalCase; functions/variables use camelCase

### TDD Requirements (Tests First!)
- Test 1: **Workspace resolution test** — Create a trivial test in `apps/mobile/` that imports `@broodly/domain-types` and `@broodly/config` by workspace name. The import must resolve. Run with `pnpm --filter mobile test`.
- Test 2: **Expo doctor check** — Run `npx expo doctor` in `apps/mobile/` and assert exit code 0. This validates Expo SDK configuration integrity.
- Test 3: **Go module build** — Run `go build ./...` in `apps/api/` and assert exit code 0. This validates the Go module initializes cleanly.
- Test 4: **Package stub exports** — For each package in `packages/`, create a test that imports `index.ts` and asserts the module loads without error.

### Technical Specifications
- **Node.js:** >= 20.x (LTS)
- **pnpm:** >= 9.x (workspace support required)
- **Expo SDK:** 55.0.6
- **create-expo-app:** 3.5.3
- **React Native:** 0.84.1
- **React Native Web:** 0.19.x
- **TypeScript:** 5.9.3
- **Go:** 1.24
- **chi:** v5.x (`github.com/go-chi/chi/v5`)
- **Initialization command:** `npx create-expo-app@latest broodly --template`
- **Dockerfile base:** `gcr.io/distroless/static-debian12`

### Anti-Patterns to Avoid
- DO NOT use npm or yarn — this project uses pnpm workspaces exclusively
- DO NOT use `expo init` (deprecated) — use `npx create-expo-app@latest`
- DO NOT use Expo bare workflow — this project uses Expo managed workflow
- DO NOT install dependencies globally — all deps are workspace-local or root dev deps
- DO NOT create a `src/` directory at monorepo root — code lives in `apps/` and `packages/`
- DO NOT put shared types in `apps/mobile/` — they belong in `packages/domain-types/` or `packages/graphql-types/`
- DO NOT hardcode module paths — use pnpm workspace protocol (`workspace:*`) for inter-package deps
- DO NOT skip `shamefully-hoist=true` in `.npmrc` — React Native requires it for dependency resolution
- DO NOT use Go workspaces (`go.work`) for now — the Go module is standalone in `apps/api/`

### Project Structure Notes
- Root: `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `.npmrc`, `.gitignore`, `.editorconfig`, `prettier.config.js`, `README.md`
- `apps/mobile/` — Expo app created via `create-expo-app`
- `apps/api/` — Go module with `cmd/`, `graph/`, `internal/`, `migrations/`
- `packages/ui/` — Shared UI components (Gluestack-based, configured in Story 1.3)
- `packages/graphql-types/` — Auto-generated TypeScript types from GraphQL schema
- `packages/domain-types/` — Shared constants, enums, and domain type definitions
- `packages/config/` — Shared configuration schemas
- `packages/test-utils/` — Shared testing utilities
- `infra/terraform/` — Terraform modules and environment configs
- `tests/` — Integration and e2e test suites
- `docs/` — Architecture docs, ADRs, API docs, runbooks

### References
- [Source: architecture.md#Complete Project Directory Structure]
- [Source: architecture.md#Starter Template Evaluation — Initialization Command]
- [Source: architecture.md#Verified Current Versions]
- [Source: architecture.md#Implementation Patterns & Consistency Rules — Structure Patterns]
- [Source: CLAUDE.md#Component Organization — Directory Structure]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
