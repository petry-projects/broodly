# Story 12.2: Notification Center UI

Status: ready-for-dev

## Story

As a user,
I want an in-app notification center accessible from the home screen that displays recent alerts using ActionableNotificationCards with contextual information, status-appropriate styling, and navigation to relevant screens,
so that I can review what needs my attention and take action directly from notifications.

## Acceptance Criteria (BDD)

1. GIVEN the home screen WHEN I tap the notification bell icon THEN the NotificationCenter drawer slides open from the right displaying recent notifications in reverse chronological order.
2. GIVEN the NotificationCenter is open WHEN notifications are present THEN each notification renders as an ActionableNotificationCard showing: title, contextual reason, recommended action, and timestamp.
3. GIVEN an ActionableNotificationCard WHEN it has a status of `warning` THEN it uses `action="warning"` styling with warning color tokens and appropriate icon. Similarly for `success`, `error`, and `info` statuses.
4. GIVEN an ActionableNotificationCard WHEN I tap on it THEN the app navigates to the relevant hive, inspection, or task screen via the deep link and the notification is marked as read.
5. GIVEN unread notifications exist WHEN I view the bottom navigation bar THEN the notification bell icon shows an unread count badge with the number of unread notifications.
6. GIVEN the NotificationCenter is open WHEN I tap "Mark all as read" THEN all notifications are marked as read and the unread count badge is cleared.
7. GIVEN no notifications exist WHEN I open the NotificationCenter THEN an empty state is displayed with the message "No notifications yet" and a brief explanation.
8. GIVEN the notification list WHEN I scroll to the bottom THEN older notifications are loaded via pagination (cursor-based, 20 per page).
9. GIVEN the app is in the foreground WHEN a push notification arrives THEN the unread count badge updates without requiring a manual refresh.

## Tasks / Subtasks

