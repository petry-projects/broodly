# Story 5.3: Zustand Stores — Auth, UI, and Connectivity

Status: ready-for-dev

## Story

As a developer,
I want Zustand stores for auth state, UI preferences, and connectivity status with appropriate persistence,
so that cross-cutting client state is centralized, testable, and survives app restarts.

## Acceptance Criteria (BDD)

1. GIVEN a Firebase auth state change event fires WHEN the user signs in THEN the auth store updates with the user object, `isAuthenticated: true`, and `isLoading: false`.
2. GIVEN the device transitions from online to offline WHEN NetInfo reports the change THEN the connectivity store updates `isOnline: false` and records `lastOnlineAt` timestamp.
3. GIVEN the device transitions from offline to online WHEN NetInfo reports the change THEN the connectivity store updates `isOnline: true` and the offline banner disappears within 2 seconds.
4. GIVEN the offline banner component WHEN `isOnline` is false THEN a Sky Blue `<Alert action="info">` banner with a cloud-offline icon renders at the top of the screen.
5. GIVEN the UI store WHEN the user completes onboarding THEN `onboardingComplete: true` persists and survives app restart.
6. GIVEN the UI store WHEN the user selects an active apiary THEN `activeApiaryId` updates and is available to all consuming components.
7. GIVEN the auth store WHEN the user signs out THEN the store resets to its initial state with `isAuthenticated: false` and `user: null`.

## Tasks / Subtasks

