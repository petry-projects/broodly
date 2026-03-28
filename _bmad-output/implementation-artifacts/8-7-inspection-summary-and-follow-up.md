# Story 8.7: Inspection Summary and Follow-Up

Status: ready-for-dev

## Story

As a beekeeper,
I want to see a post-inspection summary with completed actions, colony health trends, milestone achievements, and recommended follow-up scheduling,
so that I leave every inspection with a clear record of what was accomplished and a plan for what comes next.

## Acceptance Criteria (BDD)

1. GIVEN I have completed all inspection steps WHEN the summary screen renders THEN it displays a completed actions list showing every observation and recommendation acted upon during the session, each with its status badge (normal/cautionary/urgent) and "Did It" / "Ignored" label.
2. GIVEN the completed actions list WHEN observations include attached media THEN each observation row shows a thumbnail preview with upload status indicator (uploaded/pending/failed).
3. GIVEN the completed actions list WHEN AI analysis results (vision or acoustic) were captured THEN they appear inline with their respective observations, showing confidence badges per the standard action mapping (success/warning/error).
4. GIVEN the summary screen renders WHEN positive colony trends are detected from the current and recent inspections THEN a `ColonyImprovementSignal` progress indicator is displayed with encouraging copy: "Nice work — colony strength is trending up."
5. GIVEN the summary screen renders WHEN no positive trend data is available THEN the `ColonyImprovementSignal` is not displayed and no negative framing is shown.
6. GIVEN the inspection completes a milestone (first inspection, 10th inspection, first full season, first successful intervention) WHEN the summary screen renders THEN a `MilestoneAchievementToast` appears with the milestone title and celebratory description using `<Toast>` with accent styling.
7. GIVEN the summary screen WHEN a follow-up inspection is recommended THEN a `NextInspectionSummaryCard` displays the recommended next inspection date, inspection type, and brief rationale based on current colony state and seasonal context.
8. GIVEN the summary screen WHEN I tap "Save Inspection" THEN the inspection record status transitions to `completed`, the completion timestamp is set, MMKV in-progress state is cleared, and I am navigated to the hive detail screen.
9. GIVEN a completed inspection WHEN I tap "Edit Record" THEN the inspection reopens in edit mode allowing observation text corrections and transcription edits while preserving all original media files.
10. GIVEN a completed inspection WHEN I tap "View Record" THEN a read-only view of the full inspection record is displayed with all observations, media, analysis results, and the follow-up plan.
11. GIVEN the summary screen WHEN voice transcriptions with below-threshold confidence exist THEN a post-inspection review section is surfaced above the action buttons, allowing batch correction of flagged transcriptions.
12. GIVEN the `prefers-reduced-motion` setting is enabled WHEN the milestone toast or colony improvement signal animates THEN animations are replaced with static presentation.

## Tasks / Subtasks