- [ ] Add GraphQL schema for notification queries (AC: #1, #8)
  - [ ] Define `Notification` type: id, title, body, reason, nextStep, deepLink, status (success/warning/error/info), priority, readAt, createdAt
  - [ ] Define `notifications` query with cursor-based pagination: first, after, returns `NotificationConnection` (edges, pageInfo)
  - [ ] Define `markNotificationRead` mutation (single ID)
  - [ ] Define `markAllNotificationsRead` mutation
  - [ ] Define `unreadNotificationCount` query
  - [ ] Generate Go resolvers via gqlgen and TypeScript types via codegen
- [ ] Implement Go resolvers for notification queries (AC: #1, #4, #6, #8)
  - [ ] `notifications` resolver: query `notification_audit` table filtered by user_id, ordered by created_at DESC, cursor pagination
  - [ ] `markNotificationRead` resolver: update `read_at` timestamp
  - [ ] `markAllNotificationsRead` resolver: bulk update `read_at` for user
  - [ ] `unreadNotificationCount` resolver: COUNT where read_at IS NULL
  - [ ] Add `read_at` column to `notification_audit` table (migration)
- [ ] Implement NotificationCenter drawer component (AC: #1, #7)
  - [ ] Create `apps/mobile/src/features/notifications/components/NotificationCenter/index.tsx`
  - [ ] Use Gluestack `<Drawer>` component per CLAUDE.md mapping
  - [ ] Include `<Heading size="2xl">` for "Notifications" title
  - [ ] Include "Mark all as read" button (`<Button action="secondary" variant="link">`)
  - [ ] Implement empty state with illustration and message
  - [ ] Use `<VStack>` layout with `<Divider>` between items per CLAUDE.md
- [ ] Implement ActionableNotificationCard component (AC: #2, #3)
  - [ ] Create `packages/ui/src/ActionableNotificationCard/index.tsx`
  - [ ] Build on Gluestack `<Card variant="outline">` per CLAUDE.md component mapping
  - [ ] Implement `tva()` variants for action: success | warning | error | info
  - [ ] Display: title (`<Heading size="lg">`), reason (`<Text size="md">`), recommended action (`<Text size="sm">`), timestamp (`<Text size="xs">`)
  - [ ] Include status-appropriate icon via `<Badge>` with matching action
  - [ ] Status always includes icon + text + color (never color alone, per CLAUDE.md)
  - [ ] Export from `packages/ui/src/index.ts`
- [ ] Implement notification navigation on tap (AC: #4)
  - [ ] Parse deep link from notification data
  - [ ] Use Expo Router `router.push()` to navigate to target screen
  - [ ] Call `markNotificationRead` mutation on tap
- [ ] Implement unread count badge (AC: #5, #9)
  - [ ] Create `apps/mobile/src/features/notifications/hooks/useUnreadCount.ts`
  - [ ] TanStack Query hook for `unreadNotificationCount` with 30-second polling interval
  - [ ] Render badge on bottom tab notification icon using `<Badge action="error"><BadgeText>{count}</BadgeText></Badge>`
  - [ ] Invalidate query on push notification receipt (foreground)
- [ ] Implement pagination (AC: #8)
  - [ ] Use TanStack Query `useInfiniteQuery` for cursor-based pagination
  - [ ] Load 20 notifications per page
  - [ ] "Load more" triggered by scroll-to-bottom via `<FlatList onEndReached>`
- [ ] Handle foreground push notification updates (AC: #9)
  - [ ] Listen for `expo-notifications` foreground events
  - [ ] Invalidate `unreadNotificationCount` TanStack Query on receipt
  - [ ] Optionally show in-app toast for high-priority notifications

## Dev Notes

### Architecture Compliance
- NotificationCenter uses `<Drawer>` component per CLAUDE.md custom domain component mapping
- ActionableNotificationCard uses `<Card variant="outline">` with `tva()` action variants per CLAUDE.md
- State management: TanStack Query for server state (notification list, unread count), no Zustand needed for this feature
- Navigation uses Expo Router deep linking pattern
- GraphQL schema-first: define types in `.graphql` files, generate resolvers and client types

### TDD Requirements (Tests First!)
- Test 1: **NotificationCenter render** -- Render NotificationCenter with mock notification data. Assert it displays a list of ActionableNotificationCards in reverse chronological order.
- Test 2: **ActionableNotificationCard variants** -- Render ActionableNotificationCard with each status (success, warning, error, info). Assert correct Gluestack action prop and icon are applied.
- Test 3: **Tap navigation** -- Simulate tap on an ActionableNotificationCard with deep link `/hive/123`. Assert `router.push` called with `/hive/123` and `markNotificationRead` mutation fired.
- Test 4: **Unread count badge** -- Render bottom tab with mock unread count of 5. Assert badge displays "5". Mock count of 0, assert badge is hidden.
- Test 5: **Empty state** -- Render NotificationCenter with empty notification list. Assert empty state message is displayed.
- Test 6: **Mark all read** -- Simulate tap on "Mark all as read". Assert `markAllNotificationsRead` mutation called and unread count invalidated.
- Test 7: **Pagination** -- Mock initial page of 20 notifications and second page. Assert `useInfiniteQuery` loads next page on scroll.
- Test 8: **Go resolver** -- Integration test: insert 3 notification_audit records, query via `notifications` resolver, assert correct order and fields returned.

### Technical Specifications
- **Drawer component:** Gluestack `<Drawer>` with `<DrawerContent>`, `<VStack>`, `<Heading>`, `<Divider>`
- **Card component:** Gluestack `<Card variant="outline">` with `tva()` action variants
- **Badge:** Gluestack `<Badge action="error">` for unread count overlay
- **Pagination:** Cursor-based, 20 items per page, TanStack `useInfiniteQuery`
- **Polling:** `unreadNotificationCount` polled every 30 seconds via `refetchInterval`
- **Minimum touch target:** 48x48px for all interactive elements (CLAUDE.md)
- **Accessibility:** Each card announces title, status, reason, and recommended action in reading order. Drawer announces "Notifications" on open.

### Anti-Patterns to Avoid
- DO NOT use `<AlertDialog>` for notifications -- notifications are non-blocking (CLAUDE.md: warnings are always non-blocking inline indicators)
- DO NOT use color alone to indicate status -- always pair with icon and text (CLAUDE.md: Status semantics)
- DO NOT hardcode hex colors -- use Gluestack design tokens (CLAUDE.md: Color Token System)
- DO NOT create notification components in `apps/mobile/` -- ActionableNotificationCard is a shared UI component in `packages/ui/`
- DO NOT use offset-based pagination -- use cursor-based for real-time data consistency
- DO NOT skip accessibility labels -- each card must have a complete accessible description

### Project Structure Notes
- `packages/ui/src/ActionableNotificationCard/index.tsx` -- Shared ActionableNotificationCard component
- `packages/ui/src/ActionableNotificationCard/ActionableNotificationCard.test.tsx` -- Component tests
- `apps/mobile/src/features/notifications/components/NotificationCenter/index.tsx` -- Feature-specific drawer
- `apps/mobile/src/features/notifications/hooks/useNotifications.ts` -- TanStack Query hook for notification list
- `apps/mobile/src/features/notifications/hooks/useUnreadCount.ts` -- TanStack Query hook for unread count
- `apps/api/graph/schema/notification.graphql` -- GraphQL schema additions
- `apps/api/graph/resolver/notification_resolver.go` -- Go resolvers
- `apps/api/migrations/XXXXXX_add_read_at_to_notification_audit.sql` -- Migration

### References
- [Source: CLAUDE.md#Custom Domain Components -- NotificationCenter: Drawer, ActionableNotificationCard: Card (outline)]
- [Source: CLAUDE.md#Status Semantics -- Gluestack Action Mapping]
- [Source: CLAUDE.md#Button Hierarchy -- Secondary and Tertiary patterns]
- [Source: epics.md#Story 12.2: Notification Center UI]
- [Source: prd.md#FR39 -- Actionable notifications]
- [Source: prd.md#FR43 -- Contextual reason and recommended next step]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
