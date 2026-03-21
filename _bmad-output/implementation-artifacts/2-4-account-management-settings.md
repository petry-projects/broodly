# Story 2.4: Account Management Settings — Update Email, Password, Display Name

Status: ready-for-dev

## Story

As a user,
I want to update my email, password, and display name from settings,
so that I can keep my account information current.

## Acceptance Criteria (BDD)

1. GIVEN a signed-in user WHEN they navigate to Settings THEN a screen displays their current display name, email address, and a password change option.
2. GIVEN a user on the settings screen WHEN they edit their display name and tap "Save" THEN the display name updates in Firebase, the Zustand auth store reflects the change, and a success toast appears.
3. GIVEN a user on the settings screen WHEN they tap "Change Email" THEN a re-authentication prompt appears (password entry or OAuth re-sign-in) before proceeding.
4. GIVEN a user who has re-authenticated WHEN they enter a new valid email and confirm THEN Firebase sends a verification email to the new address and a confirmation message is displayed.
5. GIVEN a user on the settings screen WHEN they tap "Change Password" THEN a re-authentication prompt appears before proceeding.
6. GIVEN a user who has re-authenticated WHEN they enter a new password that meets minimum complexity (8+ chars, 1 uppercase, 1 number) THEN the password updates in Firebase and a success toast appears.
7. GIVEN a user who has re-authenticated WHEN they enter a new password that does not meet complexity requirements THEN an inline validation error describes the specific failing requirement.
8. GIVEN any settings update operation in progress WHEN the operation is pending THEN the save button shows a loading state and is disabled.
9. GIVEN any settings update operation WHEN it fails (network error, re-auth failed, Firebase error) THEN an error toast with a recovery action is displayed.

## Tasks / Subtasks

