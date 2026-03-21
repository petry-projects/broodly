# Story 2.3: RBAC Middleware and Role Enforcement

Status: ready-for-dev

## Story

As a system,
I want role-based access control enforced at the resolver level,
so that collaborators see only what they are permitted and support roles have audit access.

## Acceptance Criteria (BDD)

1. GIVEN a user with the `owner` role WHEN they access any resource belonging to their tenant THEN all read and write operations succeed.
2. GIVEN a user with the `collaborator` role WHEN they attempt to read hive or apiary data for a tenant they collaborate on THEN the read succeeds.
3. GIVEN a user with the `collaborator` role WHEN they attempt to mutate hive data (create, update, delete) THEN the middleware returns a 403 with a structured permission error containing code `FORBIDDEN` and a message describing the required role.
4. GIVEN a user with the `support` role WHEN they attempt to read recommendation history and audit logs THEN the read succeeds.
5. GIVEN a user with the `support` role WHEN they attempt to mutate any user data or hive data THEN the middleware returns a 403 with code `FORBIDDEN`.
6. GIVEN a user with any role WHEN they attempt to access a resource belonging to a different tenant THEN the request is denied with code `FORBIDDEN` and the resource is not exposed.
7. GIVEN any database query executed by any repository function WHEN the query runs THEN it includes `WHERE tenant_id = $1` as a mandatory parameter enforced by the repository interface signature.
8. GIVEN an access change event (role granted, role revoked, permission denied) WHEN it occurs THEN an immutable audit record is written to the audit table with `event_type`, `actor_id`, `tenant_id`, `occurred_at`, and `payload`.

## Tasks / Subtasks

