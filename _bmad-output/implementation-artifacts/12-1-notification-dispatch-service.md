# Story 12.1: Notification Dispatch Service

Status: ready-for-dev

## Story

As a system,
I want a notification dispatch worker that receives events from the Cloud Pub/Sub `notification-dispatch` topic and delivers push notifications via Firebase Cloud Messaging,
so that users receive timely, actionable alerts about their hives with contextual reason and recommended next step.

## Acceptance Criteria (BDD)

1. GIVEN a message published to the `notification-dispatch` Pub/Sub topic WHEN the worker receives it THEN it extracts the notification payload (title, body, deep link, priority level, target user ID) and delivers a push notification via FCM.
2. GIVEN a notification payload WHEN the push notification is composed THEN it includes a title, contextual reason, recommended next step, and a deep link to the relevant screen (FR43).
3. GIVEN a notification with priority level `high` WHEN delivered via FCM THEN the FCM message uses `priority: high` and `android.priority: high` / `apns-push-type: alert` headers.
4. GIVEN a notification with priority level `low` or `medium` WHEN delivered via FCM THEN the FCM message uses default priority.
5. GIVEN an FCM delivery failure WHEN the worker processes the message THEN it retries with exponential backoff (max 3 retries, base 2s) before sending to dead-letter topic.
6. GIVEN a successful or failed notification delivery WHEN the delivery attempt completes THEN an audit event is written to the `notification_audit` table with: notification_id, user_id, delivery_status, fcm_message_id, attempted_at, error_detail (nullable).
7. GIVEN multiple notifications for the same user within a 5-minute window WHEN they share the same apiary THEN they are bundled into a single summary notification rather than sent individually.
8. GIVEN a Pub/Sub message with an invalid or incomplete payload WHEN the worker processes it THEN the message is nacked to the dead-letter topic and an error is logged with the malformed payload details.

## Tasks / Subtasks