- [ ] Write unit tests for display name update (AC: #2)
  - [ ] Test: `updateDisplayName("New Name")` calls `currentUser.updateProfile({ displayName })` and resolves
  - [ ] Test: Zustand store `user.displayName` updates after successful profile update
  - [ ] Test: failure to update display name surfaces error message
- [ ] Write unit tests for email change flow (AC: #3, #4)
  - [ ] Test: `changeEmail` function calls `reauthenticateWithCredential` before `verifyBeforeUpdateEmail`
  - [ ] Test: re-authentication failure blocks email update and returns appropriate error
  - [ ] Test: successful re-auth + email update triggers verification email (mock `verifyBeforeUpdateEmail`)
  - [ ] Test: invalid email format rejected before calling Firebase
- [ ] Write unit tests for password change flow (AC: #5, #6, #7)
  - [ ] Test: `changePassword` function calls `reauthenticateWithCredential` before `updatePassword`
  - [ ] Test: re-authentication failure blocks password update
  - [ ] Test: password meeting complexity requirements succeeds
  - [ ] Test: password under 8 chars rejected with "Must be at least 8 characters"
  - [ ] Test: password without uppercase rejected with "Must contain at least one uppercase letter"
  - [ ] Test: password without number rejected with "Must contain at least one number"
- [ ] Write unit tests for password validation utility (AC: #6, #7)
  - [ ] Test: `validatePassword("Abcdefg1")` returns `{ valid: true, errors: [] }`
  - [ ] Test: `validatePassword("short")` returns `{ valid: false, errors: ["Must be at least 8 characters", ...] }`
  - [ ] Test: `validatePassword("alllowercase1")` returns error for missing uppercase
  - [ ] Test: `validatePassword("NoNumbers!")` returns error for missing number
- [ ] Write component tests for settings screen (AC: #1, #8, #9)
  - [ ] Test: settings screen renders current displayName and email
  - [ ] Test: save button shows loading spinner during pending operation
  - [ ] Test: save button is disabled during pending operation
  - [ ] Test: success toast renders on successful update
  - [ ] Test: error toast renders on failed update with recovery message
- [ ] Write component tests for re-authentication modal (AC: #3, #5)
  - [ ] Test: tapping "Change Email" opens re-authentication modal
  - [ ] Test: tapping "Change Password" opens re-authentication modal
  - [ ] Test: entering correct password in re-auth modal proceeds to the update flow
  - [ ] Test: entering wrong password shows error in re-auth modal
- [ ] Implement password validation utility in `apps/mobile/src/utils/password-validation.ts` (AC: #6, #7)
  - [ ] Validate minimum 8 characters
  - [ ] Validate at least one uppercase letter
  - [ ] Validate at least one number
  - [ ] Return array of failing requirements for inline display
- [ ] Implement account settings service in `apps/mobile/src/services/account.ts` (AC: #2, #3, #4, #5, #6)
  - [ ] `updateDisplayName(name: string)` — calls `currentUser.updateProfile({ displayName })`
  - [ ] `reauthenticate(password: string)` — calls `reauthenticateWithCredential` with email/password credential
  - [ ] `changeEmail(newEmail: string)` — calls `verifyBeforeUpdateEmail(newEmail)` (requires prior re-auth)
  - [ ] `changePassword(newPassword: string)` — calls `updatePassword(newPassword)` (requires prior re-auth)
  - [ ] Error mapping for all Firebase error codes to user-facing messages
- [ ] Implement settings screen UI in `apps/mobile/app/(tabs)/settings.tsx` (AC: #1, #8, #9)
  - [ ] Display current display name (editable inline via Gluestack `<Input>`)
  - [ ] Display current email (tap to change, triggers re-auth flow)
  - [ ] "Change Password" button (triggers re-auth flow)
  - [ ] Save button with loading state (Gluestack `<Button>` with `isDisabled` and `<Spinner>`)
  - [ ] Success/error toast notifications (Gluestack `<Toast>`)
- [ ] Implement re-authentication modal in `apps/mobile/src/features/settings/components/ReauthModal.tsx` (AC: #3, #5)
  - [ ] Modal with password input for email/password users
  - [ ] OAuth re-sign-in option for Google/Apple users
  - [ ] Loading and error states within modal
  - [ ] On success: resolve promise, dismiss modal, proceed with sensitive operation
- [ ] Update Zustand auth store to reflect profile changes (AC: #2)
  - [ ] After successful display name update, call `setUser` with updated displayName
  - [ ] After successful email verification sent, show pending state

## Dev Notes

### Architecture Compliance
- Settings screen uses Expo Router file-based routing at `apps/mobile/app/(tabs)/settings.tsx`
- Account operations go through service wrapper in `apps/mobile/src/services/account.ts` — no direct Firebase calls from UI
- State updates flow through Zustand auth store per architecture.md frontend state model
- UI components use Gluestack UI v3 primitives per CLAUDE.md design system rules
- Toast notifications use Gluestack `<Toast>` component per CLAUDE.md
- Re-authentication is required for sensitive operations per Firebase security model

### TDD Requirements (Tests First!)
- **Test 1:** `testUpdateDisplayName_Success` — mock `currentUser.updateProfile`, call `updateDisplayName("New")`, assert mock called with `{ displayName: "New" }`, assert Zustand store updated.
- **Test 2:** `testUpdateDisplayName_Failure` — mock `currentUser.updateProfile` to reject, assert error message surfaced.
- **Test 3:** `testChangeEmail_RequiresReauth` — mock `reauthenticateWithCredential` to succeed, mock `verifyBeforeUpdateEmail`, call `changeEmail`, assert both called in order.
- **Test 4:** `testChangeEmail_ReauthFails` — mock `reauthenticateWithCredential` to reject with `auth/wrong-password`, assert `verifyBeforeUpdateEmail` NOT called, assert error returned.
- **Test 5:** `testChangePassword_MeetsComplexity` — call `changePassword("ValidPass1")` with prior re-auth, assert `updatePassword` called.
- **Test 6:** `testChangePassword_FailsComplexity` — call `changePassword("weak")`, assert `updatePassword` NOT called, assert validation errors returned.
- **Test 7:** `testPasswordValidation_AllRules` — test each complexity rule independently: length, uppercase, number. Assert specific error messages for each failing rule.
- **Test 8:** Component test — render settings screen with mock user `{ displayName: "Alice", email: "alice@test.com" }`, assert "Alice" and "alice@test.com" displayed.
- **Test 9:** Component test — trigger save, assert loading spinner visible, button disabled. On resolve, assert spinner gone, success toast visible.
- **Test 10:** Component test — trigger "Change Email", assert re-auth modal opens. Enter password, submit, assert modal dismisses and email change flow begins.

### Technical Specifications
- **Re-authentication:** `reauthenticateWithCredential(EmailAuthProvider.credential(email, password))` for email/password users
- **Email change:** `verifyBeforeUpdateEmail(newEmail)` sends verification to new address; email only updates after user clicks verification link
- **Password change:** `updatePassword(newPassword)` after successful re-authentication
- **Display name:** `updateProfile({ displayName })` — does not require re-authentication
- **Password complexity:** minimum 8 characters, at least 1 uppercase letter, at least 1 number
- **Gluestack components:** `<Input>`, `<Button>`, `<Toast>`, `<Modal>`, `<Spinner>`, `<Alert>`

### Anti-Patterns to Avoid
- DO NOT allow email or password changes without re-authentication — Firebase requires it and it is a security best practice
- DO NOT validate password only on the server — validate client-side first for immediate feedback, server enforces as well
- DO NOT show raw Firebase error codes to users — always map to human-readable messages with recovery paths
- DO NOT store the password in component state longer than needed — clear after re-authentication completes
- DO NOT skip loading states — every async operation must show loading feedback
- DO NOT use `updateEmail` (deprecated) — use `verifyBeforeUpdateEmail` which requires email verification

### Project Structure Notes
- `apps/mobile/app/(tabs)/settings.tsx` — settings screen (Expo Router)
- `apps/mobile/src/services/account.ts` — account management service wrapper
- `apps/mobile/src/services/account.test.ts` — account service unit tests
- `apps/mobile/src/utils/password-validation.ts` — password complexity validator
- `apps/mobile/src/utils/password-validation.test.ts` — password validation tests
- `apps/mobile/src/features/settings/components/ReauthModal.tsx` — re-authentication modal
- `apps/mobile/src/features/settings/components/ReauthModal.test.tsx` — re-auth modal tests

### References
- [Source: architecture.md#Authentication & Security — Firebase Authentication (email/password, Google OAuth, Apple Sign-In)]
- [Source: architecture.md#Frontend Architecture — State model: Zustand stores]
- [Source: epics.md#Story 2.3 — FR1b]
- [Source: CLAUDE.md#Design System Foundation: Gluestack UI v3]
- [Source: CLAUDE.md#Emotional Design & Tone — Error messages always include a recovery path]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
