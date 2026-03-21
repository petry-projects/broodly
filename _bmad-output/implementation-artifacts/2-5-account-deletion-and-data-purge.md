# Story 2.5: Account Deletion and Data Purge

Status: ready-for-dev

## Story

As a user,
I want to recover my account via email and permanently delete my account and all associated data,
so that I have full control over my account lifecycle.

## Acceptance Criteria (BDD)

1. GIVEN a user on the sign-in screen WHEN they tap "Forgot Password" and enter their registered email THEN Firebase sends a password reset email and a confirmation message is displayed.
2. GIVEN a user who enters an unregistered email for password reset WHEN they submit THEN a generic confirmation message is displayed (do not reveal whether the email exists).
3. GIVEN a signed-in user on the settings screen WHEN they tap "Delete Account" THEN a confirmation dialog appears warning that this action is irreversible and all data will be permanently deleted.
4. GIVEN a user viewing the deletion confirmation dialog WHEN they confirm by typing "DELETE" and tapping the final confirmation button THEN re-authentication is triggered before proceeding.
5. GIVEN a user who has re-authenticated and confirmed deletion WHEN the deletion executes THEN the Firebase account is deleted, the user is signed out, and they are navigated to the sign-in screen.
6. GIVEN a successful account deletion on the client WHEN the server receives the deletion event THEN a data purge job is scheduled via Cloud Tasks to soft-delete all user data (apiaries, hives, inspections, media, recommendations).
7. GIVEN a soft-deleted user record WHEN the purge job runs within the 30-day NFR14b window THEN all associated data is hard-deleted from PostgreSQL and media files are removed from Cloud Storage.
8. GIVEN a data purge job WHEN it completes THEN an audit record is written with `event_type: "account.purged"` containing the tenant_id and a summary of purged record counts.
9. GIVEN any error during the deletion process WHEN the error occurs THEN the user sees an error message with a recovery path and the account remains intact.

## Tasks / Subtasks

