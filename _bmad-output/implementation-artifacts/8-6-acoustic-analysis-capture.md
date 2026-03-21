# Story 8.6: Acoustic Analysis Capture

Status: ready-for-dev

## Story

As a beekeeper,
I want to record hive entrance sounds for acoustic analysis during inspection,
so that I get additional colony health signals (queenright status, agitation level, swarm readiness) without extra hardware.

## Acceptance Criteria (BDD)

1. GIVEN I am in an active inspection WHEN I reach the acoustic analysis step or tap "Record Hive Sounds" THEN a guided 30-second audio recording begins with a visual waveform/timer countdown.
2. GIVEN the recording is active WHEN the 30-second timer completes THEN the recording auto-stops, the audio is encoded in opus format, and it is uploaded to Cloud Storage via signed URL.
3. GIVEN the audio is uploaded WHEN the Cloud Storage notification fires THEN the acoustic analysis pipeline is triggered via the `media-uploaded` Pub/Sub topic.
4. GIVEN the analysis completes WHEN results are returned THEN the display shows colony-state indicators: queenright confidence, agitation level, and swarm readiness, each with an individual confidence level badge.
5. GIVEN a queenright confidence result WHEN it renders THEN it shows as a labeled indicator: "Queenright: [High/Medium/Low confidence]" with the corresponding status badge (success/warning/error).
6. GIVEN acoustic analysis results WHEN they are reviewed THEN results are stored as an observation with type `acoustic_analysis` and are included in the recommendation engine's evidence context for this hive.
7. GIVEN the recording is in progress WHEN the user taps "Stop Early" THEN the recording stops, and if at least 10 seconds of audio was captured, it proceeds with upload and analysis; otherwise it shows "Recording too short — at least 10 seconds needed for analysis."
8. GIVEN the `prefers-reduced-motion` setting is enabled WHEN the waveform is displayed THEN it is replaced with a static "Recording..." label and a numeric countdown timer.

## Tasks / Subtasks

