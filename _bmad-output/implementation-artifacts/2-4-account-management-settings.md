# Story 2.4: Account Management Settings — Update Display Name and View Linked Account

Status: done

## Story

As a user,
I want to update my display name and view my linked social account from settings,
so that I can keep my profile information current.

## Acceptance Criteria (BDD)

1. GIVEN a signed-in user WHEN they navigate to Settings THEN a screen displays their current display name, linked social account (Google or Apple), and email address (read-only, from social provider).
2. GIVEN a user on the settings screen WHEN they edit their display name and tap "Save" THEN the display name updates in Firebase, the Zustand auth store reflects the change, and a success toast appears.
3. GIVEN any settings update operation in progress WHEN the operation is pending THEN the save button shows a loading state and is disabled.
4. GIVEN any settings update operation WHEN it fails (network error, Firebase error) THEN an error toast with a recovery action is displayed.

## Tasks / Subtasks

- [ ] Write unit tests for display name update (AC: #2)
  - [ ] Test: `updateDisplayName("New Name")` calls `currentUser.updateProfile({ displayName })` and resolves
  - [ ] Test: Zustand store `user.displayName` updates after successful profile update
  - [ ] Test: failure to update display name surfaces error message
- [ ] Write component tests for settings screen (AC: #1, #3, #4)
  - [ ] Test: settings screen renders current displayName, email (read-only), and linked social provider
  - [ ] Test: save button shows loading spinner during pending operation
  - [ ] Test: save button is disabled during pending operation
  - [ ] Test: success toast renders on successful update
  - [ ] Test: error toast renders on failed update with recovery message
- [ ] Implement account settings service in `apps/mobile/src/services/account.ts` (AC: #2)
  - [ ] `updateDisplayName(name: string)` — calls `currentUser.updateProfile({ displayName })`
  - [ ] Error mapping for Firebase error codes to user-facing messages
- [ ] Implement settings screen UI in `apps/mobile/app/(tabs)/settings.tsx` (AC: #1, #3, #4)
  - [ ] Display current display name (editable inline via Gluestack `<Input>`)
  - [ ] Display current email (read-only, sourced from social provider)
  - [ ] Display linked social account indicator (Google or Apple icon + label)
  - [ ] Save button with loading state (Gluestack `<Button>` with `isDisabled` and `<Spinner>`)
  - [ ] Success/error toast notifications (Gluestack `<Toast>`)
- [ ] Update Zustand auth store to reflect profile changes (AC: #2)
  - [ ] After successful display name update, call `setUser` with updated displayName

## Dev Notes

### Architecture Compliance
- Settings screen uses Expo Router file-based routing at `apps/mobile/app/(tabs)/settings.tsx`
- Account operations go through service wrapper in `apps/mobile/src/services/account.ts` — no direct Firebase calls from UI
- State updates flow through Zustand auth store per architecture.md frontend state model
- UI components use Gluestack UI v3 primitives per CLAUDE.md design system rules
- Toast notifications use Gluestack `<Toast>` component per CLAUDE.md
- Social login only — email and authentication are managed by the social provider (Google/Apple). No password fields or email change flows.

### TDD Requirements (Tests First!)
- **Test 1:** `testUpdateDisplayName_Success` — mock `currentUser.updateProfile`, call `updateDisplayName("New")`, assert mock called with `{ displayName: "New" }`, assert Zustand store updated.
- **Test 2:** `testUpdateDisplayName_Failure` — mock `currentUser.updateProfile` to reject, assert error message surfaced.
- **Test 3:** Component test — render settings screen with mock user `{ displayName: "Alice", email: "alice@test.com", providerId: "google.com" }`, assert "Alice" and "alice@test.com" displayed, assert Google linked account indicator shown.
- **Test 4:** Component test — trigger save, assert loading spinner visible, button disabled. On resolve, assert spinner gone, success toast visible.

### Technical Specifications
- **Display name:** `updateProfile({ displayName })` — does not require re-authentication
- **Linked account:** read from `currentUser.providerData[0].providerId` to show Google or Apple
- **Email:** read-only from `currentUser.email`, managed by social provider
- **Gluestack components:** `<Input>`, `<Button>`, `<Toast>`, `<Spinner>`, `<Text>`

### Anti-Patterns to Avoid
- DO NOT show raw Firebase error codes to users — always map to human-readable messages with recovery paths
- DO NOT skip loading states — every async operation must show loading feedback
- DO NOT include password change or email change fields — social login providers manage authentication

### Project Structure Notes
- `apps/mobile/app/(tabs)/settings.tsx` — settings screen (Expo Router)
- `apps/mobile/src/services/account.ts` — account management service wrapper
- `apps/mobile/src/services/account.test.ts` — account service unit tests

### References
- [Source: architecture.md#Authentication & Security — Firebase Authentication (Google Sign-In, Apple Sign-In)]
- [Source: architecture.md#Frontend Architecture — State model: Zustand stores]
- [Source: epics.md#Story 2.3 — FR1b]
- [Source: CLAUDE.md#Design System Foundation: Gluestack UI v3]
- [Source: CLAUDE.md#Emotional Design & Tone — Error messages always include a recovery path]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
