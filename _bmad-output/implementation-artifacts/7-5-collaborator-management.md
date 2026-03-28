# Story 7.5: Collaborator Management

Status: ready-for-dev

## Story

As an account owner,
I want to invite collaborators by email with read-only access, view their status, and revoke their access with an audit trail,
so that I can share apiary visibility with helpers and mentors without giving them edit control.

**FRs:** FR5, FR6, FR7

## Acceptance Criteria (BDD)

1. GIVEN the settings screen WHEN the user navigates to collaborator management THEN a list of current collaborators displays with their email, status (pending/accepted), and role (read-only).
2. GIVEN the collaborator list WHEN no collaborators exist THEN an empty state renders with an explanation of the feature and an "Invite Collaborator" CTA.
3. GIVEN the invite form WHEN the owner enters a valid email and submits THEN an invitation is created with "pending" status via a GraphQL inviteCollaborator mutation.
4. GIVEN an invalid email WHEN submitted THEN a validation error displays before the mutation fires.
5. GIVEN a pending invitation WHEN the invited user accepts THEN their status updates to "accepted" and they gain read-only access to all of the owner's apiaries.
6. GIVEN an accepted collaborator WHEN the owner taps "Revoke Access" THEN a confirmation prompt displays explaining the action.
7. GIVEN the revoke confirmation WHEN confirmed THEN the collaborator's permissions are removed immediately via a GraphQL revokeCollaborator mutation and a success toast displays.
8. GIVEN any access change (invite, accept, revoke) WHEN it occurs THEN an audit event is written to the audit_events table with event_type, actor_id, tenant_id, occurred_at, and payload (FR7).
9. GIVEN the collaborator management screen WHEN the owner scrolls to the audit section THEN a chronological log of access changes is visible.
10. GIVEN a collaborator's session WHEN they view shared apiaries THEN all mutation controls (create, edit, delete) are hidden and data is read-only.
11. GIVEN a collaborator WHEN they attempt a mutation via direct API call THEN the server rejects it with a permission error based on RBAC middleware.

## Tasks / Subtasks

