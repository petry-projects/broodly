# Story 11.1: Cloud Storage Upload with Signed URLs

Status: ready-for-dev

## Story

As a mobile app,
I want to upload audio and image files to Cloud Storage via short-lived signed URLs,
so that media is stored securely without exposing bucket credentials to the client.

## Acceptance Criteria (BDD)

1. GIVEN a logged-in user WHEN they request a media upload URL via `generateUploadUrl(contentType, purpose)` THEN the API returns a signed URL and storage path with a 15-minute expiry.
2. GIVEN a valid signed URL WHEN the client uploads a file within the expiry window THEN the file is stored in the `broodly-media-{env}` Cloud Storage bucket at the returned storage path.
3. GIVEN an expired signed URL WHEN the client attempts an upload THEN the request is rejected with HTTP 403 and the client receives a clear error indicating URL expiry.
4. GIVEN a successful upload to Cloud Storage WHEN the file lands in the bucket THEN a Cloud Storage notification fires and publishes a message to the `media-uploaded` Pub/Sub topic containing the storage path, content type, purpose, user ID, and associated entity ID.
5. GIVEN a failed upload attempt (network error, timeout) WHEN the client detects the failure THEN the upload is queued locally with a "will upload when online" state and retried with exponential backoff (max 3 retries, base 2s).
6. GIVEN media captured on device WHEN preparing for upload THEN images are compressed to HEIC/WebP (max 2048px) and audio is encoded in opus format before upload.
7. GIVEN a `media-uploaded` Pub/Sub message WHEN received by subscribers THEN the message envelope contains `eventId`, `eventType`, `occurredAt`, `tenantId`, `payloadVersion`, and `payload` fields per the event contract.

## Tasks / Subtasks