- [ ] Build InspectionSummaryScreen component (AC: #1, #2, #3, #4, #5, #11)
  - [ ] Create `apps/mobile/src/features/inspection/components/InspectionSummaryScreen/index.tsx`
  - [ ] Completed actions list: group observations by category (Queen Status, Brood Health, Stores & Resources, Pest & Disease, General, Acoustic Analysis, Vision AI Analysis)
  - [ ] Each observation row: status badge + observation text + "Did It"/"Ignored" label if recommendation-linked
  - [ ] Media thumbnails with upload status indicators (uploaded/pending/failed)
  - [ ] AI analysis results inline with confidence badges (success/warning/error)
  - [ ] Post-inspection transcription review section for low-confidence voice entries (AC: #11)
  - [ ] `ColonyImprovementSignal` (`<Progress>` with `success-500` fill) when positive trends are detected
  - [ ] Summary header with hive name, inspection date, duration, and observation count
- [ ] Build MilestoneAchievementToast component (AC: #6, #12)
  - [ ] Create `apps/mobile/src/features/inspection/components/MilestoneAchievementToast/index.tsx`
  - [ ] Use Gluestack `<Toast>` with accent styling per CLAUDE.md `MilestoneAchievementToast` spec
  - [ ] Subcomponents: `<ToastTitle>` for milestone name, `<ToastDescription>` for celebratory copy
  - [ ] Milestone types: `first_inspection`, `tenth_inspection`, `first_full_season`, `first_successful_intervention`
  - [ ] Auto-dismiss after 5 seconds with manual dismiss option
  - [ ] Respect `prefers-reduced-motion`: skip entrance animation, show static toast
- [ ] Build NextInspectionSummaryCard component (AC: #7)
  - [ ] Create `apps/mobile/src/features/inspection/components/NextInspectionSummaryCard/index.tsx`
  - [ ] Display recommended next inspection date, inspection type, and brief rationale
  - [ ] Use Gluestack `<Card variant="outline">` with date prominently displayed
  - [ ] Include "Add to Calendar" affordance (optional, non-blocking)
  - [ ] Rationale text adapts to user skill level (Newbie gets more explanation)
- [ ] Build ColonyImprovementSignal display (AC: #4, #5, #12)
  - [ ] Render `<Progress>` bar with `value` from API trend data, `bg-success-500` fill
  - [ ] Include encouraging copy per UX emotional design: "Nice work — colony strength is trending up."
  - [ ] Only display when positive trend data is available from the API
  - [ ] Respect `prefers-reduced-motion` for any fill animation
- [ ] Implement summary action buttons (AC: #8, #9, #10)
  - [ ] "Save Inspection" — `<Button action="primary" variant="solid" size="xl">` — primary CTA
  - [ ] "Edit Record" — `<Button action="primary" variant="outline">` — opens edit mode
  - [ ] "View Record" — `<Button action="secondary" variant="link">` — opens read-only view
  - [ ] Save: call `completeInspection` GraphQL mutation, clear MMKV, navigate to hive detail
  - [ ] Edit: reopen inspection in edit mode with observation text fields editable, preserve original media
  - [ ] View: navigate to read-only inspection detail screen
- [ ] Implement milestone detection logic (AC: #6)
  - [ ] Query user's inspection history count and milestone flags from the API
  - [ ] Detect milestones: first inspection for this hive, 10th total inspection, first full season completed, first successful intervention confirmed
  - [ ] Trigger `MilestoneAchievementToast` when a new milestone is reached
  - [ ] Store milestone achievement to prevent re-triggering on subsequent views
- [ ] Build post-inspection transcription review section (AC: #11)
  - [ ] Filter observations with voice transcriptions below confidence threshold
  - [ ] Display each flagged transcription with: original text, "Review suggested" badge, editable text field, audio playback button, Confirm and Skip controls
  - [ ] On edit + confirm: update observation text, preserve original audio file reference
  - [ ] On skip: leave transcription as-is with low-confidence flag maintained

## Dev Notes

### Architecture Compliance
- Inspection status transitions (`in_progress` -> `completed`) via GraphQL mutations to the Go API
- MMKV stores in-progress inspection state for crash recovery; cleared only after server mutation succeeds
- ColonyImprovementSignal is a reusable subcomponent per CLAUDE.md custom domain components table
- MilestoneAchievementToast uses Gluestack `<Toast>` per CLAUDE.md custom domain components table
- NextInspectionSummaryCard per UX spec is a compact date/type snapshot using `<Card variant="outline">`
- Emotional design tone: "Nice work" not "Task complete" per CLAUDE.md emotional design rules
- Post-inspection transcription review addresses FR30 (transcription correction after gloves removed)
- Follow-up scheduling recommendation comes from the recommendation engine (Epic 9) via API response
- Milestone tracking stored server-side to prevent duplication across devices

### TDD Requirements (Tests First!)
- Test 1: **Completed actions list** — Complete an inspection with 5 observations (2 with "Did It", 1 with "Ignored", 2 unlinked) and assert the summary screen displays all observations with correct status badges and action labels.
- Test 2: **Media thumbnails** — Complete an inspection with 3 attached images and assert each observation row shows the correct thumbnail with upload status indicator.
- Test 3: **AI results display** — Complete an inspection with vision AI and acoustic analysis results and assert they appear inline with correct confidence badges (success for high, warning for medium, error for low).
- Test 4: **Colony improvement signal shown** — Provide positive trend data from the API and assert the ColonyImprovementSignal progress bar renders with `success-500` fill and encouraging copy text.
- Test 5: **Colony improvement signal hidden** — Provide no trend data or negative trend and assert the ColonyImprovementSignal is not rendered and no negative framing appears.
- Test 6: **Milestone toast first inspection** — Complete a user's first-ever inspection and assert the MilestoneAchievementToast appears with "First Inspection" title and celebratory description.
- Test 7: **Milestone toast no duplicate** — Complete a second inspection and assert no "First Inspection" milestone toast appears again.
- Test 8: **Follow-up card** — Provide a recommended follow-up date from the API and assert the NextInspectionSummaryCard displays the date, type, and rationale.
- Test 9: **Save inspection** — Tap "Save Inspection" and assert the `completeInspection` GraphQL mutation is called, MMKV is cleared, inspection status is `completed`, and navigation occurs to hive detail.
- Test 10: **Edit record** — Tap "Edit Record" on a completed inspection and assert the inspection opens in edit mode with observation text fields editable and media files preserved.
- Test 11: **View record** — Tap "View Record" and assert a read-only view renders with all observations, media, analysis results, and follow-up plan without editable controls.
- Test 12: **Transcription review queue** — Complete an inspection with 2 low-confidence voice transcriptions and assert the review section surfaces both with editable fields and audio playback buttons.
- Test 13: **Transcription correction** — Edit a flagged transcription and confirm; assert the observation text is updated while the audio file reference is preserved.
- Test 14: **Reduced motion** — Enable `prefers-reduced-motion` and assert milestone toast skips entrance animation and colony improvement signal renders without fill animation.

### Technical Specifications
- **Inspection statuses:** `in_progress`, `paused`, `completed`, `abandoned`
- **Completion mutation:** `completeInspection(inspectionId)` sets `completedAt` timestamp, transitions status to `completed`
- **Transcription review threshold:** same confidence threshold as Story 8.3 (server-configured)
- **ColonyImprovementSignal:** `<Progress>` with `value` from API trend data, `bg-success-500` fill
- **MilestoneAchievementToast:** `<Toast>` with accent styling, auto-dismiss 5 seconds
- **Milestone types:** `first_inspection`, `tenth_inspection`, `first_full_season`, `first_successful_intervention`
- **Follow-up scheduling:** recommended date and type from recommendation engine API response
- **Summary grouping categories:** Queen Status, Brood Health, Stores & Resources, Pest & Disease, General Observations, Acoustic Analysis, Vision AI Analysis
- **Gluestack components:** `Card` (elevated + outline), `Progress`, `Button`, `ButtonText`, `Badge`, `BadgeText`, `BadgeIcon`, `Text`, `Heading`, `Toast`, `ToastTitle`, `ToastDescription`, `Alert`, `AlertText`, `VStack`, `HStack`, `Divider`, `Image`, `Pressable`, `Input`, `InputField`, `ScrollView`
- **Touch targets:** All buttons minimum 48x48px; "Save Inspection" button 56x48px
- **Button hierarchy:** Save (primary solid xl) > Edit (primary outline) > View (secondary link)
- **Local persistence:** MMKV for crash-recovery state; cleared only after successful server completion

### Anti-Patterns to Avoid
- DO NOT auto-complete inspections — require explicit user action via "Save Inspection" button
- DO NOT show colony improvement signal when no positive trend data exists — only display when genuinely positive
- DO NOT use shame language for incomplete or abandoned inspections — frame neutrally or not at all
- DO NOT discard original audio when editing transcriptions — always preserve per FR30a
- DO NOT batch-delete MMKV state before server mutation succeeds — clear only after confirmed completion
- DO NOT skip the post-inspection transcription review when low-confidence entries exist — surface them for correction
- DO NOT fire milestone toasts for previously achieved milestones — check achievement history first
- DO NOT block the summary screen while milestone detection runs — show toast asynchronously
- DO NOT show "Edit Record" and "View Record" buttons before the inspection is saved — only show after completion

### Project Structure Notes
- `apps/mobile/src/features/inspection/components/InspectionSummaryScreen/index.tsx`
- `apps/mobile/src/features/inspection/components/MilestoneAchievementToast/index.tsx`
- `apps/mobile/src/features/inspection/components/NextInspectionSummaryCard/index.tsx`
- `apps/mobile/src/features/inspection/components/TranscriptionReviewQueue/index.tsx`

### References
- [Source: epics.md#Story 8.6 — Pause Resume and Complete Inspection]
- [Source: ux-design-specification.md#Journey 1 — Session summary, follow-up date, progress highlight]
- [Source: ux-design-specification.md#Error Recovery — Session interrupted auto-save]
- [Source: ux-design-specification.md#Voice Capture in High-Noise Environments — Post-inspection review queue]
- [Source: CLAUDE.md#Custom Domain Components — ColonyImprovementSignal, MilestoneAchievementToast, NextInspectionSummaryCard]
- [Source: CLAUDE.md#Offline & Sync Patterns — Session interruption auto-save]
- [Source: CLAUDE.md#Emotional Design & Tone — "Nice work" not "Task complete"]
- [Source: CLAUDE.md#Accessibility Requirements — prefers-reduced-motion]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
