# Story 1.2: Configure CI Pipeline (Lint, Type-Check, Test Gates)

Status: ready-for-dev

## Story

As a developer,
I want GitHub Actions CI running lint, type-check, and test for both TypeScript and Go on every PR,
so that code quality is enforced automatically.

## Acceptance Criteria (BDD)

1. GIVEN a pull request is opened or updated WHEN the CI workflow triggers THEN both TypeScript and Go jobs run in parallel via matrix strategy.
2. GIVEN the TypeScript job WHEN it executes THEN it runs ESLint, `tsc --noEmit`, and Jest in sequence, failing the job on any error.
3. GIVEN the Go job WHEN it executes THEN it runs `go vet ./...`, `golangci-lint run`, and `go test ./...` in sequence, failing the job on any error.
4. GIVEN unapplied database migrations exist WHEN the migration guard step runs THEN the CI pipeline fails with a clear error message.
5. GIVEN the Go API source code WHEN the Docker build step runs THEN a container image is built targeting `gcr.io/distroless/static-debian12` base.
6. GIVEN the CI workflow completes WHEN a developer views the PR THEN required status checks must pass before merge is allowed.
7. GIVEN a deliberately introduced lint violation WHEN CI runs on that branch THEN the pipeline fails (negative test validation).

## Tasks / Subtasks

