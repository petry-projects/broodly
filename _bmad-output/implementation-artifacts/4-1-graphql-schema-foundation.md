# Story 4.1: GraphQL Schema Foundation

Status: review

## Story

As a developer,
I want the GraphQL schema defined with all MVP types including the mandatory Recommendation contract and generated Go resolvers plus TypeScript client types,
so that frontend and backend share a single source of truth for the API surface.

## Acceptance Criteria (BDD)

1. GIVEN the `apps/api/graph/schema/` directory WHEN I run `go generate ./...` (gqlgen) THEN the schema parses without errors and Go resolver stubs are generated in `apps/api/graph/resolver/`.
2. GIVEN the generated schema WHEN I inspect the `Recommendation` type THEN it contains non-nullable fields: `action: String!`, `rationale: String!`, `confidenceLevel: Float!`, `confidenceType: ConfidenceType!`, `fallbackAction: String!`, and `evidenceContext: JSON`.
3. GIVEN the schema WHEN I inspect the `ConfidenceType` enum THEN it contains exactly: `HIGH`, `MODERATE`, `LOW`, `INSUFFICIENT_DATA`, `CONFLICTING_EVIDENCE`, `LIMITED_EXPERIENCE`.
4. GIVEN the schema WHEN I inspect all type definitions THEN the following types exist: `User`, `Apiary`, `Hive`, `Inspection`, `Observation`, `Recommendation`, `Task`, `AuditEvent`.
5. GIVEN the schema WHEN I inspect the Query type THEN it exposes: `me`, `apiaries`, `apiary`, `hives`, `hive`, `inspections`, `inspection`, `tasks`, `recommendations`.
6. GIVEN the schema WHEN I inspect the Mutation type THEN it exposes: `createApiary`, `updateApiary`, `deleteApiary`, `createHive`, `updateHive`, `deleteHive`, `startInspection`, `completeInspection`, `addObservation`, `deferTask`, `completeTask`.
7. GIVEN the schema files WHEN I run `@graphql-codegen/cli` with `typescript` and `typescript-operations` plugins THEN TypeScript types are generated in `packages/graphql-types/src/` without errors.
8. GIVEN the generated TypeScript types WHEN I inspect the `Recommendation` type THEN all non-nullable fields from the schema are required properties (not optional).
9. GIVEN any GraphQL error response WHEN I inspect the error extensions THEN it contains typed domain error fields: `code` (string), `message` (string), `retryable` (boolean).

## Tasks / Subtasks

