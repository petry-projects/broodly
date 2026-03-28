# Story 11.2: Speech-to-Text Transcription Worker

Status: ready-for-dev

## Story

As a system,
I want a Cloud Run worker that transcribes voice recordings when triggered by a Pub/Sub message,
so that voice observations become structured text available for inspection records and recommendation context.

## Acceptance Criteria (BDD)

1. GIVEN a `media-uploaded` Pub/Sub message with `purpose: VOICE_NOTE` and an audio storage path WHEN the STT worker receives it THEN the worker downloads the audio from Cloud Storage and submits it to Gemini STT via Vertex AI API.
2. GIVEN a successful Gemini STT response WHEN the transcription completes THEN the transcription text and word-level confidence score are written to the associated observation record in PostgreSQL.
3. GIVEN a transcription with word accuracy confidence below 90% WHEN the result is stored THEN the observation is flagged with `needs_review` status and the user is notified that manual review is recommended.
4. GIVEN a voice recording containing beekeeping-specific terms (varroa, propolis, brood, nuc, super, requeen, absconding) WHEN transcribed THEN the domain vocabulary is recognized correctly via vocabulary hints in the STT configuration.
5. GIVEN the original audio file after transcription WHEN the pipeline completes THEN the original audio is retained in Cloud Storage (never deleted by the worker) per FR30a.
6. GIVEN a processing failure (API error, timeout, malformed audio) WHEN the worker cannot complete transcription THEN the message is nacked and eventually routed to the dead-letter topic, and the observation record is updated with `processing_failed` status.
7. GIVEN a voice recording under 60 seconds WHEN uploaded and processed THEN the end-to-end transcription completes within 5 seconds of the worker receiving the message.

## Tasks / Subtasks