- [ ] Write unit tests for password reset flow (AC: #1, #2)
  - [ ] Test: `sendPasswordReset("valid@email.com")` calls `auth().sendPasswordResetEmail` and resolves
  - [ ] Test: `sendPasswordReset("unknown@email.com")` still resolves without error (Firebase behavior — do not reveal email existence)
  - [ ] Test: UI shows same confirmation message regardless of email existence
  - [ ] Test: invalid email format rejected before calling Firebase
- [ ] Write unit tests for account deletion client flow (AC: #3, #4, #5)
  - [ ] Test: tapping "Delete Account" opens confirmation dialog with warning text
  - [ ] Test: confirmation dialog requires typing "DELETE" to enable the final button
  - [ ] Test: typing anything other than "DELETE" keeps the button disabled
  - [ ] Test: confirming triggers re-authentication flow
  - [ ] Test: after re-auth, `currentUser.delete()` is called
  - [ ] Test: successful deletion clears Zustand auth store and navigates to sign-in
  - [ ] Test: deletion failure shows error toast and account remains intact
- [ ] Write unit tests for server-side deletion API (AC: #6)
  - [ ] Test: `DELETE /api/account` endpoint with valid auth token soft-deletes user record (sets `deleted_at` timestamp)
  - [ ] Test: soft-delete cascades to set `deleted_at` on all user's apiaries, hives, inspections
  - [ ] Test: deletion endpoint schedules a Cloud Tasks purge job with 30-day delay
  - [ ] Test: deletion endpoint returns 200 with confirmation payload
  - [ ] Test: deletion endpoint with invalid token returns 401
- [ ] Write unit tests for data purge worker (AC: #7)
  - [ ] Test: purge job receives tenant_id and deletion timestamp
  - [ ] Test: purge job hard-deletes all records with matching tenant_id and `deleted_at` set
  - [ ] Test: purge job deletes user's media files from Cloud Storage bucket
  - [ ] Test: purge job is idempotent — running twice does not error
  - [ ] Test: purge job skips records where `deleted_at` is null (not soft-deleted)
  - [ ] Test: purge job completes within expected time bounds for typical data volume
- [ ] Write unit tests for purge audit logging (AC: #8)
  - [ ] Test: after purge completes, audit record written with `event_type: "account.purged"`
  - [ ] Test: audit payload contains `tenant_id`, counts of purged records by type (apiaries, hives, inspections, media)
  - [ ] Test: audit record `occurred_at` matches purge completion time
- [ ] Write integration tests for full deletion lifecycle (AC: #5, #6, #7, #8)
  - [ ] Test: create user with apiaries/hives/inspections, trigger deletion, verify soft-delete, run purge job, verify hard-delete, verify audit record
- [ ] Implement password reset in `apps/mobile/src/services/auth.ts` (AC: #1, #2)
  - [ ] `sendPasswordReset(email: string)` — wraps `auth().sendPasswordResetEmail(email)`
  - [ ] Always show generic success message regardless of Firebase response
  - [ ] Validate email format client-side before calling Firebase
- [ ] Implement password reset UI on sign-in screen (AC: #1, #2)
  - [ ] "Forgot Password?" link below sign-in form
  - [ ] Email input with "Send Reset Link" button
  - [ ] Success message: "If an account exists for this email, a reset link has been sent"
  - [ ] Loading state during send operation
- [ ] Implement account deletion service in `apps/mobile/src/services/account.ts` (AC: #4, #5)
  - [ ] `deleteAccount()` — calls `currentUser.delete()` after re-authentication
  - [ ] Calls server deletion endpoint before deleting Firebase account
  - [ ] On success: clear Zustand store, navigate to sign-in
  - [ ] On failure: show error toast, do not delete account
- [ ] Implement deletion confirmation dialog in `apps/mobile/src/features/settings/components/DeleteAccountDialog.tsx` (AC: #3, #4)
  - [ ] Gluestack `<AlertDialog>` (irreversible action warrants modal dialog per CLAUDE.md)
  - [ ] Warning text: "This will permanently delete your account and all associated data including apiaries, hives, inspections, photos, and voice recordings. This cannot be undone."
  - [ ] Text input requiring exact "DELETE" to enable confirmation button
  - [ ] Confirmation button: `<Button action="negative" variant="solid">Delete My Account</Button>`
  - [ ] Cancel button to dismiss
- [ ] Implement server deletion endpoint in `apps/api/internal/auth/deletion.go` (AC: #6)
  - [ ] `DELETE /api/account` handler
  - [ ] Authenticate via JWT middleware (Story 2.2)
  - [ ] Soft-delete user record: `UPDATE users SET deleted_at = NOW() WHERE id = $1`
  - [ ] Cascade soft-delete to apiaries, hives, inspections, recommendations, tasks
  - [ ] Schedule Cloud Tasks purge job with task payload `{ tenant_id, deleted_at }` and 30-day delay
  - [ ] Return 200 with `{ status: "scheduled", purge_by: "<date>" }`
- [ ] Implement data purge worker in `apps/api/cmd/worker/purge.go` (AC: #7)
  - [ ] Cloud Tasks handler for purge job
  - [ ] Hard-delete all records for tenant_id where `deleted_at IS NOT NULL`
  - [ ] Delete order: media records -> inspections -> hives -> apiaries -> recommendations -> tasks -> user
  - [ ] Delete media files from Cloud Storage: list objects with prefix `tenant_id/`, delete all
  - [ ] Use database transaction for PostgreSQL deletes
  - [ ] Idempotent: check if records exist before attempting delete
- [ ] Implement purge audit logging (AC: #8)
  - [ ] After successful purge, write audit record with `event_type: "account.purged"`
  - [ ] Payload: `{ tenant_id, purged_counts: { apiaries: N, hives: N, inspections: N, media: N, recommendations: N, tasks: N }, completed_at }`
  - [ ] Audit record persists after user data is purged (audit is never deleted)

## Dev Notes

### Architecture Compliance
- Password reset uses Firebase `sendPasswordResetEmail` — server is not involved in reset flow
- Account deletion uses Cloud Tasks for scheduled purge per architecture.md: "Use Cloud Tasks for delayed/scheduled work"
- Soft-delete with `deleted_at` timestamp per architecture.md patterns, hard purge via async worker
- Media deletion from Cloud Storage uses the `broodly-media-{env}` bucket per architecture.md
- Audit records are immutable and persist even after user data is purged per architecture.md auditability requirements
- Data purge must complete within 30 days per NFR14b
- Deletion confirmation uses `<AlertDialog>` (full modal for irreversible operations) per CLAUDE.md navigation patterns

### TDD Requirements (Tests First!)
- **Test 1:** `testSendPasswordReset_ValidEmail` — mock `sendPasswordResetEmail`, call function, assert mock called with email.
- **Test 2:** `testSendPasswordReset_UnknownEmail` — mock `sendPasswordResetEmail` to resolve (Firebase does not error on unknown emails), assert no error surfaced to user.
- **Test 3:** `testSendPasswordReset_InvalidFormat` — call with "not-an-email", assert rejected before Firebase call.
- **Test 4:** Component test — render forgot password screen, enter email, submit, assert generic success message displayed regardless of outcome.
- **Test 5:** Component test — render delete account dialog, assert "DELETE" text input present, assert confirm button disabled initially.
- **Test 6:** Component test — type "DELETE" in confirmation input, assert confirm button becomes enabled. Type "delete" (lowercase), assert button remains disabled.
- **Test 7:** `testDeleteAccount_ClientFlow` — mock re-auth success, mock server DELETE endpoint 200, mock `currentUser.delete()` success, assert Zustand store cleared, assert navigation to sign-in.
- **Test 8:** `testDeleteAccount_ServerError` — mock server DELETE endpoint 500, assert `currentUser.delete()` NOT called, assert error toast shown, assert user remains signed in.
- **Test 9:** `TestDeletionEndpoint_SoftDelete` — create test user with apiaries/hives, call DELETE endpoint, query DB, assert `deleted_at` is set on user, apiaries, hives.
- **Test 10:** `TestDeletionEndpoint_SchedulesPurge` — mock Cloud Tasks client, call DELETE endpoint, assert task created with correct payload and 30-day delay.
- **Test 11:** `TestPurgeWorker_HardDelete` — insert soft-deleted user with related records, run purge worker, assert all records removed from DB.
- **Test 12:** `TestPurgeWorker_DeletesMedia` — mock Cloud Storage client, insert soft-deleted user with media records, run purge worker, assert GCS delete called for each media object.
- **Test 13:** `TestPurgeWorker_Idempotent` — run purge worker twice for same tenant, assert no errors on second run.
- **Test 14:** `TestPurgeWorker_AuditRecord` — run purge worker, query audit table, assert record with `event_type: "account.purged"` and correct counts in payload.
- **Test 15:** `TestPurgeWorker_Transaction` — simulate partial failure mid-delete (e.g., GCS error), assert DB transaction rolled back, no partial deletes persisted.

### Technical Specifications
- **Password reset:** `auth().sendPasswordResetEmail(email)` — Firebase handles email delivery
- **Account deletion client:** `currentUser.delete()` — requires recent re-authentication
- **Server deletion endpoint:** `DELETE /api/account` — REST endpoint (not GraphQL, as this is an account-level operation)
- **Soft-delete column:** `deleted_at TIMESTAMPTZ DEFAULT NULL` on users, apiaries, hives, inspections, recommendations, tasks tables
- **Cloud Tasks:** schedule purge job with 30-day delay: `scheduleTime = now + 30 days`
- **Cloud Storage cleanup:** list and delete objects under `{tenant_id}/` prefix in `broodly-media-{env}` bucket
- **Purge order:** media records (DB) -> GCS objects -> inspections -> hives -> apiaries -> recommendations -> tasks -> user record
- **Transaction:** all PostgreSQL deletes in a single transaction; GCS deletes are best-effort (retry on failure)
- **NFR14b:** all user data must be purged within 30 days of deletion request

### Anti-Patterns to Avoid
- DO NOT reveal email existence on password reset — always show generic success message
- DO NOT delete the Firebase account before server-side soft-delete — server must process first
- DO NOT hard-delete data immediately — use soft-delete with scheduled purge to allow recovery window
- DO NOT skip re-authentication before account deletion — Firebase requires it for security
- DO NOT delete audit records during purge — audit records are permanently retained
- DO NOT use a simple `DELETE FROM users WHERE id = $1` — cascade through all related tables in correct order
- DO NOT skip idempotency in the purge worker — it may be retried by Cloud Tasks
- DO NOT allow partial deletes to persist — use transactions for database operations
- DO NOT put the "DELETE" confirmation as a simple button tap — require explicit text input for this irreversible action

### Project Structure Notes
- `apps/mobile/src/services/auth.ts` — add `sendPasswordReset` function (extends Story 2.1 service)
- `apps/mobile/src/services/account.ts` — add `deleteAccount` function (extends Story 2.4 service)
- `apps/mobile/src/features/settings/components/DeleteAccountDialog.tsx` — deletion confirmation dialog
- `apps/mobile/src/features/settings/components/DeleteAccountDialog.test.tsx` — dialog tests
- `apps/api/internal/auth/deletion.go` — server-side deletion endpoint handler
- `apps/api/internal/auth/deletion_test.go` — deletion endpoint tests
- `apps/api/cmd/worker/purge.go` — data purge worker handler
- `apps/api/cmd/worker/purge_test.go` — purge worker tests

### References
- [Source: architecture.md#Authentication & Security — Firebase Authentication]
- [Source: architecture.md#Infrastructure & Deployment — Cloud Tasks for scheduled/delayed work]
- [Source: architecture.md#Authentication & Security — Auditability: immutable audit event log]
- [Source: architecture.md#Infrastructure & Deployment — Cloud Storage: broodly-media-{env}]
- [Source: epics.md#Story 2.4 — FR1c, FR1d, NFR14b]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
