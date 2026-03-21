# Story 11.3: Vision AI Analysis Worker

Status: ready-for-dev

## Story

As a system,
I want a Cloud Run worker that analyzes inspection photos for brood patterns, queen cells, and pest indicators using Gemini Vision,
so that image findings feed into recommendations and provide the beekeeper with AI-assisted visual assessment.

## Acceptance Criteria (BDD)

1. GIVEN a `media-uploaded` Pub/Sub message with `purpose: INSPECTION_PHOTO` and an image storage path WHEN the Vision AI worker receives it THEN the worker downloads the image from Cloud Storage and submits it to Gemini Vision via Vertex AI API with an inspection-specific analysis prompt.
2. GIVEN a Gemini Vision response WHEN the analysis completes successfully THEN structured findings are returned containing: category, finding description, confidence score (0-1), and interpretation text.
3. GIVEN analysis findings with confidence >= 70% WHEN stored THEN the findings are written to `media.analysis_result` as JSONB with status `completed`.
4. GIVEN analysis findings with confidence < 70% WHEN stored THEN the result is marked as `inconclusive` with a message guiding the beekeeper to perform manual visual assessment.
5. GIVEN an inspection photo WHEN analyzed THEN the worker detects and reports on supported categories: brood pattern quality, queen cell presence, pest/disease indicators (varroa, small hive beetle, foulbrood, chalkbrood), honey stores estimate, and frame condition.
6. GIVEN a successful analysis WHEN the worker completes THEN it publishes a message to `embedding-requests` topic with the image storage path for downstream embedding generation.
7. GIVEN a processing failure WHEN the worker cannot analyze the image THEN the message is nacked for retry, and after max delivery attempts it routes to the dead-letter topic. The media record is updated with `processing_failed` status.
8. GIVEN an active inspection WHEN the Vision AI analysis completes THEN the findings are available to the recommendation context assembly service.

## Tasks / Subtasks