- [ ] Implement GraphQL mutation `generateUploadUrl` in Go API (AC: #1)
  - [ ] Define GraphQL schema: `generateUploadUrl(input: GenerateUploadUrlInput!): UploadUrlPayload!`
  - [ ] Input type: `contentType: String!`, `purpose: MediaPurpose!` (enum: INSPECTION_PHOTO, VOICE_NOTE, HIVE_AUDIO), `entityId: ID!`, `entityType: EntityType!`
  - [ ] Return type: `signedUrl: String!`, `storagePath: String!`, `expiresAt: DateTime!`
  - [ ] Implement resolver calling `cloud.google.com/go/storage` to generate V4 signed URL with 15-minute expiry
  - [ ] Storage path format: `{env}/{tenantId}/{purpose}/{entityId}/{uuid}.{ext}`
  - [ ] Validate user authorization (owner or collaborator on associated entity)
- [ ] Configure Cloud Storage bucket and notifications (AC: #4, #7)
  - [ ] Terraform: define `broodly-media-{env}` bucket with lifecycle rules (Nearline after 90 days, Archive after 1 year)
  - [ ] Terraform: configure Cloud Storage notification on object finalize to publish to `media-uploaded` Pub/Sub topic
  - [ ] Pub/Sub message includes custom attributes: `contentType`, `purpose`, `userId`, `entityId`, `entityType`
  - [ ] Message envelope follows project event contract with `eventId`, `eventType: media.uploaded.v1`, `occurredAt`, `tenantId`, `payloadVersion: 1`
- [ ] Implement client-side media upload service (AC: #2, #3, #5, #6)
  - [ ] Create `apps/mobile/src/services/media-upload.ts` with `uploadMedia()` function
  - [ ] Call `generateUploadUrl` mutation to obtain signed URL
  - [ ] Compress images (HEIC/WebP, max 2048px) using `expo-image-manipulator`
  - [ ] Verify audio encoding is opus format from `expo-av` recording config
  - [ ] Upload file via HTTP PUT to signed URL with correct `Content-Type` header
  - [ ] Implement retry with exponential backoff (base 2s, max 3 retries, jitter)
  - [ ] On persistent failure, stage file locally via `expo-file-system` with upload-pending metadata
- [ ] Implement local upload queue for offline/failed uploads (AC: #5)
  - [ ] Create Zustand store slice for pending uploads: `{ id, localPath, contentType, purpose, entityId, status, retryCount, lastAttempt }`
  - [ ] On connectivity restore, dequeue and retry pending uploads in FIFO order
  - [ ] Display "will upload when online" indicator per queued item
- [ ] Add sqlc query and repository method to record media metadata (AC: #4)
  - [ ] Insert media record: `id`, `tenant_id`, `user_id`, `entity_id`, `entity_type`, `storage_path`, `content_type`, `purpose`, `upload_status`, `created_at`
  - [ ] Update upload status on confirmation (pending -> uploaded)

## Dev Notes

### Architecture Compliance
- Cloud Storage bucket `broodly-media-{env}` per architecture.md infrastructure section
- Signed URLs with 15-minute expiry per architecture.md object storage spec
- Cloud Storage notification triggers `media-uploaded` Pub/Sub topic per event architecture
- Media upload is the entry point for the entire async processing pipeline (STT, Vision AI, Acoustic, Embedding)
- Go API generates signed URLs server-side; client never holds service account credentials
- All async processing triggered downstream via Pub/Sub, not direct API calls

### TDD Requirements (Tests First!)
- Test 1: **Signed URL generation** -- Call `generateUploadUrl` resolver with valid inputs; assert returned URL contains correct bucket, path pattern, and expiry within 15 minutes. Mock `storage.Client.Bucket().SignedURL()`.
- Test 2: **Signed URL upload success** -- Integration test: upload a small test file to a signed URL; assert HTTP 200 and file exists at storage path. Use testcontainers or GCS emulator.
- Test 3: **Expired URL rejection** -- Generate a signed URL, wait or use a past expiry, attempt upload; assert HTTP 403 response.
- Test 4: **Pub/Sub notification** -- Upload a file to GCS (emulated); assert a message appears on the `media-uploaded` topic with correct attributes (contentType, purpose, userId, entityId).
- Test 5: **Client retry on failure** -- Mock upload to fail twice then succeed; assert exponential backoff timing and final success. Assert retry count incremented.
- Test 6: **Local queue on persistent failure** -- Mock upload to fail beyond max retries; assert file is queued locally with upload-pending status.
- Test 7: **Media compression** -- Provide a large image; assert output is WebP/HEIC and max dimension is 2048px. Provide audio; assert opus encoding.

### Technical Specifications
- **Cloud Storage SDK:** `cloud.google.com/go/storage` for server-side signed URL generation
- **Signed URL method:** V4 signing with `storage.SignedURLOptions{ Method: "PUT", Expires: 15min, ContentType: contentType }`
- **Bucket naming:** `broodly-media-{env}` where env is dev/staging/prod
- **Storage path:** `{env}/{tenantId}/{purpose}/{entityId}/{uuidv7}.{ext}`
- **Lifecycle rules:** Nearline after 90 days, Archive after 1 year
- **Client upload:** HTTP PUT with `Content-Type` header matching signed URL content type
- **Image compression:** HEIC or WebP, max 2048px longest dimension via `expo-image-manipulator`
- **Audio format:** opus via `expo-av` recording configuration
- **Pub/Sub topic:** `media-uploaded` with Cloud Storage notification as publisher
- **Event type:** `media.uploaded.v1`
- **Max file size:** 50MB (enforced via signed URL conditions)

### Anti-Patterns to Avoid
- DO NOT expose Cloud Storage service account credentials to the mobile client
- DO NOT use long-lived signed URLs -- 15-minute expiry is the maximum
- DO NOT skip compression before upload -- raw camera images waste bandwidth and storage
- DO NOT poll for upload completion from the client -- the async pipeline handles downstream processing
- DO NOT store media files in PostgreSQL -- all binary media goes to Cloud Storage
- DO NOT create separate Pub/Sub topics per media type -- use `media-uploaded` with attributes for routing
- DO NOT skip the event envelope contract -- all Pub/Sub messages must include `eventId`, `eventType`, `occurredAt`, `tenantId`, `payloadVersion`

### Project Structure Notes
- GraphQL schema: `apps/api/graph/schema/media.graphql`
- Go resolver: `apps/api/graph/resolver/media_resolver.go`
- Go storage service: `apps/api/internal/service/media.go`
- Go repository: `apps/api/internal/repository/media.go`
- Mobile upload service: `apps/mobile/src/services/media-upload.ts`
- Mobile upload queue store: `apps/mobile/src/store/upload-queue.ts`
- Terraform: `infra/terraform/modules/storage/main.tf`, `infra/terraform/modules/pubsub/main.tf`

### References
- [Source: architecture.md#Data Architecture -- Object storage]
- [Source: architecture.md#API & Communication Patterns -- Voice payload]
- [Source: architecture.md#Infrastructure & Deployment -- Object storage]
- [Source: architecture.md#Event Architecture -- media-uploaded topic]
- [Source: architecture.md#Frontend Architecture -- Performance: media compression]
- [Source: epics.md#Epic 11 -- Story 11.1]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