- [ ] Create collaborator management screen at `apps/mobile/app/(tabs)/settings/collaborators.tsx` (AC: #1, #2)
  - [ ] Implement TanStack Query hook `useCollaborators()` to fetch current collaborators
  - [ ] Render collaborator list: email, status badge (pending/accepted), role label
  - [ ] Implement empty state with feature explanation and "Invite Collaborator" CTA
  - [ ] Add navigation entry from settings screen
- [ ] Implement invite collaborator flow (AC: #3, #4)
  - [ ] Create invite form with email input field
  - [ ] Add client-side email format validation
  - [ ] Implement `inviteCollaborator` GraphQL mutation
  - [ ] On success, add collaborator to list with "pending" badge and show toast
  - [ ] Handle duplicate email and self-invite edge cases with user-friendly errors
- [ ] Implement revoke access flow (AC: #6, #7)
  - [ ] Add "Revoke Access" button using `<Button action="negative" variant="outline">` per collaborator row
  - [ ] Show confirmation bottom sheet (`<Actionsheet>`) explaining revocation effect
  - [ ] Implement `revokeCollaborator` GraphQL mutation
  - [ ] On success, remove collaborator from list and show success toast
- [ ] Implement audit log display (AC: #8, #9)
  - [ ] Implement TanStack Query hook `useAccessAuditLog()` to fetch access change events
  - [ ] Render chronological list: event type, target email, timestamp
  - [ ] Show audit section below collaborator list or in collapsible accordion
- [ ] Implement collaborator read-only view enforcement — frontend (AC: #10)
  - [ ] Check user role via auth context / Zustand auth store
  - [ ] Conditionally hide all mutation controls (create, edit, delete buttons/FABs) for collaborator role
  - [ ] Show read-only indicator banner on shared apiary screens for collaborators
- [ ] Implement collaborator RBAC enforcement — backend integration notes (AC: #11)
  - [ ] Document expected server-side RBAC behavior: collaborator role blocks all mutations
  - [ ] Add integration test spec: collaborator role mutation attempt returns permission error

## Dev Notes

### Architecture Compliance
- Collaborator role is set as a Firebase custom claim per architecture.md Authentication & Security section
- RBAC enforcement happens in Go chi middleware at the resolver level — frontend hides controls but server is the authority
- Audit events use the immutable audit_events table with append-only semantics: event_id, event_type, actor_id, tenant_id, occurred_at, payload_version, payload (JSONB)
- All authorization checks are composable middleware functions validated at the request boundary
- Collaborators get read-only access to ALL owner apiaries — no per-apiary granularity in MVP
- Invitation acceptance flow may use a deep link or in-app notification (implementation detail)

### TDD Requirements (Tests First!)
- Test 1: **Collaborator list rendering** — Given mock collaborator data, the list renders email, status badge, and role for each.
- Test 2: **Empty state** — Given zero collaborators, the empty state renders with feature explanation and invite CTA.
- Test 3: **Invite mutation** — Given a valid email, the inviteCollaborator mutation fires with correct email variable.
- Test 4: **Email validation** — Given an invalid email format, a validation error renders without firing the mutation.
- Test 5: **Revoke confirmation** — Given a revoke action, the confirmation prompt renders with explanation text.
- Test 6: **Revoke mutation** — Given confirmed revocation, the revokeCollaborator mutation fires and the collaborator is removed from the list.
- Test 7: **Audit log rendering** — Given access change events, the audit log renders in chronological order with type, email, and timestamp.
- Test 8: **Read-only view for collaborator** — Given a user with collaborator role, all mutation controls are hidden on apiary/hive screens.
- Test 9: **Server RBAC rejection** — Integration test spec: collaborator role mutation attempt returns permission error with correct error code.

### Technical Specifications
- **Collaborator statuses:** pending, accepted (displayed as Badge)
- **Collaborator role:** read-only (stored as Firebase custom claim, enforced in Go middleware)
- **Audit event schema:** `event_id` (UUID), `event_type` (collaborator_invited | collaborator_accepted | collaborator_revoked), `actor_id`, `tenant_id`, `occurred_at` (timestamp), `payload_version` (int), `payload` (JSONB with target_email, target_user_id)
- **GraphQL operations:** `collaborators` query, `inviteCollaborator` mutation, `revokeCollaborator` mutation, `accessAuditLog` query
- **Revoke confirmation:** `<Actionsheet>` bottom sheet (non-irreversible, data access removal is reversible by re-inviting)
- **Status badges:** pending=`<Badge action="info" variant="outline">`, accepted=`<Badge action="success">`

### Anti-Patterns to Avoid
- DO NOT enforce RBAC only on the frontend — server middleware is the authority; frontend hiding is UX convenience only
- DO NOT use `<AlertDialog>` for revocation — it is reversible (re-invite possible), so use bottom sheet
- DO NOT allow collaborators to see other collaborators' data — they see only the owner's shared apiaries
- DO NOT skip audit events for any access change — FR7 requires auditable history for all changes
- DO NOT implement per-apiary access control in MVP — collaborators see all apiaries
- DO NOT store collaborator role in local state only — it must come from Firebase custom claims validated server-side

### Project Structure Notes
- Screen: `apps/mobile/app/(tabs)/settings/collaborators.tsx`
- Feature components: `apps/mobile/src/features/collaborator/components/`
- Hooks: `apps/mobile/src/features/collaborator/hooks/useCollaborators.ts`, `useAccessAuditLog.ts`
- GraphQL operations: `apps/mobile/src/services/graphql/collaborator.ts`
- Auth role check utility: `apps/mobile/src/store/authStore.ts` (Zustand) — expose `isCollaborator` derived state

### References
- [Source: prd.md#FR5 — Grant read-only collaborator access]
- [Source: prd.md#FR6 — Revoke collaborator access]
- [Source: prd.md#FR7 — Auditable history of collaborator access changes]
- [Source: epics.md#Epic 7 — Story 7.6]
- [Source: architecture.md#Authentication & Security — RBAC, Firebase custom claims]
- [Source: architecture.md#Data Architecture — Audit event schema]
- [Source: CLAUDE.md#Navigation Patterns — Bottom sheets for quick confirmations]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