- [ ] Write unit tests for role permission matrix (AC: #1, #2, #3, #4, #5)
  - [ ] Test: `owner` role has permission for `read:hive`, `write:hive`, `read:apiary`, `write:apiary`, `read:inspection`, `write:inspection`, `read:audit`
  - [ ] Test: `collaborator` role has permission for `read:hive`, `read:apiary`, `read:inspection` but NOT `write:hive`, `write:apiary`, `write:inspection`
  - [ ] Test: `support` role has permission for `read:recommendation_history`, `read:audit` but NOT any `write:*` or `read:hive` (except via audit)
  - [ ] Test: unknown/empty role defaults to no permissions (deny by default)
- [ ] Write unit tests for RBAC middleware (AC: #1, #2, #3, #4, #5)
  - [ ] Test: `RequireRole("owner")` middleware passes request with owner role in context
  - [ ] Test: `RequireRole("owner")` middleware blocks request with collaborator role, returns 403
  - [ ] Test: `RequirePermission("write:hive")` middleware passes for owner, blocks for collaborator
  - [ ] Test: `RequirePermission("read:audit")` middleware passes for support and owner, blocks for collaborator
  - [ ] Test: middleware returns structured GraphQL error with `FORBIDDEN` code on denial
- [ ] Write unit tests for tenant isolation (AC: #6)
  - [ ] Test: `RequireTenantAccess` middleware compares `tenant_id` from request path/argument with user's tenant from context — match passes, mismatch returns 403
  - [ ] Test: user with `owner` role cannot access resources from a different tenant
  - [ ] Test: user with `support` role can only access audit data, not tenant-specific resources
- [ ] Write unit tests for repository tenant enforcement (AC: #7)
  - [ ] Test: repository interface `GetHive(ctx, tenantID, hiveID)` requires tenantID parameter — compile-time enforcement via function signature
  - [ ] Test: integration test verifying query includes tenant_id filter (inspect generated SQL or use query interceptor)
  - [ ] Test: calling repository function with mismatched tenantID returns no results (not another tenant's data)
- [ ] Write unit tests for audit logging on access changes (AC: #8)
  - [ ] Test: granting a collaborator role writes audit record with `event_type: "role.granted"`, correct `actor_id`, `tenant_id`
  - [ ] Test: revoking a role writes audit record with `event_type: "role.revoked"`
  - [ ] Test: permission denied event writes audit record with `event_type: "access.denied"`, includes attempted resource and required permission in payload
  - [ ] Test: audit records are append-only (no UPDATE or DELETE on audit table)
- [ ] Define role and permission constants in `apps/api/internal/auth/roles.go` (AC: #1, #2, #4)
  - [ ] Define `RoleOwner`, `RoleCollaborator`, `RoleSupport` constants
  - [ ] Define permission constants: `PermReadHive`, `PermWriteHive`, `PermReadApiary`, `PermWriteApiary`, `PermReadInspection`, `PermWriteInspection`, `PermReadAudit`, `PermReadRecommendationHistory`
  - [ ] Define `RolePermissions` map: role -> set of permissions
  - [ ] `HasPermission(role, permission)` function
- [ ] Implement `RequireRole` chi middleware in `apps/api/internal/auth/rbac.go` (AC: #1, #2, #3, #4, #5)
  - [ ] Read role from context (set by JWT middleware in Story 2.2)
  - [ ] Check if role matches required role(s)
  - [ ] On match: call next handler
  - [ ] On mismatch: return structured 403 error with `FORBIDDEN` code
- [ ] Implement `RequirePermission` chi middleware in `apps/api/internal/auth/rbac.go` (AC: #2, #3, #4, #5)
  - [ ] Read role from context
  - [ ] Look up role's permissions in `RolePermissions` map
  - [ ] Check if required permission is in the set
  - [ ] On match: call next handler
  - [ ] On mismatch: return structured 403 error
- [ ] Implement `RequireTenantAccess` middleware in `apps/api/internal/auth/rbac.go` (AC: #6)
  - [ ] Extract `tenant_id` from request context or GraphQL arguments
  - [ ] Compare with authenticated user's tenant (from JWT claims or user record)
  - [ ] Block cross-tenant access with 403
- [ ] Enforce tenant_id in repository interfaces in `apps/api/internal/repository/` (AC: #7)
  - [ ] All repository interface methods include `tenantID string` as a required parameter
  - [ ] sqlc queries include `WHERE tenant_id = @tenant_id` in all SELECT, UPDATE, DELETE statements
  - [ ] No repository method allows querying without tenant scope
- [ ] Implement audit logging for access changes in `apps/api/internal/auth/audit.go` (AC: #8)
  - [ ] `LogAccessChange(ctx, eventType, actorID, tenantID, payload)` function
  - [ ] Writes to `audit_events` table with append-only semantics
  - [ ] Event types: `role.granted`, `role.revoked`, `access.denied`
  - [ ] Payload includes `resource`, `required_permission`, `actual_role`
- [ ] Wire RBAC middleware into chi router and GraphQL resolver layer (AC: #1, #2, #3, #4, #5)
  - [ ] Apply `RequireRole` or `RequirePermission` at resolver group level
  - [ ] Mutation resolvers require write permissions
  - [ ] Query resolvers require read permissions
  - [ ] Audit/support resolvers require support or owner role

## Dev Notes

### Architecture Compliance
- RBAC is enforced in Go chi middleware per architecture.md: "RBAC enforced in Go chi middleware. Roles: owner, collaborator (read-only), support"
- Authorization is application-level, not database RLS per architecture.md: "application-level RBAC enforced in Go middleware; no RLS dependency"
- Permission checks occur at the resolver/handler level before any data access per architecture.md
- All database queries include `WHERE tenant_id = $1` as a mandatory parameter, enforced by repository interface signatures per architecture.md
- Roles stored as Firebase custom claims, read from validated JWT context per architecture.md
- Audit records use the immutable audit event schema from architecture.md: `event_id`, `event_type`, `actor_id`, `tenant_id`, `occurred_at`, `payload_version`, `payload` (JSONB)

### TDD Requirements (Tests First!)
- **Test 1:** `TestRolePermissions_Owner` — assert `HasPermission(RoleOwner, PermWriteHive)` returns true, repeat for all owner permissions.
- **Test 2:** `TestRolePermissions_Collaborator` — assert `HasPermission(RoleCollaborator, PermReadHive)` true, `HasPermission(RoleCollaborator, PermWriteHive)` false.
- **Test 3:** `TestRolePermissions_Support` — assert `HasPermission(RoleSupport, PermReadAudit)` true, `HasPermission(RoleSupport, PermWriteHive)` false, `HasPermission(RoleSupport, PermReadHive)` false.
- **Test 4:** `TestRolePermissions_Unknown` — assert `HasPermission("unknown", PermReadHive)` returns false (deny by default).
- **Test 5:** `TestRequireRole_Owner_Passes` — create request context with `role=owner`, apply `RequireRole("owner")`, assert next handler called.
- **Test 6:** `TestRequireRole_Collaborator_BlocksMutation` — create request context with `role=collaborator`, apply `RequireRole("owner")`, assert 403 with `FORBIDDEN` code.
- **Test 7:** `TestRequirePermission_WriteHive_Collaborator` — context with `role=collaborator`, apply `RequirePermission("write:hive")`, assert 403.
- **Test 8:** `TestRequirePermission_ReadAudit_Support` — context with `role=support`, apply `RequirePermission("read:audit")`, assert passes.
- **Test 9:** `TestRequireTenantAccess_SameTenant` — user tenant "tenant-1" accessing resource with tenant "tenant-1", assert passes.
- **Test 10:** `TestRequireTenantAccess_DifferentTenant` — user tenant "tenant-1" accessing resource with tenant "tenant-2", assert 403.
- **Test 11:** `TestRepositoryTenantEnforcement` — integration test: insert hive for tenant-1, query with tenant-2 via repository, assert empty result. Query with tenant-1, assert hive returned.
- **Test 12:** `TestAuditLog_RoleGranted` — call `LogAccessChange` with `role.granted`, query audit table, assert record exists with correct fields.
- **Test 13:** `TestAuditLog_AccessDenied` — trigger RBAC denial, assert audit record written with `access.denied` event type and payload containing attempted resource.
- **Test 14:** `TestAuditTable_AppendOnly` — attempt UPDATE on audit_events table, assert error (enforced by DB trigger or application-level check).

### Technical Specifications
- **Roles:** `owner` (full access to own tenant), `collaborator` (read-only to granted tenant), `support` (audit/recommendation history read access)
- **Permission model:** role -> permission set mapping, checked via `HasPermission(role, permission)` function
- **Middleware composition:** `RequireRole` for coarse checks, `RequirePermission` for fine-grained checks, `RequireTenantAccess` for cross-tenant isolation
- **Audit table schema:** `audit_events(event_id UUID, event_type TEXT, actor_id UUID, tenant_id UUID, occurred_at TIMESTAMPTZ, payload_version INT, payload JSONB)`
- **Custom claims:** role is stored as `role` field in Firebase custom claims, set via Firebase Admin SDK (admin operation, not part of this story)
- **Default role:** new users default to `owner` role for their own tenant

### Anti-Patterns to Avoid
- DO NOT use database-level RLS for authorization — use application-level RBAC per architecture decision
- DO NOT allow any repository function to omit `tenant_id` parameter — this is the primary data isolation mechanism
- DO NOT use role checks only at the API gateway level — enforce at the resolver/handler level before data access
- DO NOT hardcode role permissions in middleware — use the centralized `RolePermissions` map
- DO NOT allow support role to access raw tenant data — support sees only audit logs and recommendation history
- DO NOT make audit records mutable — audit table is append-only, no UPDATE or DELETE operations
- DO NOT check permissions after data fetching — check before any data access to prevent data leakage
- DO NOT use string literals for roles/permissions throughout the codebase — use the defined constants

### Project Structure Notes
- `apps/api/internal/auth/roles.go` — role and permission constants, permission map
- `apps/api/internal/auth/roles_test.go` — role permission matrix tests
- `apps/api/internal/auth/rbac.go` — RequireRole, RequirePermission, RequireTenantAccess middleware
- `apps/api/internal/auth/rbac_test.go` — RBAC middleware unit tests
- `apps/api/internal/auth/audit.go` — access change audit logging
- `apps/api/internal/auth/audit_test.go` — audit logging tests
- `apps/api/internal/repository/` — all repository interfaces enforce tenantID parameter

### References
- [Source: architecture.md#Authentication & Security — RBAC enforced in Go chi middleware]
- [Source: architecture.md#Data Architecture — Authorization model: application-level RBAC, no RLS dependency]
- [Source: architecture.md#Data Architecture — All database queries include WHERE tenant_id = $1]
- [Source: architecture.md#Authentication & Security — Auditability: immutable audit event log]
- [Source: epics.md#Story 2.5 — FR5, FR6, FR7, FR55]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