- [ ] Create GitHub Actions workflow file (AC: #1)
  - [ ] Create `.github/workflows/ci.yml`
  - [ ] Configure trigger: `on: pull_request` targeting `main` branch
  - [ ] Configure trigger: `on: push` to `main` branch
  - [ ] Use matrix strategy with two jobs: `typescript` and `go`
  - [ ] Set `concurrency` group to cancel stale runs on the same PR
- [ ] Configure TypeScript CI job (AC: #2)
  - [ ] Use `actions/checkout@v4`
  - [ ] Use `pnpm/action-setup@v4` with pnpm version matching project
  - [ ] Use `actions/setup-node@v4` with Node.js 20, pnpm cache
  - [ ] Run `pnpm install --frozen-lockfile`
  - [ ] Step: `pnpm run lint` (ESLint across all TS workspaces)
  - [ ] Step: `pnpm run typecheck` (runs `tsc --noEmit` across workspaces)
  - [ ] Step: `pnpm run test` (runs Jest across workspaces)
- [ ] Configure Go CI job (AC: #3)
  - [ ] Use `actions/checkout@v4`
  - [ ] Use `actions/setup-go@v5` with Go 1.24
  - [ ] Set working directory to `apps/api/`
  - [ ] Step: `go vet ./...`
  - [ ] Step: Install and run `golangci-lint` (use `golangci/golangci-lint-action@v6`)
  - [ ] Step: `go test ./... -race -coverprofile=coverage.out`
  - [ ] Step: Upload coverage artifact
- [ ] Configure migration guard step (AC: #4)
  - [ ] Add step in Go job after tests
  - [ ] Check that all migration files in `apps/api/migrations/` are sequential and have matching up/down pairs
  - [ ] Script: verify no pending migrations that lack corresponding test coverage
  - [ ] Fail with descriptive error if migration guard check fails
- [ ] Configure Docker build step (AC: #5)
  - [ ] Add step in Go job: `docker build -f apps/api/Dockerfile -t broodly-api:ci apps/api/`
  - [ ] Verify multi-stage build compiles Go binary and packages into distroless image
  - [ ] Do NOT push to registry in CI (push only on merge to main, handled separately)
- [ ] Add root package.json scripts (AC: #2)
  - [ ] `"lint": "pnpm -r run lint"` — runs lint in all workspaces
  - [ ] `"typecheck": "pnpm -r run typecheck"` — runs tsc --noEmit in all workspaces
  - [ ] `"test": "pnpm -r run test"` — runs tests in all workspaces
- [ ] Configure ESLint at root level (AC: #2)
  - [ ] Install `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-config-expo`
  - [ ] Create root `.eslintrc.js` or `eslint.config.js` with TypeScript + React Native rules
  - [ ] Each workspace `package.json` should have `"lint": "eslint . --ext .ts,.tsx"`
  - [ ] Each workspace `package.json` should have `"typecheck": "tsc --noEmit"`
- [ ] Configure Jest at workspace level (AC: #2)
  - [ ] `apps/mobile/jest.config.ts` configured for React Native with `jest-expo` preset
  - [ ] Each package in `packages/` gets a `jest.config.ts` with `ts-jest` preset
  - [ ] Each workspace `package.json` should have `"test": "jest"`
- [ ] Configure branch protection rules (AC: #6)
  - [ ] Document required status checks: `typescript` job and `go` job must pass
  - [ ] Document: require PR reviews before merge (recommend 1 reviewer)
  - [ ] Note: branch protection must be configured manually in GitHub repo settings
- [ ] Validate pipeline with negative test (AC: #7)
  - [ ] Create a test branch with a deliberate ESLint violation
  - [ ] Verify CI fails on the lint step
  - [ ] Remove violation and verify CI passes
  - [ ] Document this validation in completion notes

## Dev Notes

### Architecture Compliance
- CI/CD uses GitHub Actions monorepo pipeline per architecture.md
- Go checks: `go vet`, `golangci-lint`, `go test` — in this order
- TypeScript checks: ESLint, `tsc --noEmit`, Jest — in this order
- Migration guard blocks deployment on unapplied or conflicting migrations
- Docker images target Artifact Registry (`gcr.io/distroless/static-debian12` base)
- Matrix strategy runs TS and Go jobs in parallel for faster feedback

### TDD Requirements (Tests First!)
- Test 1: **Workflow YAML validation** — Install `actionlint` locally and run it against `.github/workflows/ci.yml`. Assert exit code 0 and no warnings.
- Test 2: **Negative lint test** — Create a branch with `const x: any = 1;` (assuming `no-explicit-any` rule). Push and verify CI fails on the ESLint step. This validates the lint gate works.
- Test 3: **Go vet validation** — Add a trivial Go test file in `apps/api/` (e.g., `main_test.go`) that runs `go vet` programmatically and asserts no issues.
- Test 4: **Migration guard script test** — Write a shell script test that creates a malformed migration pair (e.g., missing `.down.sql`) and asserts the guard script exits non-zero.

### Technical Specifications
- **GitHub Actions:** `actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-go@v5`, `pnpm/action-setup@v4`, `golangci/golangci-lint-action@v6`
- **Node.js version in CI:** 20
- **Go version in CI:** 1.24
- **pnpm version in CI:** match project root `packageManager` field
- **golangci-lint:** latest stable via `golangci-lint-action`
- **Jest preset for mobile:** `jest-expo`
- **Docker build context:** `apps/api/`
- **Docker base image:** `gcr.io/distroless/static-debian12`
- **Concurrency group:** `ci-${{ github.ref }}` with `cancel-in-progress: true`

### Anti-Patterns to Avoid
- DO NOT run all steps in a single job — use matrix strategy for parallel TS/Go execution
- DO NOT install golangci-lint manually via `go install` — use the official GitHub Action
- DO NOT skip `--frozen-lockfile` for pnpm install in CI — ensures lockfile integrity
- DO NOT push Docker images on PR builds — only build to verify the image compiles
- DO NOT use `npm` or `yarn` commands anywhere in the CI workflow
- DO NOT hardcode Go or Node versions as bare strings — use the action inputs for version management
- DO NOT skip the migration guard — it must run even if there are zero migration files (baseline check)
- DO NOT use `actions/cache` manually for pnpm — `pnpm/action-setup` handles caching
- DO NOT run tests without `-race` flag in Go — race detection is critical for concurrent code

### Project Structure Notes
- `.github/workflows/ci.yml` — main CI workflow file
- Root `package.json` — contains workspace-level `lint`, `typecheck`, `test` scripts
- Root `.eslintrc.js` or `eslint.config.js` — shared ESLint configuration
- `apps/mobile/jest.config.ts` — Jest config with `jest-expo` preset
- `apps/api/Dockerfile` — multi-stage build: Go compile -> distroless runtime
- `apps/api/migrations/` — SQL migration files checked by migration guard

### References
- [Source: architecture.md#Infrastructure & Deployment — CI/CD section]
- [Source: architecture.md#Enforcement Guidelines]
- [Source: architecture.md#Verified Current Versions]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