- [ ] Implement Pub/Sub subscription handler for Vision AI worker (AC: #1, #7)
  - [ ] Create Cloud Run worker endpoint for `media-uploaded` push subscription
  - [ ] Filter messages by `purpose == INSPECTION_PHOTO` attribute; ack and skip non-image messages
  - [ ] Parse message envelope and validate required fields (eventId, storagePath, entityId, tenantId)
  - [ ] Implement idempotency check by `eventId`
- [ ] Implement Gemini Vision analysis (AC: #1, #2, #5)
  - [ ] Create `apps/api/internal/ai/vision.go` with Gemini Vision client
  - [ ] Design inspection-specific analysis prompt covering all supported categories
  - [ ] Prompt structure: system context (beekeeping inspection), supported categories, required output format (JSON with category, finding, confidence, interpretation)
  - [ ] Download image from Cloud Storage
  - [ ] Submit image + prompt to Gemini Vision via Vertex AI API
  - [ ] Parse structured JSON response into Go types
  - [ ] Validate each finding has category, description, confidence, and interpretation
- [ ] Implement confidence-based result classification (AC: #3, #4)
  - [ ] For findings with confidence >= 0.70: mark as `completed`, store full findings
  - [ ] For findings with confidence < 0.70: mark as `inconclusive`, append guidance message "This analysis is inconclusive. Please review the image manually and note your observations."
  - [ ] Overall analysis status: `completed` if any finding >= 0.70, `inconclusive` if all < 0.70
- [ ] Store analysis results (AC: #3, #4, #8)
  - [ ] Create sqlc queries for updating media record with analysis results
  - [ ] Write to `media.analysis_result` (JSONB): `{ status, findings: [{ category, finding, confidence, interpretation }], analyzed_at, model_version }`
  - [ ] Write to `media.analysis_status`: `completed` | `inconclusive` | `processing_failed`
  - [ ] If inspection is active, update inspection context cache with new findings
- [ ] Publish embedding request (AC: #6)
  - [ ] On successful analysis, publish message to `embedding-requests` topic with image storage path and analysis text for multimodal embedding generation (Story 11.5)
- [ ] Implement error handling and dead-letter queue (AC: #7)
  - [ ] On transient errors (API timeout, rate limit): return nack for Pub/Sub retry
  - [ ] On permanent errors (corrupt image, unsupported format): update media status to `processing_failed`, ack message
  - [ ] Configure dead-letter topic `media-uploaded-vision-dlq` with max delivery attempts (5)
  - [ ] Structured logging with `slog` for all operations
- [ ] Configure infrastructure (AC: #1, #7)
  - [ ] Terraform: Pub/Sub subscription for Vision AI worker on `media-uploaded` topic with filter `attributes.purpose = "INSPECTION_PHOTO"`
  - [ ] Terraform: dead-letter topic with Cloud Monitoring alert on depth > 10
  - [ ] Cloud Run worker: 1 vCPU, 1 GiB memory (image processing needs more), 30s timeout, min 0 instances

## Dev Notes

### Architecture Compliance
- Worker runs as part of the async worker Cloud Run container per architecture.md
- Triggered by `media-uploaded` Pub/Sub topic filtered for image content
- Uses Gemini Vision via Vertex AI API per AI/ML architecture section
- Image embeddings generated via Vertex AI Embedding 2.0 multimodal (shared vector space with text and audio)
- Results stored in PostgreSQL JSONB, not in Cloud Storage
- Analysis feeds recommendation context assembly per recommendation engine architecture
- 80% precision target on expert-labeled validation sets per NFR28; descope to capture-only if beta precision < 70%

### TDD Requirements (Tests First!)
- Test 1: **Pub/Sub message handling** -- Send a valid `media-uploaded` message with `purpose: INSPECTION_PHOTO`; assert worker downloads image and calls Gemini Vision. Mock GCS and Vertex AI.
- Test 2: **Structured findings output** -- Mock Gemini Vision to return findings for brood pattern (90% confidence) and queen cells (75% confidence); assert both findings are parsed with correct category, description, confidence, and interpretation.
- Test 3: **High-confidence storage** -- Mock findings with 85% confidence; assert `media.analysis_result` is written with status `completed` and full findings.
- Test 4: **Low-confidence fallback** -- Mock findings with 60% confidence; assert result is marked `inconclusive` with manual assessment guidance message.
- Test 5: **Supported categories** -- Mock Vision response covering brood pattern, queen cells, pest indicators, honey stores, frame condition; assert all categories are correctly parsed.
- Test 6: **Embedding request published** -- After successful analysis, assert a message is published to `embedding-requests` topic with image path.
- Test 7: **Dead-letter on failure** -- Mock Gemini Vision to fail permanently; assert message routes to DLQ after max retries, media record updated to `processing_failed`.
- Test 8: **Idempotency** -- Send same `eventId` twice; assert analysis runs only once.
- Test 9: **Prompt validation** -- Assert the analysis prompt includes all supported categories and requests structured JSON output format.

### Technical Specifications
- **Vision Model:** Gemini Vision via Vertex AI API (model selection: `gemini-2.0-flash` for speed, `gemini-2.0-pro` for complex analysis)
- **Image format:** HEIC/WebP, max 2048px (pre-compressed by client per Story 11.1)
- **Analysis categories:** brood_pattern, queen_cells, pest_disease, honey_stores, frame_condition
- **Confidence threshold:** 70% for conclusive findings; below 70% marked inconclusive
- **Precision target:** 80% on expert-labeled validation sets (NFR28)
- **Max photos per inspection:** 5 in MVP (cost cap)
- **Processing target:** < 5 seconds per image (NFR5)
- **Go SDK:** `cloud.google.com/go/aiplatform` for Vertex AI, `cloud.google.com/go/storage` for GCS
- **Result schema (JSONB):**
  ```json
  {
    "status": "completed|inconclusive",
    "findings": [
      {
        "category": "brood_pattern",
        "finding": "Solid brood pattern with minimal gaps",
        "confidence": 0.92,
        "interpretation": "Healthy laying pattern indicates productive queen"
      }
    ],
    "analyzed_at": "2026-03-21T10:00:00Z",
    "model_version": "gemini-2.0-flash"
  }
  ```

### Anti-Patterns to Avoid
- DO NOT perform synchronous Vision AI analysis from the GraphQL API -- all analysis is async via the worker
- DO NOT skip confidence thresholding -- low-confidence findings must be clearly marked inconclusive
- DO NOT return raw model output to the user -- always parse into structured findings with interpretations
- DO NOT process non-image messages -- filter by `purpose` attribute
- DO NOT skip idempotency checks -- Pub/Sub may deliver messages more than once
- DO NOT store the image itself in PostgreSQL -- only store analysis results (JSONB) and reference the GCS path
- DO NOT use a separate embedding model for images -- use Vertex AI Embedding 2.0 multimodal (same model as text/audio)
- DO NOT exceed 5 photos per inspection in MVP to control costs

### Project Structure Notes
- Vision AI client: `apps/api/internal/ai/vision.go`
- Analysis prompt: `apps/api/internal/ai/prompts/inspection_photo.go`
- Result types: `apps/api/internal/ai/types.go`
- Repository: `apps/api/internal/repository/media.go` (analysis result update queries)
- Event publisher: `apps/api/internal/event/publisher.go`
- Terraform: `infra/terraform/modules/pubsub/main.tf` (subscription, DLQ)

### References
- [Source: architecture.md#AI/ML Architecture -- Vision AI for Inspection Photos]
- [Source: architecture.md#Infrastructure & Deployment -- Async worker service]
- [Source: architecture.md#Event Architecture -- media-uploaded topic]
- [Source: architecture.md#Integration Points -- Media upload pipeline]
- [Source: epics.md#Epic 11 -- Story 11.3]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
