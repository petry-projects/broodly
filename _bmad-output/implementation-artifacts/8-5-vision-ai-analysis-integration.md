# Story 8.5: Vision AI Analysis Integration

Status: ready-for-dev

## Story

As a beekeeper,
I want to get AI-assisted interpretation of my inspection photos with confidence badges and actionable findings,
so that I can better understand what I am seeing in the hive and make more informed decisions.

## Acceptance Criteria (BDD)

1. GIVEN an image has been uploaded to Cloud Storage WHEN I tap "Analyze Image" on the thumbnail THEN an analysis request is published to the `embedding-requests` Pub/Sub topic and the ImageAnalysisLoadingState is displayed with a progress indicator.
2. GIVEN the analysis is processing WHEN more than 5 seconds elapse THEN the loading state shows: "Still analyzing... you can continue your inspection and we'll notify you when results are ready."
3. GIVEN the analysis completes with high confidence (>=70%) WHEN results are returned THEN the ImageAnalysisResultCard displays findings with per-finding confidence badges (high/medium/low), interpretive labels, and links to relevant recommendations.
4. GIVEN the analysis completes with low confidence (<70%) WHEN results are returned THEN the ImageAnalysisResultCard displays a fallback message: "Analysis inconclusive — manual assessment recommended. Consider asking an experienced beekeeper." with a `<Badge action="warning">` confidence indicator.
5. GIVEN analysis results are displayed WHEN the card renders THEN each finding shows: category (brood pattern, queen cells, pest/disease indicators), interpretation text, confidence level as a `<Progress>` bar with percentage, and an "AI confidence: [level]" badge.
6. GIVEN an analysis result WHEN the user reviews it THEN the result is stored as observation evidence linked to the current inspection step, feeding into the recommendation engine context.
7. GIVEN the RecommendationCard is displayed during inspection WHEN vision AI analysis has contributed evidence THEN the recommendation includes the analysis finding as supporting evidence with its confidence level.
8. GIVEN the ImageAnalysisResultCard renders WHEN a screen reader focuses on it THEN it announces: finding category, confidence level, and interpretation in reading order.

## Tasks / Subtasks