- [ ] Implement Pub/Sub subscription handler for STT worker (AC: #1, #6)
  - [ ] Create Cloud Run worker endpoint for `media-uploaded` push subscription
  - [ ] Filter messages by `purpose == VOICE_NOTE` attribute; ack and skip non-audio messages
  - [ ] Parse message envelope and validate required fields (eventId, storagePath, entityId, tenantId)
  - [ ] Implement idempotency check by `eventId` to prevent duplicate processing
- [ ] Implement Gemini STT integration (AC: #1, #4, #7)
  - [ ] Create `apps/api/internal/voice/stt.go` with Gemini STT client
  - [ ] Use `gemini-2.0-flash` model for low-latency transcription
  - [ ] Configure language code `en-US` with field/outdoor audio profile
  - [ ] Add beekeeping vocabulary hints: varroa, propolis, brood, nuc, super, requeen, absconding, queenright, propolis, burr comb, drone, worker, swarm cell, supercedure, robbing, deadout, splits, mite wash
  - [ ] Download audio from Cloud Storage to worker memory/temp storage
  - [ ] Submit audio bytes to Gemini STT API via Vertex AI SDK (`cloud.google.com/go/aiplatform`)
  - [ ] Parse response: transcription text, word-level confidence, overall confidence score
- [ ] Store transcription results (AC: #2, #3)
  - [ ] Create sqlc queries for updating observation with transcription
  - [ ] Write transcription text to `observation.transcription_text`
  - [ ] Write confidence score to `observation.transcription_confidence`
  - [ ] If confidence < 0.90, set `observation.transcription_status = 'needs_review'`
  - [ ] If confidence >= 0.90, set `observation.transcription_status = 'completed'`
  - [ ] Store word-level details in `observation.transcription_metadata` (JSONB)
- [ ] Implement structured extraction from transcription (AC: #2)
  - [ ] Parse transcription text for structured observation fields using Gemini
  - [ ] Extract: queen seen (bool), brood pattern quality, pest indicators, temperament, honey stores estimate
  - [ ] Store extracted fields in `observation.extracted_fields` (JSONB) with individual confidence scores
  - [ ] Extracted fields feed into recommendation context assembly
- [ ] Implement error handling and dead-letter queue (AC: #6)
  - [ ] On transient errors (API timeout, rate limit): return nack for retry
  - [ ] On permanent errors (malformed audio, unsupported format): update observation status to `processing_failed`, ack message
  - [ ] Configure dead-letter topic with max delivery attempts (5)
  - [ ] Log all failures with structured logging (`slog`) including eventId, storagePath, error details
- [ ] Publish embedding request after transcription (AC: #2)
  - [ ] On successful transcription, publish message to `embedding-requests` topic with transcription text and audio storage path for downstream embedding generation (Story 11.5)
- [ ] Configure infrastructure (AC: #1, #6)
  - [ ] Terraform: Pub/Sub subscription for STT worker on `media-uploaded` topic with filter `attributes.purpose = "VOICE_NOTE"`
  - [ ] Terraform: dead-letter topic `media-uploaded-stt-dlq` with monitoring alert on depth > 10
  - [ ] Cloud Run worker service configuration: 1 vCPU, 512 MiB memory, 30s timeout, min 0 instances

## Dev Notes

### Architecture Compliance
- Worker runs as a separate Cloud Run container (`Dockerfile.worker`) per architecture.md infrastructure section
- Triggered by Pub/Sub push subscription on `media-uploaded` topic, filtered for audio content
- Uses Gemini STT (`gemini-2.0-flash`) via Vertex AI API per voice architecture section
- Original audio is retained in Cloud Storage; worker never deletes source files
- Structured extraction parses voice notes into observation fields for recommendation context
- Event consumers are idempotent by `eventId` per communication patterns

### TDD Requirements (Tests First!)
- Test 1: **Pub/Sub message handling** -- Send a valid `media-uploaded` message with `purpose: VOICE_NOTE`; assert worker downloads audio from storage path and calls Gemini STT. Mock GCS and Vertex AI.
- Test 2: **Transcription storage** -- Mock Gemini STT to return transcription with 95% confidence; assert transcription text, confidence, and `completed` status are written to observation record.
- Test 3: **Low-confidence flagging** -- Mock Gemini STT to return 85% confidence; assert observation is flagged with `needs_review` status.
- Test 4: **Beekeeping vocabulary** -- Provide audio (or mock) containing "varroa mite count" and "propolis buildup"; assert transcription contains these terms correctly. Validate vocabulary hints are included in STT config.
- Test 5: **Audio retention** -- After transcription completes, assert the original audio file still exists in Cloud Storage (worker did not delete it).
- Test 6: **Dead-letter on failure** -- Mock Gemini STT to fail permanently; assert message is nacked, observation updated to `processing_failed`, and after max retries the message lands on DLQ.
- Test 7: **Idempotency** -- Send same `eventId` twice; assert transcription is only processed once (second message acked without reprocessing).
- Test 8: **Structured extraction** -- Mock transcription text "Queen seen, good brood pattern, no mites observed"; assert extracted fields include `queen_seen: true`, `brood_quality: good`, `pest_indicators: none`.

### Technical Specifications
- **STT Model:** `gemini-2.0-flash` via Vertex AI API (low latency)
- **Audio format:** opus (from client recording via `expo-av`)
- **Language:** `en-US` with field/outdoor audio profile
- **Vocabulary hints:** beekeeping domain terms as system prompt context
- **Latency target:** < 5 seconds for recordings under 60 seconds
- **Max recording length:** 5 minutes per segment (cost cap)
- **Confidence threshold:** 90% for auto-accept; below 90% flags `needs_review`
- **Go SDK:** `cloud.google.com/go/aiplatform` for Vertex AI, `cloud.google.com/go/storage` for GCS
- **Structured logging:** `log/slog` with JSON output for Cloud Logging
- **Tracing:** OpenTelemetry span per transcription request

### Anti-Patterns to Avoid
- DO NOT delete original audio files after transcription -- FR30a requires retention
- DO NOT process non-audio messages -- filter by `purpose` attribute, ack and skip others
- DO NOT retry permanently failed messages indefinitely -- use dead-letter queue with max attempts
- DO NOT block on embedding generation -- publish to `embedding-requests` topic asynchronously
- DO NOT hardcode vocabulary lists -- use a configurable vocabulary file or constant package
- DO NOT skip idempotency checks -- duplicate Pub/Sub delivery is expected behavior
- DO NOT store audio bytes in PostgreSQL -- only store transcription text and metadata
- DO NOT use synchronous STT from the API service -- all transcription is async via the worker

### Project Structure Notes
- Worker entrypoint: `apps/api/cmd/worker/main.go` (shared worker binary with message routing)
- STT client: `apps/api/internal/voice/stt.go`
- STT config: `apps/api/internal/voice/config.go` (vocabulary, model settings)
- Structured extractor: `apps/api/internal/voice/extractor.go`
- Repository: `apps/api/internal/repository/observation.go` (transcription update queries)
- Event publisher: `apps/api/internal/event/publisher.go` (embedding-requests topic)
- Terraform: `infra/terraform/modules/pubsub/main.tf` (subscription, DLQ)

### References
- [Source: architecture.md#Voice Architecture: Gemini STT/TTS -- Transcription Pipeline]
- [Source: architecture.md#Infrastructure & Deployment -- Async worker service]
- [Source: architecture.md#Event Architecture -- media-uploaded topic]
- [Source: architecture.md#Communication Patterns -- Event consumers are idempotent by eventId]
- [Source: epics.md#Epic 11 -- Story 11.2]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