- [ ] Create `notification_audit` database table and migration (AC: #6)
  - [ ] Schema: id (UUID), user_id (FK), notification_type, title, body, deep_link, priority_level, delivery_status (pending/delivered/failed), fcm_message_id, attempted_at, error_detail, created_at
  - [ ] Index on (user_id, created_at) for notification history queries
  - [ ] Write sqlc queries: InsertNotificationAudit, ListNotificationsByUser, UpdateDeliveryStatus
- [ ] Implement Pub/Sub subscriber for `notification-dispatch` topic (AC: #1, #8)
  - [ ] Create `internal/event/notification_subscriber.go` with push subscription handler
  - [ ] Define `NotificationDispatchMessage` struct: user_id, title, body, reason, next_step, deep_link, priority, apiary_id, notification_type
  - [ ] Validate incoming message payload; nack invalid messages to DLQ
  - [ ] Register subscriber endpoint in worker `cmd/worker/main.go`
- [ ] Implement FCM delivery client (AC: #1, #3, #4)
  - [ ] Create `internal/service/notification_sender.go` with `NotificationSender` interface
  - [ ] Implement `FCMNotificationSender` using `firebase.google.com/go/v4/messaging`
  - [ ] Map priority levels to FCM platform-specific priority headers (Android high/normal, APNs alert/background)
  - [ ] Compose FCM message with: title, body (reason + next step), deep link in data payload, notification display payload
- [ ] Implement retry logic with exponential backoff (AC: #5)
  - [ ] Wrap FCM send in retry loop: max 3 attempts, base 2s, jitter
  - [ ] On exhausted retries, nack Pub/Sub message to dead-letter topic
  - [ ] Log each retry attempt with attempt number and error
- [ ] Implement notification bundling logic (AC: #7)
  - [ ] Use Cloud Memorystore (Redis) to track recent notifications per user+apiary with 5-minute TTL
  - [ ] On new notification, check if pending bundle exists; if so, append to bundle
  - [ ] Cloud Tasks delayed delivery: schedule bundle flush after 5-minute window
  - [ ] Bundle summary: "X alerts for [Apiary Name]" with deep link to notification center
- [ ] Implement audit logging (AC: #6)
  - [ ] Write audit record before FCM send attempt (status: pending)
  - [ ] Update audit record after delivery (status: delivered or failed)
  - [ ] Include fcm_message_id on success, error_detail on failure
- [ ] Configure Expo push notification setup (AC: #1)
  - [ ] Document iOS APNs key configuration for FCM
  - [ ] Document Android FCM sender ID configuration
  - [ ] Add `expo-notifications` dependency to `apps/mobile/package.json`
  - [ ] Create `apps/mobile/src/services/pushNotificationService.ts` for device token registration

## Dev Notes

### Architecture Compliance
- Worker runs as a separate Cloud Run service subscribed to the `notification-dispatch` Pub/Sub topic (architecture.md: Async worker service)
- Uses `firebase.google.com/go/v4/messaging` Go SDK for FCM delivery
- Dead-letter topic for failed messages with Cloud Monitoring alerts on DLQ depth (architecture.md: Event infrastructure)
- Audit events follow the project-wide audit pattern: structured, queryable, never deleted
- Notification ownership is separate from recommendation, inspection, and planning domains (architecture.md: Domain ownership)

### TDD Requirements (Tests First!)
- Test 1: **Pub/Sub message parsing** -- Unit test that a valid `NotificationDispatchMessage` JSON is correctly deserialized. Test that invalid/missing fields return a validation error.
- Test 2: **FCM message composition** -- Unit test that given a dispatch message with priority `high`, the FCM message has correct platform-specific priority headers. Test `low`/`medium` use default priority.
- Test 3: **Retry behavior** -- Unit test with a mock FCM sender that fails twice then succeeds. Assert 3 attempts made with increasing delays. Test exhausted retries result in nack.
- Test 4: **Audit record lifecycle** -- Integration test that processing a notification creates an audit record with status `pending`, then updates to `delivered` on success (or `failed` on error).
- Test 5: **Bundling logic** -- Unit test that two notifications for the same user+apiary within 5 minutes produce one bundled notification. Test that notifications for different apiaries are sent separately.
- Test 6: **Deep link inclusion** -- Unit test that FCM data payload includes the deep link URL matching the dispatch message.
- Test 7: **Malformed message handling** -- Unit test that a message with missing user_id is nacked and logged.

### Technical Specifications
- **Pub/Sub topic:** `notification-dispatch` (already provisioned in Story 1.4 Terraform baseline)
- **Dead-letter topic:** `notification-dispatch-dlq` (add to Terraform)
- **FCM SDK:** `firebase.google.com/go/v4` with `messaging` package
- **Retry policy:** max 3 attempts, exponential backoff base 2s with jitter (0-500ms)
- **Bundling window:** 5 minutes, tracked via Redis key `notif:bundle:{user_id}:{apiary_id}` with TTL
- **Cloud Tasks queue:** `notification-bundle-flush` for delayed bundle delivery
- **Audit table:** `notification_audit` in Cloud SQL PostgreSQL
- **Expo notifications:** `expo-notifications` SDK for device token registration and local notification handling

### Anti-Patterns to Avoid
- DO NOT call FCM synchronously from the API service -- all notification delivery goes through Pub/Sub
- DO NOT retry indefinitely -- cap at 3 retries then dead-letter
- DO NOT skip audit logging on any code path -- every send attempt must be recorded
- DO NOT send notifications without checking user preferences (handled in Story 12.3, but the dispatch message should include a `preferences_checked: true` flag set by the publisher)
- DO NOT hardcode FCM credentials -- use GCP service account with IAM roles
- DO NOT process Pub/Sub messages without idempotency -- use notification_id as deduplication key in Redis

### Project Structure Notes
- `apps/api/internal/event/notification_subscriber.go` -- Pub/Sub push subscription handler
- `apps/api/internal/service/notification_sender.go` -- `NotificationSender` interface + `FCMNotificationSender`
- `apps/api/internal/service/notification_bundler.go` -- Bundling logic with Redis
- `apps/api/internal/repository/notification_audit.go` -- sqlc-generated audit queries
- `apps/api/migrations/XXXXXX_create_notification_audit.sql` -- Migration
- `apps/mobile/src/services/pushNotificationService.ts` -- Device token registration + local notification handler

### References
- [Source: architecture.md#Event Architecture: Cloud Pub/Sub -- `notification-dispatch` topic]
- [Source: architecture.md#Deployment & Infrastructure -- Async worker service]
- [Source: epics.md#Story 12.1: Notification Dispatch Worker]
- [Source: prd.md#FR39 -- Actionable notifications tied to seasonal and operational risk]
- [Source: prd.md#FR43 -- Notifications include contextual reason and recommended next step]
- [Source: CLAUDE.md#Tech Stack Quick Reference]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