- [ ] Build ImageAnalysisResultCard component (AC: #3, #4, #5, #8)
  - [ ] Create `apps/mobile/src/features/inspection/components/ImageAnalysisResultCard/index.tsx`
  - [ ] Built on Gluestack `Card` (elevated) with `tva()` variants for confidence: high | medium | low
  - [ ] Render findings list: category heading, interpretation text, confidence `<Progress>` bar, "AI confidence: [level]" `<Badge>`
  - [ ] High confidence (>=70%): `<Badge action="success">` with "High confidence"
  - [ ] Medium confidence (50-69%): `<Badge action="warning">` with "Medium confidence"
  - [ ] Low confidence (<50%): `<Badge action="error">` with "Low confidence"
  - [ ] Low overall confidence (<70%): show fallback `<Alert action="warning">` with manual assessment recommendation
  - [ ] Set `accessibilityLabel` per finding: "{category}, {confidence level}, {interpretation}"
  - [ ] Supported finding categories: brood pattern quality, queen cells, pest indicators, disease indicators, population estimate
- [ ] Build ImageAnalysisLoadingState component (AC: #2)
  - [ ] Create `apps/mobile/src/features/inspection/components/ImageAnalysisLoadingState/index.tsx`
  - [ ] Initial state: `<Spinner>` with "Analyzing image..." text
  - [ ] After 5 seconds: show "Still analyzing... you can continue your inspection and we'll notify you when results are ready."
  - [ ] Implement timer-based state transition
- [ ] Implement analysis request service (AC: #1)
  - [ ] Create `apps/mobile/src/features/inspection/services/imageAnalysisService.ts`
  - [ ] Trigger analysis via GraphQL mutation (`requestImageAnalysis(imageId, inspectionId)`)
  - [ ] API publishes to `embedding-requests` Pub/Sub topic (server-side, not client)
  - [ ] Client polls for result or subscribes via GraphQL subscription
- [ ] Implement analysis result polling (AC: #1, #3, #4)
  - [ ] Poll `getImageAnalysisResult(imageId)` GraphQL query at 2-second intervals
  - [ ] Parse response: findings array with category, interpretation, confidence, and overall confidence
  - [ ] Stop polling on result or after 60-second timeout (show "Analysis unavailable" fallback)
- [ ] Integrate analysis results as observation evidence (AC: #6, #7)
  - [ ] Store analysis results in observation record via inspectionStore
  - [ ] Tag observation with `evidenceType: 'vision_ai'` and link to source image
  - [ ] Make analysis findings available to recommendation context assembly (server-side)
- [ ] Build RecommendationCard integration for in-inspection display (AC: #7)
  - [ ] Create `apps/mobile/src/features/inspection/components/InspectionRecommendationCard/index.tsx`
  - [ ] Extend RecommendationCard (from `packages/ui/`) with inspection-specific context
  - [ ] Display: action (`<Heading size="xl">`), rationale (`<Text size="sm">`), confidence (`<Progress>`), fallback (`<Alert action="warning">`)
  - [ ] Include vision AI evidence when available as supporting finding
  - [ ] "Did It" (`<Button action="positive">`) and "Ignore" (`<Button action="secondary" variant="link">`) with context-aware labels
  - [ ] Confidence types: insufficient data -> "Not enough information", conflicting evidence -> "Mixed signals" per FR54a
  - [ ] Treatment legality notice when applicable per FR12b

## Dev Notes

### Architecture Compliance
- Vision AI analysis runs server-side via Vertex AI Gemini Vision, not on the client
- Client triggers analysis via GraphQL mutation; server publishes to `embedding-requests` Pub/Sub topic
- Analysis worker (`apps/api/internal/ai/`) processes the request and writes results back
- 70% precision gate per NFR28 determines high vs low confidence display
- ImageAnalysisResultCard is a custom domain component per CLAUDE.md with confidence tva() variants
- RecommendationCard follows the mandatory hierarchy: action + rationale + confidence + fallback per CLAUDE.md

### TDD Requirements (Tests First!)
- Test 1: **Analysis request triggers** — Tap "Analyze Image" on an uploaded image thumbnail and assert the `requestImageAnalysis` mutation is called with correct imageId and inspectionId.
- Test 2: **Loading state timeout** — Render ImageAnalysisLoadingState and assert that after 5 seconds the "continue your inspection" message appears.
- Test 3: **High-confidence result display** — Provide a mock analysis result with 85% confidence and assert the ImageAnalysisResultCard shows findings with `<Badge action="success">` and a progress bar at 85%.
- Test 4: **Low-confidence fallback** — Provide a mock analysis result with 55% confidence and assert the fallback message "Analysis inconclusive — manual assessment recommended" appears with a warning alert.
- Test 5: **Finding categories render** — Provide a result with brood pattern and queen cell findings and assert both are rendered with their respective categories, interpretations, and confidence levels.
- Test 6: **Evidence stored in observation** — After analysis result is received, assert the observation record in inspectionStore includes the analysis result with `evidenceType: 'vision_ai'`.
- Test 7: **RecommendationCard hierarchy** — Render InspectionRecommendationCard with mock data and assert action, rationale, confidence, and fallback are all present in correct visual hierarchy.
- Test 8: **Accessibility** — Focus on an ImageAnalysisResultCard finding and assert accessibilityLabel includes category, confidence level, and interpretation.
- Test 9: **Confidence type distinction** — Render RecommendationCard with confidenceType "insufficient_data" and assert "Not enough information" message; repeat with "conflicting_evidence" and assert "Mixed signals".

### Technical Specifications
- **Vision AI backend:** Vertex AI Gemini Vision via Go backend (`apps/api/internal/ai/`)
- **Pub/Sub topic:** `embedding-requests` for analysis requests
- **Precision gate:** 70% per NFR28
- **Polling interval:** 2 seconds for analysis result
- **Polling timeout:** 60 seconds before fallback
- **5-second loading message:** timer-driven state transition in ImageAnalysisLoadingState
- **Finding categories:** brood pattern, queen cells, pest indicators, disease indicators, population estimate
- **Gluestack components:** `Card` (elevated), `Progress`, `Badge`, `BadgeText`, `BadgeIcon`, `Alert`, `AlertIcon`, `AlertText`, `Heading`, `Text`, `Spinner`, `Button`, `ButtonText`, `HStack`, `VStack`
- **Confidence badge mapping:** >=70% success, 50-69% warning, <50% error
- **RecommendationCard visual hierarchy:** action (Heading xl) -> rationale (Text sm) -> confidence (Progress) -> fallback (Alert warning)

### Anti-Patterns to Avoid
- DO NOT run Vision AI analysis on the client — all AI processing is server-side via Vertex AI
- DO NOT block inspection flow while waiting for analysis — user can continue and return to results
- DO NOT show analysis results without confidence indicators — always display AI confidence badge
- DO NOT auto-accept low-confidence analysis as authoritative — show fallback with manual assessment recommendation
- DO NOT render RecommendationCard without all 4 required elements (action, rationale, confidence, fallback)
- DO NOT use color alone for confidence display — always pair with text badge and progress bar
- DO NOT skip the polling timeout — show graceful fallback after 60 seconds

### Project Structure Notes
- `apps/mobile/src/features/inspection/components/ImageAnalysisResultCard/index.tsx`
- `apps/mobile/src/features/inspection/components/ImageAnalysisLoadingState/index.tsx`
- `apps/mobile/src/features/inspection/components/InspectionRecommendationCard/index.tsx`
- `apps/mobile/src/features/inspection/services/imageAnalysisService.ts`

### References
- [Source: epics.md#Story 8.4 — Photo and Image Capture with Vision AI Analysis]
- [Source: epics.md#Story 8.5 — In-Inspection Recommendation Display]
- [Source: ux-design-specification.md#Vision AI Components — ImageAnalysisResultCard, ImageAnalysisLoadingState]
- [Source: CLAUDE.md#Custom Domain Components — ImageAnalysisResultCard, RecommendationCard]
- [Source: CLAUDE.md#Key Rules — Every recommendation must include action + rationale + confidence + fallback]
- [Source: architecture.md#AI/ML — Vertex AI Gemini Vision]
- [Source: architecture.md#Event infrastructure — embedding-requests topic]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
