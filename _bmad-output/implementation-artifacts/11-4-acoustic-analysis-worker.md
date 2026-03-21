# Story 11.4: Acoustic Analysis Worker

Status: ready-for-dev

## Story

As a system,
I want a Cloud Run worker that analyzes hive audio recordings for colony-state signals such as queenright status, agitation level, and swarm readiness,
so that acoustic data enriches the recommendation context with non-visual indicators of colony health.

## Acceptance Criteria (BDD)

1. GIVEN a `media-uploaded` Pub/Sub message with `purpose: HIVE_AUDIO` and an audio storage path WHEN the acoustic analysis worker receives it THEN the worker downloads the audio from Cloud Storage and submits it to Vertex AI for acoustic analysis.
2. GIVEN a successful acoustic analysis WHEN the results are returned THEN the output includes three colony-state indicators: queenright confidence (float 0-1), agitation level (float 0-1), and swarm readiness (float 0-1), each with an associated confidence score.
3. GIVEN acoustic analysis results WHEN stored THEN the results are written to the observation record as structured data available to the recommendation context assembly service.
4. GIVEN an indicator with confidence below 50% WHEN the result is stored THEN the indicator is flagged as `low_confidence` and the recommendation engine treats it as advisory only (not decisive).
5. GIVEN a processing failure WHEN the worker cannot complete acoustic analysis THEN the message is nacked for retry, and after max delivery attempts it routes to the dead-letter topic. The observation record is updated with `acoustic_processing_failed` status.
6. GIVEN successful acoustic analysis WHEN the pipeline completes THEN the worker publishes a message to `embedding-requests` topic with the audio storage path for downstream multimodal embedding generation.
7. GIVEN acoustic analysis results WHEN the recommendation engine assembles context for the associated hive THEN the acoustic indicators are included as supplementary evidence alongside visual and text observations.

## Tasks / Subtasks

