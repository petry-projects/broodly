# Story 8.4: Photo Capture and Attachment

Status: ready-for-dev

## Story

As a beekeeper,
I want to photograph brood frames and attach images to observation steps during inspection,
so that I have a visual record and can later request AI-assisted interpretation.

## Acceptance Criteria (BDD)

1. GIVEN I am on an inspection step WHEN I tap the camera button THEN the InspectionImageCapture component opens the device camera with a capture prompt and optional framing guide overlay.
2. GIVEN I capture a photo WHEN the image is taken THEN it is compressed to HEIC (iOS) or WebP (Android) format before any upload attempt.
3. GIVEN a compressed photo WHEN the device has network connectivity THEN the image is uploaded to Cloud Storage (`broodly-media-{env}`) via a signed URL and the GCS URI is stored as observation evidence.
4. GIVEN a captured photo WHEN the device is offline THEN the image is queued locally with a visible "Will upload when online" label and the inspection can continue.
5. GIVEN the camera permission has not been granted WHEN the user first taps the camera button THEN a permission request is shown with purpose messaging: "Camera access lets you photograph frames for visual records and AI analysis."
6. GIVEN a photo is attached to an observation WHEN the step renders THEN a thumbnail preview of the image is displayed within the observation card.
7. GIVEN multiple photos are captured on a single step WHEN the user reviews THEN all thumbnails are visible in a horizontal scroll row with the ability to remove individual images.
8. GIVEN an image upload fails (non-offline) WHEN the error occurs THEN a retry button is shown alongside the thumbnail with an error indicator.

## Tasks / Subtasks

- [ ] Build InspectionImageCapture component (AC: #1, #5)
  - [ ] Create `apps/mobile/src/features/inspection/components/InspectionImageCapture/index.tsx`
  - [ ] Use `expo-camera` or `expo-image-picker` for camera integration
  - [ ] Implement framing guide overlay (semi-transparent frame border to help center brood frame)
  - [ ] Implement capture prompt text: "Center the frame in the guide"
  - [ ] Handle camera permission with trust-first messaging
  - [ ] Built on Gluestack `Box` + `Pressable` per CLAUDE.md component mapping
- [ ] Implement image compression service (AC: #2)
  - [ ] Create `apps/mobile/src/features/inspection/services/imageCompressionService.ts`
  - [ ] Compress to HEIC on iOS, WebP on Android using `expo-image-manipulator`
  - [ ] Target quality: ~80% for balance of size and clarity
  - [ ] Log original and compressed file sizes for monitoring
- [ ] Implement image upload service (AC: #3, #4, #8)
  - [ ] Create `apps/mobile/src/features/inspection/services/imageUploadService.ts`
  - [ ] Request signed URL from API via GraphQL mutation (`getMediaUploadUrl`)
  - [ ] Upload compressed image to Cloud Storage via signed URL (15-minute expiry)
  - [ ] On success: store GCS URI in observation record as evidence
  - [ ] On offline: queue file locally with metadata, show "Will upload when online" label
  - [ ] On upload failure: show retry button with error indicator on thumbnail
  - [ ] Cloud Storage notification auto-triggers `media-uploaded` Pub/Sub topic
- [ ] Build image thumbnail preview (AC: #6, #7)
  - [ ] Create `apps/mobile/src/features/inspection/components/ImageThumbnailRow/index.tsx`
  - [ ] Display attached images as thumbnails in horizontal `<ScrollView>`
  - [ ] Each thumbnail is tappable to view full-size
  - [ ] Remove button (X icon) on each thumbnail to detach image
  - [ ] Show upload status per image: uploading (spinner), uploaded (checkmark), queued (clock icon), failed (retry icon)
- [ ] Integrate with InspectionStepScreen (AC: #6)
  - [ ] Add camera button to observation step UI (secondary button, not competing with voice FAB)
  - [ ] Attach captured images to current step's observation record
  - [ ] Store image references (local URI + GCS URI when available) in inspectionStore

## Dev Notes

### Architecture Compliance
- Image upload follows the same signed URL pattern as audio: client -> signed URL from API -> Cloud Storage -> `media-uploaded` Pub/Sub topic
- Compression before upload per architecture.md: HEIC/WebP for images
- Object storage bucket: `broodly-media-{env}` with lifecycle rules per architecture.md
- InspectionImageCapture is a custom domain component built on `Box` + `Pressable` per CLAUDE.md component mapping
- Camera permission deferred to first use (not requested during onboarding) per UX spec

### TDD Requirements (Tests First!)
- Test 1: **Camera button renders** — Render InspectionStepScreen and assert a camera button is present with correct accessibilityLabel.
- Test 2: **Image compression** — Given a mock image file, call imageCompressionService and assert output format is HEIC or WebP with reduced file size.
- Test 3: **Image upload via signed URL** — Mock the signed URL API and assert the image is uploaded to the correct GCS path with correct content type.
- Test 4: **Offline queueing** — Given no connectivity, capture a photo and assert it is queued locally with "Will upload when online" metadata.
- Test 5: **Thumbnail display** — Attach 2 images to an observation step and assert 2 thumbnails render in a horizontal row.
- Test 6: **Thumbnail removal** — Tap the remove button on a thumbnail and assert the image is detached from the observation record.
- Test 7: **Upload failure retry** — Simulate an upload failure and assert a retry button appears on the affected thumbnail.
- Test 8: **Permission request** — Simulate no camera permission and tap camera button; assert purpose messaging is displayed.

### Technical Specifications
- **Image formats:** HEIC (iOS), WebP (Android) via `expo-image-manipulator`
- **Compression quality:** ~80%
- **Signed URL expiry:** 15 minutes per architecture.md
- **Storage bucket:** `broodly-media-{env}`
- **Pub/Sub topic:** `media-uploaded` (triggered by Cloud Storage notification)
- **Gluestack components:** `Box`, `Pressable`, `Image`, `Spinner`, `Text`, `Button`, `ButtonText`, `HStack`, `ScrollView`
- **Camera library:** `expo-camera` or `expo-image-picker` (prefer `expo-image-picker` for simplicity in MVP)
- **Touch targets:** Camera button minimum 48x48px
- **Thumbnail size:** 64x64px with 8px spacing

### Anti-Patterns to Avoid
- DO NOT upload uncompressed images — always compress before upload per architecture.md
- DO NOT block the inspection flow on image upload — queue and continue
- DO NOT request camera permission during onboarding — defer to first camera use per UX spec
- DO NOT trigger analysis from the client in this story — analysis integration is Story 8.5
- DO NOT discard local images after upload failure — keep them queued for retry
- DO NOT compete with the voice FAB for screen real estate — camera button is secondary to voice

### Project Structure Notes
- `apps/mobile/src/features/inspection/components/InspectionImageCapture/index.tsx`
- `apps/mobile/src/features/inspection/components/ImageThumbnailRow/index.tsx`
- `apps/mobile/src/features/inspection/services/imageCompressionService.ts`
- `apps/mobile/src/features/inspection/services/imageUploadService.ts`

### References
- [Source: epics.md#Story 8.4 — Photo and Image Capture with Vision AI Analysis]
- [Source: ux-design-specification.md#Vision AI Components — InspectionImageCapture]
- [Source: CLAUDE.md#Custom Domain Components — InspectionImageCapture]
- [Source: CLAUDE.md#Asset Handling — Compress before upload]
- [Source: CLAUDE.md#Offline & Sync Patterns — Image upload failure queuing]
- [Source: architecture.md#Object storage — Cloud Storage signed URLs]
- [Source: architecture.md#Infrastructure — broodly-media-{env}]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
