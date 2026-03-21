# Story 12.5: In-App Feedback Prompts

Status: ready-for-dev

## Story

As a system,
I want to present periodic in-app feedback prompts that measure user-reported decision confidence on a 1-5 scale with optional free-text comments, triggered after qualifying inspection activity,
so that we can track product effectiveness and user-perceived value of recommendations over time.

## Acceptance Criteria (BDD)

1. GIVEN a user has completed their 3rd inspection WHEN the inspection is saved THEN a feedback prompt is displayed as a bottom sheet asking "How confident did you feel making decisions this week?" with a 1-5 confidence scale.
2. GIVEN a user has completed fewer than 3 inspections WHEN any inspection is saved THEN no feedback prompt is displayed.
3. GIVEN the feedback prompt is displayed WHEN the user selects a confidence rating (1-5) THEN they can optionally add a free-text comment before submitting.
4. GIVEN the feedback prompt is displayed WHEN the user taps "Not now" or swipes the bottom sheet away THEN the prompt is dismissed and does not appear again for at least 2 weeks.
5. GIVEN a user submitted feedback less than 2 weeks ago WHEN they complete another qualifying inspection THEN no feedback prompt is shown until the 2-week cooldown expires.
6. GIVEN feedback is submitted WHEN the data is stored THEN it is written to the `user_feedback` table linked to the user's most recent 3 recommendations by ID.
7. GIVEN the feedback prompt WHEN it is displayed THEN it never blocks the main workflow -- the user can dismiss it instantly and continue using the app.
8. GIVEN a user submits a confidence rating of 1 or 2 WHEN the feedback is stored THEN the system flags it for review in analytics as a "low confidence" signal.

## Tasks / Subtasks