- [ ] Write auth store tests before implementation (AC: #1, #7)
  - [ ] Test: auth store initializes with `isAuthenticated: false`, `user: null`, `isLoading: true`
  - [ ] Test: `setUser(user)` sets user object and `isAuthenticated: true`
  - [ ] Test: `clearUser()` resets to initial state
  - [ ] Test: Firebase `onAuthStateChanged` listener updates store on sign-in
  - [ ] Test: Firebase `onAuthStateChanged` listener updates store on sign-out
- [ ] Write connectivity store tests (AC: #2, #3)
  - [ ] Test: store initializes with `isOnline: true` (optimistic default)
  - [ ] Test: calling `setOffline()` sets `isOnline: false` and records `lastOnlineAt`
  - [ ] Test: calling `setOnline()` sets `isOnline: true`
  - [ ] Test: NetInfo listener integration triggers store updates
- [ ] Write offline banner component tests (AC: #4)
  - [ ] Test: banner renders when `isOnline: false`
  - [ ] Test: banner does not render when `isOnline: true`
  - [ ] Test: banner uses `<Alert action="info">` with correct icon
  - [ ] Test: banner is accessible (announces offline status)
- [ ] Write UI store tests (AC: #5, #6)
  - [ ] Test: `onboardingComplete` defaults to false
  - [ ] Test: `setOnboardingComplete(true)` persists across store recreation (MMKV persistence)
  - [ ] Test: `setActiveApiaryId(id)` updates and is retrievable
  - [ ] Test: `activeApiaryId` defaults to null
- [ ] Create auth store (AC: #1, #7)
  - [ ] Create `apps/mobile/src/store/auth-store.ts`
  - [ ] State: `user: FirebaseUser | null`, `isAuthenticated: boolean`, `isLoading: boolean`
  - [ ] Actions: `setUser(user)`, `clearUser()`, `setLoading(boolean)`
  - [ ] Helper: `getIdToken()` — returns current user's Firebase ID token for GraphQL client
  - [ ] NO persistence (auth state re-derived from Firebase on app start)
- [ ] Create Firebase auth state listener (AC: #1, #7)
  - [ ] Create `apps/mobile/src/services/auth/auth-listener.ts`
  - [ ] Subscribe to `onAuthStateChanged` and sync to auth store
  - [ ] Initialize in root layout `_layout.tsx`
- [ ] Create connectivity store (AC: #2, #3)
  - [ ] Create `apps/mobile/src/store/connectivity-store.ts`
  - [ ] State: `isOnline: boolean`, `lastOnlineAt: Date | null`
  - [ ] Actions: `setOnline()`, `setOffline()`
  - [ ] NO persistence (connectivity state is ephemeral)
- [ ] Create NetInfo listener (AC: #2, #3)
  - [ ] Install `@react-native-community/netinfo`
  - [ ] Create `apps/mobile/src/services/connectivity/connectivity-listener.ts`
  - [ ] Subscribe to NetInfo state changes and sync to connectivity store
  - [ ] Initialize in root layout `_layout.tsx`
- [ ] Create UI preferences store (AC: #5, #6)
  - [ ] Create `apps/mobile/src/store/ui-store.ts`
  - [ ] State: `onboardingComplete: boolean`, `activeApiaryId: string | null`
  - [ ] Actions: `setOnboardingComplete(boolean)`, `setActiveApiaryId(id)`
  - [ ] Persist via `zustand/middleware` with MMKV storage adapter
- [ ] Create offline banner component (AC: #4)
  - [ ] Create `apps/mobile/src/features/connectivity/components/OfflineBanner/index.tsx`
  - [ ] Use Gluestack `<Alert action="info">` with `<AlertIcon>` (cloud-offline) and `<AlertText>`
  - [ ] Color: Sky Blue (`info-500`, #4A90C4) per CLAUDE.md
  - [ ] Accessibility: announce "You are offline. Showing cached data." on render
  - [ ] Integrate into root layout so it appears globally above all screens
- [ ] Create store barrel export (AC: all)
  - [ ] Create `apps/mobile/src/store/index.ts` exporting all stores
- [ ] Create MMKV persistence adapter for Zustand (AC: #5)
  - [ ] Create `apps/mobile/src/store/mmkv-storage.ts`
  - [ ] Implement Zustand `StateStorage` interface backed by MMKV

## Dev Notes

### Architecture Compliance
- Architecture specifies Zustand for workflow/UI state, TanStack Query for server state — this story covers Zustand only
- Auth state derives from Firebase `onAuthStateChanged` — the store is a reactive mirror, not the source of truth
- Connectivity store uses `@react-native-community/netinfo` — the standard RN connectivity library
- Offline banner uses `<Alert action="info">` per CLAUDE.md status semantics (info = Sky Blue)
- Persistent stores use MMKV (same backend as TanStack Query persistence in Story 5.2)

### TDD Requirements (Tests First!)
- Test 1: **Auth store state machine** — Create auth store, assert initial state. Call `setUser()`, assert authenticated. Call `clearUser()`, assert reset.
- Test 2: **Firebase listener sync** — Mock `onAuthStateChanged` to emit a user, assert auth store updates. Emit null, assert store clears.
- Test 3: **Connectivity transitions** — Create connectivity store, call `setOffline()`, assert `isOnline: false` and `lastOnlineAt` is set. Call `setOnline()`, assert `isOnline: true`.
- Test 4: **Offline banner visibility** — Render `OfflineBanner` with connectivity store `isOnline: false`, assert banner is visible. Set `isOnline: true`, assert banner is gone.
- Test 5: **UI store persistence** — Set `onboardingComplete: true`, recreate the store from MMKV, assert value is `true`.

### Technical Specifications
- **Zustand:** latest stable (v4.x or v5.x)
- **Zustand middleware:** `persist` with custom MMKV storage
- **MMKV:** `react-native-mmkv` (same instance used for TanStack Query persistence)
- **NetInfo:** `@react-native-community/netinfo`
- **Firebase Auth:** `@react-native-firebase/auth` — `onAuthStateChanged` listener
- **Auth store shape:**
  ```typescript
  interface AuthState {
    user: FirebaseUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: FirebaseUser) => void;
    clearUser: () => void;
    setLoading: (loading: boolean) => void;
    getIdToken: () => Promise<string | null>;
  }
  ```
- **Connectivity store shape:**
  ```typescript
  interface ConnectivityState {
    isOnline: boolean;
    lastOnlineAt: Date | null;
    setOnline: () => void;
    setOffline: () => void;
  }
  ```
- **UI store shape:**
  ```typescript
  interface UIState {
    onboardingComplete: boolean;
    activeApiaryId: string | null;
    setOnboardingComplete: (complete: boolean) => void;
    setActiveApiaryId: (id: string | null) => void;
  }
  ```

### Anti-Patterns to Avoid
- DO NOT persist auth state in MMKV — Firebase manages auth persistence internally; the Zustand store is a reactive mirror
- DO NOT use Zustand for server/API data — that belongs in TanStack Query (Story 5.2)
- DO NOT poll for connectivity — use NetInfo event subscription
- DO NOT put the offline banner inside individual screens — it belongs in the root layout for global visibility
- DO NOT couple store implementations to specific components — stores are consumed via hooks
- DO NOT create a single monolithic store — separate concerns into auth, connectivity, and UI stores
- DO NOT use `AsyncStorage` for persistence — MMKV is significantly faster for React Native

### Project Structure Notes
- Auth store: `apps/mobile/src/store/auth-store.ts`
- Connectivity store: `apps/mobile/src/store/connectivity-store.ts`
- UI store: `apps/mobile/src/store/ui-store.ts`
- MMKV adapter: `apps/mobile/src/store/mmkv-storage.ts`
- Store barrel: `apps/mobile/src/store/index.ts`
- Auth listener: `apps/mobile/src/services/auth/auth-listener.ts`
- Connectivity listener: `apps/mobile/src/services/connectivity/connectivity-listener.ts`
- Offline banner: `apps/mobile/src/features/connectivity/components/OfflineBanner/index.tsx`
- Tests co-located with each store and component file

### References
- [Source: architecture.md#Frontend Architecture — Workflow/UI state in Zustand stores]
- [Source: architecture.md#MVP Connectivity & Caching Strategy — Clear "offline" indicator when connectivity is lost]
- [Source: CLAUDE.md#Offline & Sync Patterns — Offline indicator: Sky Blue banner with cloud-offline icon]
- [Source: CLAUDE.md#Status Semantics — Offline state uses Alert action="info"]
- [Source: CLAUDE.md#Tech Stack Quick Reference — Zustand for UI State]
- [Source: epics.md#Story 5.3 — zustand/middleware for persistence, NetInfo for connectivity]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