- [ ] Build AcousticCaptureScreen component (AC: #1, #2, #7, #8)
  - [ ] Create `apps/mobile/src/features/inspection/components/AcousticCaptureScreen/index.tsx`
  - [ ] Display instruction text: "Hold your phone near the hive entrance for 30 seconds"
  - [ ] 30-second countdown timer with circular progress or linear `<Progress>` bar
  - [ ] Waveform visualization during recording (or static label with `prefers-reduced-motion`)
  - [ ] "Stop Early" button (`<Button action="secondary" variant="outline">`) visible during recording
  - [ ] Auto-stop at 30 seconds
  - [ ] Minimum recording length: 10 seconds for analysis eligibility
- [ ] Implement acoustic recording service (AC: #1, #2, #7)
  - [ ] Create `apps/mobile/src/features/inspection/services/acousticRecordingService.ts`
  - [ ] Use `expo-av` for audio recording with opus codec
  - [ ] Configure for ambient sound capture (no noise cancellation, higher sensitivity)
  - [ ] Implement 30-second auto-stop timer
  - [ ] Implement early stop with minimum 10-second validation
- [ ] Implement acoustic audio upload (AC: #2, #3)
  - [ ] Reuse `audioUploadService.ts` from Story 8.3 or create shared upload utility
  - [ ] Request signed URL via GraphQL mutation
  - [ ] Upload opus audio to Cloud Storage; Cloud Storage notification triggers `media-uploaded` Pub/Sub
  - [ ] Tag upload metadata with `analysisType: 'acoustic'` to route to correct worker
- [ ] Build AcousticAnalysisResultCard component (AC: #4, #5)
  - [ ] Create `apps/mobile/src/features/inspection/components/AcousticAnalysisResultCard/index.tsx`
  - [ ] Display three colony-state indicators in a `<VStack>`:
    - Queenright: confidence badge + label
    - Agitation level: Low/Normal/Elevated with badge
    - Swarm readiness: Low/Medium/High with badge
  - [ ] Each indicator uses confidence-mapped badges: high -> `<Badge action="success">`, medium -> `<Badge action="warning">`, low/elevated/high-risk -> `<Badge action="error">`
  - [ ] Include explanatory text per indicator for Newbie users (skill-adaptive)
- [ ] Implement analysis result polling (AC: #4)
  - [ ] Poll `getAcousticAnalysisResult(audioId)` GraphQL query at 2-second intervals
  - [ ] Parse response: queenrightConfidence, agitationLevel, swarmReadiness, each with confidence score
  - [ ] Timeout after 60 seconds with "Analysis unavailable — results will appear in your inspection history when ready"
- [ ] Integrate results as observation evidence (AC: #6)
  - [ ] Store analysis results in observation record with `type: 'acoustic_analysis'`
  - [ ] Include all three indicators with confidence scores
  - [ ] Make available to recommendation context assembly (server-side)

## Dev Notes

### Architecture Compliance
- Acoustic analysis runs server-side via Vertex AI, triggered through the same `media-uploaded` Pub/Sub pipeline as voice and image uploads
- Audio format is opus per architecture.md media compression requirements
- Analysis worker lives at `apps/api/internal/ai/` per architecture.md structure mapping
- Results stored as observations with specific type (`acoustic_analysis`) for distinct handling in recommendation context
- Shared upload infrastructure with Story 8.3 (voice) and Story 8.4 (images)

### TDD Requirements (Tests First!)
- Test 1: **30-second recording** — Start an acoustic recording and assert the timer counts down from 30 to 0 and auto-stops.
- Test 2: **Early stop validation** — Stop recording at 8 seconds and assert "Recording too short" message appears. Stop at 12 seconds and assert upload proceeds.
- Test 3: **Audio upload with acoustic tag** — Complete a recording and assert the upload includes `analysisType: 'acoustic'` metadata.
- Test 4: **Result display** — Provide mock acoustic analysis results and assert queenright confidence, agitation level, and swarm readiness each render with correct badges and labels.
- Test 5: **Confidence badge mapping** — Given queenright confidence of 85%, assert `<Badge action="success">` with "High confidence". Given 45%, assert `<Badge action="error">` with "Low confidence".
- Test 6: **Evidence storage** — After results are received, assert the observation record in inspectionStore includes type `acoustic_analysis` with all three indicator values.
- Test 7: **Reduced motion** — Enable prefers-reduced-motion and assert waveform is replaced with static "Recording..." label and numeric countdown.
- Test 8: **Polling timeout** — Simulate no result after 60 seconds and assert timeout fallback message is displayed.

### Technical Specifications
- **Recording duration:** 30 seconds (auto-stop), minimum 10 seconds for analysis
- **Audio codec:** opus via `expo-av`
- **Recording config:** No noise cancellation, ambient capture mode, higher microphone sensitivity
- **Upload metadata:** `analysisType: 'acoustic'` to differentiate from voice STT
- **Pub/Sub topic:** `media-uploaded` (same as voice/image uploads)
- **Analysis backend:** Vertex AI via `apps/api/internal/ai/`
- **Polling interval:** 2 seconds
- **Polling timeout:** 60 seconds
- **Colony-state indicators:** queenright (confidence %), agitation (Low/Normal/Elevated), swarm readiness (Low/Medium/High)
- **Gluestack components:** `Box`, `Progress`, `Text`, `Heading`, `Badge`, `BadgeText`, `BadgeIcon`, `Button`, `ButtonText`, `VStack`, `HStack`, `Card` (elevated), `Spinner`
- **Touch targets:** All buttons minimum 48x48px

### Anti-Patterns to Avoid
- DO NOT apply noise cancellation to acoustic recordings — the hive sounds ARE the signal
- DO NOT allow recordings shorter than 10 seconds to be submitted for analysis
- DO NOT run acoustic analysis on the client — server-side only via Vertex AI
- DO NOT block the inspection flow while waiting for acoustic results — user can continue
- DO NOT show acoustic indicators without confidence levels — always include confidence badges
- DO NOT create a separate upload pipeline — reuse the shared signed URL + Cloud Storage notification pattern

### Project Structure Notes
- `apps/mobile/src/features/inspection/components/AcousticCaptureScreen/index.tsx`
- `apps/mobile/src/features/inspection/components/AcousticAnalysisResultCard/index.tsx`
- `apps/mobile/src/features/inspection/services/acousticRecordingService.ts`

### References
- [Source: epics.md#Story 8.7 — Hive Audio Capture and Acoustic Analysis]
- [Source: architecture.md#AI/ML — Vertex AI for acoustic analysis]
- [Source: architecture.md#Event infrastructure — media-uploaded Pub/Sub topic]
- [Source: CLAUDE.md#Asset Handling — opus for audio]
- [Source: CLAUDE.md#Accessibility Requirements — prefers-reduced-motion]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
