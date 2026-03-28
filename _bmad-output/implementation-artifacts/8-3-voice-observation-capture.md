# Story 8.3: Voice Observation Capture

Status: ready-for-dev

## Story

As a beekeeper with gloved hands,
I want to record observations by voice during inspection using the VoiceLogCapture component,
so that I can log findings without putting down my tools.

## Acceptance Criteria (BDD)

1. GIVEN I am on an inspection step WHEN I tap the 56x56px microphone FAB button THEN the VoiceLogCapture component transitions from idle to listening state with a pulsing ring animation and waveform visualization.
2. GIVEN the VoiceLogCapture is in listening state WHEN I speak an observation THEN a real-time transcript preview appears as I speak, confirming the system is hearing correctly.
3. GIVEN I have finished speaking WHEN 1.5 seconds of silence is detected THEN the component transitions to processing state, audio is uploaded to Cloud Storage via signed URL, and the STT pipeline is triggered via Pub/Sub.
4. GIVEN transcription completes WHEN the result is returned THEN the component transitions to confirm state showing "I heard: '[transcription]'" with Confirm, Edit, and Retry buttons, and a 3-second auto-confirm window.
5. GIVEN a low-confidence transcription (below threshold) WHEN the result is displayed THEN a "Review suggested" badge (`<Badge action="warning">`) is shown and auto-confirm is disabled, requiring explicit user confirmation or edit.
6. GIVEN the user confirms a transcription WHEN the observation is accepted THEN it populates the current step's observation text field and the original audio file reference is preserved alongside the transcription.
7. GIVEN the microphone permission has not been granted WHEN the user first taps the voice button THEN a permission request is shown with trust-first messaging: "Voice input lets you log observations hands-free during inspections."
8. GIVEN no speech is detected for 5 seconds after activation WHEN the timeout fires THEN the component shows "Didn't catch that. Tap to try again or type instead." with Retry and Type fallback buttons.
9. GIVEN ambient noise exceeds a usable threshold WHEN the noise check runs THEN a noise-quality indicator appears suggesting the user move away from the hive or switch to tap-based entry.
10. GIVEN the `prefers-reduced-motion` system setting is enabled WHEN the voice button is active THEN the pulsing ring animation is replaced with a static "Listening..." label and the waveform is replaced with a static icon.

## Tasks / Subtasks