- [x] Write schema parse test: verify `gqlgen generate` succeeds with zero errors (AC: #1)
- [x] Write Recommendation type test: assert all non-nullable fields are present and correctly typed (AC: #2)
- [x] Write ConfidenceType enum test: assert all six enum values exist (AC: #3)
- [x] Write core types test: assert User, Apiary, Hive, Inspection, Observation, Recommendation, Task, AuditEvent types exist (AC: #4)
- [x] Write Query type test: assert all required query fields resolve (AC: #5)
- [x] Write Mutation type test: assert all required mutation fields resolve (AC: #6)
- [x] Write codegen test: assert `@graphql-codegen/cli` produces TypeScript output without errors (AC: #7)
- [x] Write TS Recommendation type test: assert generated type has all required (non-optional) properties (AC: #8)
- [x] Define `schema.graphql` with scalar definitions (JSON, DateTime, UUID) and error interface (AC: #9)
- [x] Define `recommendation.graphql` with Recommendation type, ConfidenceType enum, and EvidenceSource type (AC: #2, #3)
- [x] Define `apiary.graphql` with Apiary and related input types (AC: #4, #5, #6)
- [x] Define `hive.graphql` with Hive and related input types (AC: #4, #5, #6)
- [x] Define `inspection.graphql` with Inspection, Observation, and related input types (AC: #4, #5, #6)
- [x] Define `task.graphql` with Task and related input types (AC: #4, #5, #6)
- [x] Define `user.graphql` with User type and `me` query (AC: #4, #5)
- [x] Define `audit.graphql` with AuditEvent type (AC: #4)
- [x] Configure `gqlgen.yml` to point at schema files, set model and resolver output paths (AC: #1)
- [x] Run `gqlgen generate` and verify resolver stubs compile (AC: #1)
- [x] Configure `codegen.ts` for `@graphql-codegen/cli` with `typescript` + `typescript-operations` plugins targeting `packages/graphql-types/src/` (AC: #7)
- [x] Run codegen and verify generated TS types (AC: #7, #8)
- [x] Define GraphQL error extensions type for typed domain errors (AC: #9)

## Dev Notes

### Architecture Compliance
- Schema-first design: `.graphql` files are the source of truth; Go types and resolvers are generated via `gqlgen`
- TypeScript client types are generated via `@graphql-codegen/cli` — never hand-written
- Recommendation contract is architecturally mandated as non-nullable: every recommendation surface must return action + rationale + confidence + fallback
- Error handling uses GraphQL error extensions with stable machine-readable `code`, human `message`, and `retryable` boolean — not custom union types
- Schema files live in `apps/api/graph/schema/` per the project directory structure
- Generated Go models go to `apps/api/graph/model/`; resolvers to `apps/api/graph/resolver/`
- Generated TS types go to `packages/graphql-types/src/`

### TDD Requirements (Tests First!)
- Test 1: **Schema parse** — Run `gqlgen generate` and assert exit code 0 with no validation errors.
- Test 2: **Recommendation contract** — Introspect the schema programmatically; assert `Recommendation` type fields `action`, `rationale`, `confidenceLevel`, `confidenceType`, `fallbackAction` are all `NON_NULL`.
- Test 3: **ConfidenceType enum values** — Introspect the schema; assert the enum contains exactly the six specified values.
- Test 4: **Core type existence** — Introspect the schema; assert all eight MVP types are present.
- Test 5: **TypeScript codegen** — Run `@graphql-codegen/cli` and assert exit code 0.
- Test 6: **TS Recommendation type** — Import the generated type in a test file; assert required properties compile without optional chaining.

### Technical Specifications
- **gqlgen:** 0.17.x, schema-first code generation
- **@graphql-codegen/cli:** latest, with `typescript` and `typescript-operations` plugins
- **Custom scalars:** `JSON` (backed by `map[string]interface{}` in Go), `DateTime` (ISO-8601 UTC string), `UUID` (opaque string)
- **Schema convention:** GraphQL types in PascalCase, fields in camelCase
- **ConfidenceType enum values:** `HIGH`, `MODERATE`, `LOW`, `INSUFFICIENT_DATA`, `CONFLICTING_EVIDENCE`, `LIMITED_EXPERIENCE`
- **Recommendation non-nullable fields:** `action: String!`, `rationale: String!`, `confidenceLevel: Float!`, `confidenceType: ConfidenceType!`, `fallbackAction: String!`, `evidenceContext: JSON`
- **Error extensions shape:** `{ "code": "VALIDATION_ERROR", "message": "...", "retryable": false }`

### Anti-Patterns to Avoid
- DO NOT hand-write Go types that gqlgen should generate — only customize via `gqlgen.yml` model bindings
- DO NOT hand-write TypeScript types that codegen should generate — only extend via declaration merging if absolutely needed
- DO NOT make Recommendation contract fields nullable — the architecture mandates all five core fields as non-null
- DO NOT use GraphQL union types for error handling — use error extensions with typed `code` field
- DO NOT put schema files outside `apps/api/graph/schema/` — that is the canonical location
- DO NOT define resolvers before the schema compiles — schema-first means schema is always written and validated first
- DO NOT skip the `evidenceContext` field on Recommendation — it is required for trust/explainability tracing

### Project Structure Notes
- Schema files: `apps/api/graph/schema/*.graphql`
- gqlgen config: `apps/api/gqlgen.yml`
- Generated Go models: `apps/api/graph/model/`
- Generated Go resolver stubs: `apps/api/graph/resolver/`
- Codegen config: `packages/graphql-types/codegen.ts`
- Generated TS types: `packages/graphql-types/src/generated/`

### References
- [Source: architecture.md#API & Communication Patterns]
- [Source: architecture.md#Core Architectural Decisions — API strategy]
- [Source: architecture.md#Implementation Patterns & Consistency Rules — Naming Patterns]
- [Source: architecture.md#Key Go Package Recommendations — gqlgen]
- [Source: epics.md#Story 4.1]
- [Source: CLAUDE.md#Tech Stack Quick Reference]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Completion Notes List
- Defined 8 GraphQL schema files covering all MVP domain types: User, Apiary, Hive, Inspection, Observation, Recommendation, Task, AuditEvent
- Recommendation contract enforces non-nullable fields: action, rationale, confidenceLevel, confidenceType, fallbackAction (evidenceContext is nullable JSON per spec)
- ConfidenceType enum has all 6 values: HIGH, MODERATE, LOW, INSUFFICIENT_DATA, CONFLICTING_EVIDENCE, LIMITED_EXPERIENCE
- Query type exposes 9 fields: me, apiaries, apiary, hives, hive, inspections, inspection, tasks, recommendations
- Mutation type exposes 11 fields: createApiary, updateApiary, deleteApiary, createHive, updateHive, deleteHive, startInspection, completeInspection, addObservation, deferTask, completeTask
- ErrorExtensions type defines typed domain error shape (code, message, retryable)
- Custom scalars: JSON (map), DateTime (ISO-8601), UUID (string)
- gqlgen generates Go models + resolver stubs; @graphql-codegen/cli generates TypeScript types
- 7 Go tests (schema introspection) + 5 TS tests (type validation) — all pass
- Zero regressions in existing auth and repository test suites

### Change Log
- 2026-03-29: Story 4.1 implemented — GraphQL schema, gqlgen generation, TS codegen, full test coverage

### File List
- apps/api/graph/schema/schema.graphql (new)
- apps/api/graph/schema/recommendation.graphql (new)
- apps/api/graph/schema/user.graphql (new)
- apps/api/graph/schema/apiary.graphql (new)
- apps/api/graph/schema/hive.graphql (new)
- apps/api/graph/schema/inspection.graphql (new)
- apps/api/graph/schema/task.graphql (new)
- apps/api/graph/schema/audit.graphql (new)
- apps/api/graph/schema_test.go (new)
- apps/api/graph/generated.go (generated)
- apps/api/graph/model/model.go (new)
- apps/api/graph/model/models_gen.go (generated)
- apps/api/graph/resolver/resolver.go (generated)
- apps/api/graph/resolver/apiary.resolvers.go (generated)
- apps/api/graph/resolver/hive.resolvers.go (generated)
- apps/api/graph/resolver/inspection.resolvers.go (generated)
- apps/api/graph/resolver/recommendation.resolvers.go (generated)
- apps/api/graph/resolver/schema.resolvers.go (generated)
- apps/api/graph/resolver/task.resolvers.go (generated)
- apps/api/graph/resolver/user.resolvers.go (generated)
- apps/api/gqlgen.yml (modified)
- apps/api/go.mod (modified)
- apps/api/go.sum (modified)
- packages/graphql-types/codegen.ts (new)
- packages/graphql-types/package.json (modified)
- packages/graphql-types/src/index.ts (modified)
- packages/graphql-types/src/generated/types.ts (generated)
- packages/graphql-types/src/generated/types.test.ts (new)