- [ ] Create `user_feedback` database table and migration (AC: #6, #8)
  - [ ] Schema: id (UUID), user_id (FK), confidence_rating (INTEGER 1-5, CHECK constraint), comment (TEXT nullable), recommendation_ids (UUID[] -- linked recent recommendations), low_confidence_flag (BOOLEAN), prompted_after_inspection_id (FK), created_at
  - [ ] Index on (user_id, created_at) for cooldown checks
  - [ ] Index on (low_confidence_flag, created_at) for analytics queries
  - [ ] Write sqlc queries: InsertFeedback, GetLastFeedbackByUser, ListLowConfidenceFeedback, ListFeedbackByUser
- [ ] Implement feedback trigger logic on client (AC: #1, #2, #5)
  - [ ] Create `apps/mobile/src/features/notifications/hooks/useFeedbackPrompt.ts`
  - [ ] Track inspection count via Zustand store or TanStack Query cache
  - [ ] Trigger conditions: inspection_count >= 3 AND last_feedback_date is null or > 14 days ago
  - [ ] Store `last_feedback_prompted_at` in AsyncStorage for local persistence
  - [ ] Call trigger check after inspection save completes
- [ ] Build feedback bottom sheet component (AC: #1, #3, #7)
  - [ ] Create `apps/mobile/src/features/notifications/components/FeedbackPromptSheet/index.tsx`
  - [ ] Use Gluestack `<Actionsheet>` (bottom sheet per CLAUDE.md: "Bottom sheets for quick confirmations")
  - [ ] Header: `<Heading size="lg">` "How confident did you feel making decisions this week?"
  - [ ] Confidence scale: 5 tappable icons/buttons (1-5) with labels ("Not confident" to "Very confident")
  - [ ] Minimum touch target 48x48px per icon (CLAUDE.md)
  - [ ] Optional `<Input><InputField>` for free-text comment with placeholder "Any thoughts? (optional)"
  - [ ] Submit button: `<Button action="primary" variant="solid">` "Submit"
  - [ ] Dismiss button: `<Button action="secondary" variant="link">` "Not now"
  - [ ] Non-blocking: dismissible at any time, no modal overlay blocking interaction
- [ ] Add GraphQL mutation for feedback submission (AC: #6, #8)
  - [ ] Define `submitFeedback` mutation: confidence_rating (Int!), comment (String), inspection_id (ID!)
  - [ ] Resolver: fetch user's 3 most recent recommendation IDs, set low_confidence_flag if rating <= 2
  - [ ] Return `FeedbackResult` type: id, created_at, linked_recommendation_count
  - [ ] Generate resolvers and TypeScript types
- [ ] Implement dismiss cooldown logic (AC: #4, #5)
  - [ ] On dismiss: store current timestamp in AsyncStorage key `feedback_last_prompted`
  - [ ] On submit: store current timestamp in AsyncStorage key `feedback_last_submitted`
  - [ ] Cooldown check: max(last_prompted, last_submitted) + 14 days < now
  - [ ] Server-side backup: `GetLastFeedbackByUser` query to prevent duplicate submissions if AsyncStorage is cleared
- [ ] Implement recommendation linking (AC: #6)
  - [ ] On feedback submission, server queries user's 3 most recent recommendations
  - [ ] Store recommendation IDs as UUID array in `user_feedback.recommendation_ids`
  - [ ] If fewer than 3 recommendations exist, link whatever is available
- [ ] Implement low-confidence flagging (AC: #8)
  - [ ] Server-side: set `low_confidence_flag = true` when `confidence_rating <= 2`
  - [ ] Expose `listLowConfidenceFeedback` admin query for analytics
  - [ ] Structured log entry for low-confidence submissions for Cloud Monitoring alerting

## Dev Notes

### Architecture Compliance
- Feedback prompt uses bottom sheet (Actionsheet), not modal, per CLAUDE.md navigation patterns: "Bottom sheets for quick confirmations; full modals only for irreversible operations"
- Trigger logic runs client-side based on inspection count and last prompt date, per epics.md tech notes
- Feedback data stored in PostgreSQL for analytics, not just local storage
- Tone follows CLAUDE.md emotional design: calm, supportive. Prompt text is encouraging ("How confident did you feel...") not evaluative ("Rate our app")
- Non-blocking: prompt never interrupts the primary inspection workflow

### TDD Requirements (Tests First!)
- Test 1: **Trigger after 3rd inspection** -- Mock inspection count of 3 and no prior feedback. Assert feedback prompt hook returns `shouldShow: true`.
- Test 2: **No trigger before 3rd inspection** -- Mock inspection count of 2. Assert `shouldShow: false`.
- Test 3: **Cooldown after dismiss** -- Mock last prompted date as 10 days ago. Assert `shouldShow: false`. Mock 15 days ago. Assert `shouldShow: true`.
- Test 4: **Cooldown after submit** -- Mock last submitted date as 7 days ago. Assert `shouldShow: false`.
- Test 5: **Bottom sheet render** -- Render FeedbackPromptSheet. Assert confidence scale (1-5) is displayed, optional comment field is present, Submit and "Not now" buttons are visible.
- Test 6: **Submit flow** -- Simulate selecting rating 4, entering comment "Great tips", tapping Submit. Assert `submitFeedback` mutation called with confidence_rating=4, comment="Great tips".
- Test 7: **Dismiss flow** -- Simulate tapping "Not now". Assert bottom sheet closes and `feedback_last_prompted` is stored in AsyncStorage.
- Test 8: **Low confidence flag** -- Submit feedback with rating 1. Assert server sets `low_confidence_flag=true`. Submit with rating 4. Assert `low_confidence_flag=false`.
- Test 9: **Recommendation linking** -- Given 5 recent recommendations, assert feedback record links the 3 most recent IDs. Given only 1 recommendation, assert it links that 1.

### Technical Specifications
- **Bottom sheet:** Gluestack `<Actionsheet>` with `<ActionsheetContent>`, `<ActionsheetBackdrop>`
- **Confidence scale:** 5 discrete tappable areas, each 48x48px minimum, with labels
- **Cooldown period:** 14 days (configurable via `@broodly/config`)
- **Trigger threshold:** 3 completed inspections minimum
- **Recommendation link count:** 3 most recent
- **Low confidence threshold:** rating <= 2
- **Local storage:** AsyncStorage keys: `feedback_last_prompted`, `feedback_last_submitted`
- **Analytics:** Structured log via `slog` for low-confidence submissions; Cloud Monitoring can alert on frequency

### Anti-Patterns to Avoid
- DO NOT use a modal (`<AlertDialog>`) for feedback -- use bottom sheet (Actionsheet) per CLAUDE.md
- DO NOT block the inspection save flow -- feedback prompt appears after save completes, not during
- DO NOT show the prompt on every inspection -- respect the 2-week cooldown strictly
- DO NOT make the comment field required -- it is always optional
- DO NOT use evaluative language ("Rate us", "How are we doing?") -- use confidence-focused language per emotional design guidelines
- DO NOT store feedback only in AsyncStorage -- server-side storage is required for analytics
- DO NOT link feedback to recommendations that were generated for other users -- scope to current user only

### Project Structure Notes
- `apps/mobile/src/features/notifications/components/FeedbackPromptSheet/index.tsx` -- Bottom sheet component
- `apps/mobile/src/features/notifications/components/FeedbackPromptSheet/FeedbackPromptSheet.test.tsx` -- Component tests
- `apps/mobile/src/features/notifications/hooks/useFeedbackPrompt.ts` -- Trigger logic hook
- `apps/api/graph/schema/feedback.graphql` -- GraphQL schema for feedback
- `apps/api/graph/resolver/feedback_resolver.go` -- Go resolver
- `apps/api/internal/repository/user_feedback.go` -- sqlc queries
- `apps/api/migrations/XXXXXX_create_user_feedback.sql` -- Migration

### References
- [Source: epics.md#Story 12.5: In-App Feedback Prompts]
- [Source: prd.md#FR55b -- Periodic in-app feedback prompts for decision confidence and perceived value]
- [Source: CLAUDE.md#Navigation Patterns -- Bottom sheets for quick confirmations]
- [Source: CLAUDE.md#Emotional Design -- Calm, supportive, recovery-oriented, never punitive]
- [Source: CLAUDE.md#Spacing & Layout -- Minimum touch target 48x48px]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