- [ ] Implement Pub/Sub subscription handler for acoustic worker (AC: #1, #5)
  - [ ] Create Cloud Run worker endpoint for `media-uploaded` push subscription
  - [ ] Filter messages by `purpose == HIVE_AUDIO` attribute; ack and skip non-hive-audio messages
  - [ ] Parse message envelope and validate required fields (eventId, storagePath, entityId, tenantId)
  - [ ] Implement idempotency check by `eventId`
- [ ] Implement acoustic analysis via Vertex AI (AC: #1, #2)
  - [ ] Create `apps/api/internal/ai/acoustic.go` with acoustic analysis client
  - [ ] Design analysis prompt for Gemini model with hive audio context
  - [ ] Prompt requests three indicators: queenright status, agitation level, swarm readiness
  - [ ] Each indicator returned as float (0-1) with confidence score
  - [ ] Download audio from Cloud Storage
  - [ ] Submit audio + analysis prompt to Gemini via Vertex AI API
  - [ ] Parse structured JSON response into Go types
- [ ] Implement confidence classification (AC: #4)
  - [ ] For each indicator: if confidence >= 0.50, status is `measured`
  - [ ] For each indicator: if confidence < 0.50, status is `low_confidence` (advisory only)
  - [ ] Overall analysis status: `completed` if any indicator has confidence >= 0.50, `low_confidence` if all < 0.50
- [ ] Store acoustic analysis results (AC: #3, #7)
  - [ ] Create sqlc queries for updating observation with acoustic results
  - [ ] Write to `observation.acoustic_analysis` (JSONB):
    ```json
    {
      "status": "completed|low_confidence|processing_failed",
      "indicators": {
        "queenright": { "value": 0.85, "confidence": 0.72, "status": "measured" },
        "agitation": { "value": 0.30, "confidence": 0.65, "status": "measured" },
        "swarm_readiness": { "value": 0.15, "confidence": 0.40, "status": "low_confidence" }
      },
      "analyzed_at": "2026-03-21T10:00:00Z",
      "model_version": "gemini-2.0-flash",
      "audio_duration_seconds": 45
    }
    ```
  - [ ] Make acoustic results available via repository query for recommendation context assembly
- [ ] Publish embedding request (AC: #6)
  - [ ] On successful analysis, publish message to `embedding-requests` topic with audio storage path for multimodal embedding generation (Story 11.5)
- [ ] Implement error handling and dead-letter queue (AC: #5)
  - [ ] On transient errors (API timeout, rate limit): return nack for Pub/Sub retry
  - [ ] On permanent errors (corrupt audio, unsupported format): update observation to `acoustic_processing_failed`, ack message
  - [ ] Configure dead-letter topic `media-uploaded-acoustic-dlq` with max delivery attempts (5)
  - [ ] Structured logging with `slog`
- [ ] Configure infrastructure (AC: #1, #5)
  - [ ] Terraform: Pub/Sub subscription for acoustic worker on `media-uploaded` topic with filter `attributes.purpose = "HIVE_AUDIO"`
  - [ ] Terraform: dead-letter topic with Cloud Monitoring alert on depth > 10
  - [ ] Cloud Run worker: 1 vCPU, 512 MiB memory, 60s timeout (audio analysis may take longer), min 0 instances

## Dev Notes

### Architecture Compliance
- Worker runs as part of the async worker Cloud Run container per architecture.md
- Triggered by `media-uploaded` Pub/Sub topic filtered for hive audio content
- Acoustic analysis is a novel capability per epics.md; expect iterative model tuning
- Conservative confidence thresholds initially (50%) -- lower than Vision AI (70%) because this is experimental
- Results feed recommendation context assembly as supplementary evidence, not primary signals
- Audio embeddings go through Vertex AI Embedding 2.0 multimodal (shared vector space)
- Original audio retained in Cloud Storage; worker never deletes source files

### TDD Requirements (Tests First!)
- Test 1: **Pub/Sub message handling** -- Send a valid `media-uploaded` message with `purpose: HIVE_AUDIO`; assert worker downloads audio and calls Vertex AI. Mock GCS and Vertex AI.
- Test 2: **Indicator output** -- Mock Vertex AI to return queenright (0.85, confidence 0.72), agitation (0.30, confidence 0.65), swarm_readiness (0.15, confidence 0.40); assert all three indicators are parsed correctly with values and confidence scores.
- Test 3: **Confidence classification** -- Assert indicators with confidence >= 0.50 are marked `measured` and those < 0.50 are marked `low_confidence`.
- Test 4: **Result storage** -- After analysis, assert `observation.acoustic_analysis` JSONB contains all three indicators with correct structure.
- Test 5: **Low-confidence advisory** -- When all indicators have confidence < 0.50, assert overall status is `low_confidence` and results are flagged as advisory.
- Test 6: **Embedding request published** -- After successful analysis, assert a message is published to `embedding-requests` topic with audio path.
- Test 7: **Dead-letter on failure** -- Mock Vertex AI to fail permanently; assert DLQ routing and observation updated to `acoustic_processing_failed`.
- Test 8: **Idempotency** -- Send same `eventId` twice; assert analysis runs only once.
- Test 9: **Recommendation context integration** -- Assert acoustic results are retrievable by hive ID and included in recommendation context query.

### Technical Specifications
- **Analysis Model:** Gemini (`gemini-2.0-flash`) via Vertex AI API with audio input
- **Audio format:** opus (from client recording)
- **Indicators:** queenright (0-1), agitation (0-1), swarm_readiness (0-1)
- **Confidence threshold:** 50% for `measured` status; below 50% is `low_confidence` (advisory only)
- **Max recording length:** 5 minutes per segment
- **Go SDK:** `cloud.google.com/go/aiplatform` for Vertex AI, `cloud.google.com/go/storage` for GCS
- **Processing timeout:** 60 seconds (acoustic analysis may require longer processing than STT)
- **Acoustic analysis is experimental:** expect iterative prompt tuning and threshold adjustment as real-world data is collected

### Anti-Patterns to Avoid
- DO NOT treat acoustic indicators as high-confidence primary signals -- they are supplementary and experimental
- DO NOT use hard thresholds for colony-state decisions based solely on acoustic data
- DO NOT delete original audio files after analysis
- DO NOT process non-hive-audio messages -- filter by `purpose` attribute
- DO NOT skip idempotency checks
- DO NOT conflate hive audio (acoustic analysis) with voice notes (STT transcription) -- they have different purposes and processing pipelines
- DO NOT block recommendation generation on acoustic analysis completion -- it is supplementary context
- DO NOT over-engineer the analysis prompt -- start simple and iterate based on real-world results

### Project Structure Notes
- Acoustic client: `apps/api/internal/ai/acoustic.go`
- Analysis prompt: `apps/api/internal/ai/prompts/hive_audio.go`
- Result types: `apps/api/internal/ai/types.go` (shared with vision)
- Repository: `apps/api/internal/repository/observation.go` (acoustic result update queries)
- Event publisher: `apps/api/internal/event/publisher.go`
- Terraform: `infra/terraform/modules/pubsub/main.tf` (subscription, DLQ)

### References
- [Source: architecture.md#AI/ML Architecture -- Embedding Strategy]
- [Source: architecture.md#Infrastructure & Deployment -- Async worker service]
- [Source: architecture.md#Event Architecture -- media-uploaded topic]
- [Source: epics.md#Epic 11 -- Story 11.4]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