- [ ] Build VoiceLogCapture component (AC: #1, #2, #3, #4, #5, #8, #9, #10)
  - [ ] Create `apps/mobile/src/features/inspection/components/VoiceLogCapture/index.tsx`
  - [ ] Implement state machine: idle -> listening -> processing -> confirm using Zustand or useReducer
  - [ ] Idle state: 56x56px `<Fab size="lg">` with `<FabIcon>` microphone icon, `accessibilityLabel="Voice input. Double tap to start recording"`
  - [ ] Listening state: pulsing ring animation, waveform visualization, real-time transcript preview
  - [ ] Processing state: `<Spinner>` with "Processing..." label
  - [ ] Confirm state: transcript text, Confirm/Edit/Retry buttons, 3-second auto-confirm countdown
  - [ ] Implement `prefers-reduced-motion` check: static icon + "Listening..." label when enabled
- [ ] Implement audio recording service (AC: #1, #3)
  - [ ] Create `apps/mobile/src/features/inspection/services/audioRecordingService.ts`
  - [ ] Use `expo-av` for audio recording with opus codec
  - [ ] Implement silence detection (1.5s threshold) to auto-stop recording
  - [ ] Implement ambient noise level detection and quality indicator
  - [ ] Implement 5-second no-speech timeout
- [ ] Implement audio upload service (AC: #3, #6)
  - [ ] Create `apps/mobile/src/features/inspection/services/audioUploadService.ts`
  - [ ] Request signed URL from API via GraphQL mutation
  - [ ] Upload opus audio file to Cloud Storage (`broodly-media-{env}`) via signed URL
  - [ ] Cloud Storage notification auto-triggers `media-uploaded` Pub/Sub topic for STT
  - [ ] Store audio file reference (GCS URI) in observation record alongside transcription
- [ ] Implement transcription polling/subscription (AC: #4, #5)
  - [ ] Poll API for transcription result (or use GraphQL subscription if available)
  - [ ] Parse confidence score from STT response
  - [ ] Flag low-confidence results: show "Review suggested" badge and disable auto-confirm
  - [ ] Display "I heard: '[text]'" with Confirm (`<Button action="positive">`), Edit (`<Button action="primary" variant="outline">`), Retry (`<Button action="secondary" variant="link">`)
- [ ] Handle microphone permission (AC: #7)
  - [ ] Use `expo-av` permission API: `Audio.requestPermissionsAsync()`
  - [ ] Show trust-first messaging before native permission dialog
  - [ ] Handle permission denied: show "Voice unavailable — tap to type instead" with tap fallback
- [ ] Implement tap-based fallback (AC: #8)
  - [ ] When voice fails or user chooses "Type instead", show `<Input><InputField>` for manual text entry
  - [ ] Fallback is always available — voice is primary but not exclusive
- [ ] Integrate with InspectionStepScreen (AC: #6)
  - [ ] VoiceLogCapture output (confirmed transcription) populates the current step's observation field
  - [ ] Audio file reference stored as observation metadata for post-inspection review

## Dev Notes

### Architecture Compliance
- Audio upload follows the architecture.md voice payload pattern: audio -> Cloud Storage via signed URL -> Cloud Storage notification -> `media-uploaded` Pub/Sub topic -> STT processing -> result written back to inspection record
- Audio format is opus per architecture.md media compression requirements
- VoiceLogCapture is a custom domain component built on Gluestack `Box` + `Fab` per CLAUDE.md component mapping
- Feature service files in `apps/mobile/src/features/inspection/services/`
- Voice service utilities may also be referenced from `apps/mobile/src/services/voice/` for shared voice logic

### TDD Requirements (Tests First!)
- Test 1: **Voice button renders at correct size** — Render VoiceLogCapture in idle state and assert the Fab button is 56x56px with microphone icon and correct accessibilityLabel.
- Test 2: **State transitions** — Tap the voice button and assert state transitions from idle to listening with visual feedback (pulsing ring or static label based on motion preference).
- Test 3: **Audio upload on silence** — Simulate 1.5s silence detection and assert audioUploadService is called with the recorded audio file.
- Test 4: **Transcription display** — Provide a mock transcription result and assert "I heard: '[text]'" is displayed with Confirm, Edit, and Retry buttons.
- Test 5: **Low-confidence flag** — Provide a low-confidence transcription and assert "Review suggested" badge is visible and auto-confirm is disabled.
- Test 6: **Original audio preserved** — Confirm a transcription and assert the observation record includes both the transcription text and the audio file GCS URI.
- Test 7: **Permission request messaging** — Simulate no microphone permission and tap voice button; assert trust-first messaging is shown before the native permission dialog.
- Test 8: **No-speech timeout** — Activate recording, wait 5 seconds with no speech, and assert "Didn't catch that" message with Retry and Type buttons.
- Test 9: **Reduced motion** — Enable prefers-reduced-motion and assert pulsing animation is replaced with static "Listening..." label.

### Technical Specifications
- **Voice FAB:** `<Fab size="lg">` with `<FabIcon as={MicIcon} />`, 56x56px, anchored bottom-right of inspection screen
- **Audio codec:** opus via `expo-av` recording options
- **Silence detection:** 1.5 seconds of silence triggers auto-stop
- **No-speech timeout:** 5 seconds with no detected speech
- **Auto-confirm window:** 3 seconds (configurable in settings; can be disabled)
- **Signed URL expiry:** 15 minutes per architecture.md
- **Pub/Sub topic:** `media-uploaded` (triggered by Cloud Storage notification, not by client)
- **Gluestack components:** `Fab`, `FabIcon`, `FabLabel`, `Box`, `Spinner`, `Text`, `Button`, `ButtonText`, `Badge`, `BadgeText`, `BadgeIcon`, `Input`, `InputField`
- **Accessibility:** Voice button announces state changes; all controls have context-aware labels

### Anti-Patterns to Avoid
- DO NOT request microphone permission during onboarding — defer to first voice interaction per UX spec
- DO NOT auto-confirm low-confidence transcriptions — require explicit user action
- DO NOT discard original audio after transcription — preserve per FR30a for post-inspection review
- DO NOT block the inspection flow while waiting for transcription — allow the user to continue and show results when ready
- DO NOT use a small microphone button — must be 56x56px minimum for gloved field use
- DO NOT skip the tap-based fallback — voice is primary but tap must always be available
- DO NOT trigger STT from the client — Cloud Storage notification handles it via Pub/Sub

### Project Structure Notes
- `apps/mobile/src/features/inspection/components/VoiceLogCapture/index.tsx`
- `apps/mobile/src/features/inspection/services/audioRecordingService.ts`
- `apps/mobile/src/features/inspection/services/audioUploadService.ts`
- `apps/mobile/src/services/voice/` (shared voice utilities if needed)

### References
- [Source: epics.md#Story 8.3 — Voice Capture During Inspection]
- [Source: ux-design-specification.md#Voice Interaction Patterns — Voice Activation, Processing Feedback, Failure Handling]
- [Source: ux-design-specification.md#Voice Capture in High-Noise Environments]
- [Source: CLAUDE.md#Custom Domain Components — VoiceLogCapture]
- [Source: CLAUDE.md#Button Hierarchy — Voice capture Fab]
- [Source: CLAUDE.md#Accessibility Requirements — Voice button state announcements]
- [Source: architecture.md#Voice payload pattern]
- [Source: architecture.md#Infrastructure — AI/ML Gemini STT]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
