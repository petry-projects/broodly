# Story 8.2: Guided Inspection Step Engine

Status: ready-for-dev

## Story

As a beekeeper during inspection,
I want step-by-step observation prompts that adapt to my answers with clear progress indication,
so that I am guided through what to look for without being overwhelmed and can track how far along I am.

## Acceptance Criteria (BDD)

1. GIVEN I have started a full inspection WHEN the guided flow begins THEN observation prompts are rendered one at a time following the "one decision at a time" layout principle, with a step progress indicator showing current step and total steps.
2. GIVEN I am on an observation prompt WHEN I select "queen cells observed" THEN the subsequent prompts adapt to a swarm-risk branching path with additional swarm-related questions.
3. GIVEN I am a Newbie user WHEN prompts render THEN each prompt includes an explanatory description of what to look for and why it matters.
4. GIVEN I am a Sideliner user WHEN prompts render THEN prompts are compact and exception-first, showing only the observation input without extended explanation.
5. GIVEN I am an Amateur user WHEN prompts render THEN prompts show standard detail — observation input with brief context but no extended tutorial text.
6. GIVEN I submit an observation classified as normal WHEN it renders in the step list THEN it displays with success styling (Leaf Green icon + "Normal" label). GIVEN a cautionary observation THEN it displays with warning styling (Dark Amber icon + "Attention" label). GIVEN an urgent observation THEN it displays with error styling (Deep Rust Red icon + "Urgent" label).
7. GIVEN I complete an observation on any step WHEN the observation is captured THEN it is persisted immediately to local storage (MMKV) so no data is lost on crash or interruption.
8. GIVEN I started a quick inspection WHEN the guided flow begins THEN only the abbreviated prompt set is loaded (subset of the full prompt tree).
9. GIVEN the step progress indicator WHEN a screen reader focuses on it THEN it announces "Step [N] of [total], [step title]" as a single accessible description.

## Tasks / Subtasks

- [ ] Define inspection prompt tree data structure (AC: #1, #2, #8)
  - [ ] Create `apps/mobile/src/features/inspection/constants/promptTree.ts` with configurable JSON prompt tree
  - [ ] Define `InspectionPrompt` type: id, title, description (newbie), compactLabel (sideliner), observationType, options, branchConditions, classification (normal/cautionary/urgent)
  - [ ] Define `PromptTreeConfig` with full and quick variants
  - [ ] Implement branching logic: each option can specify a `nextPromptId` override or conditional branch
- [ ] Build adaptive branching engine service (AC: #2, #8)
  - [ ] Create `apps/mobile/src/features/inspection/services/stepEngine.ts`
  - [ ] Implement `getNextPrompt(currentPromptId, selectedOption, inspectionType)` function
  - [ ] Implement `getTotalSteps(inspectionType, observationsSoFar)` for dynamic total calculation
  - [ ] Implement `getPromptsByInspectionType(type: 'full' | 'quick')` to filter prompt set
- [ ] Build InspectionStepScreen component (AC: #1, #3, #4, #5)
  - [ ] Create `apps/mobile/src/features/inspection/components/InspectionStepScreen/index.tsx`
  - [ ] Render single prompt per screen with skill-adaptive content depth
  - [ ] Use `useUserProfile()` hook to determine skill level (newbie/amateur/sideliner)
  - [ ] Newbie: show `<Heading>` title + `<Text size="md">` explanatory description + observation input
  - [ ] Amateur: show `<Heading>` title + `<Text size="sm">` brief context + observation input
  - [ ] Sideliner: show compact `<Text>` label + observation input only
- [ ] Build StepProgressIndicator component (AC: #1, #9)
  - [ ] Create `apps/mobile/src/features/inspection/components/StepProgressIndicator/index.tsx`
  - [ ] Use Gluestack `<Progress>` component with primary-500 fill
  - [ ] Display "Step X of Y" text alongside progress bar
  - [ ] Set `accessibilityLabel` to "Step {N} of {total}, {stepTitle}" for screen reader
  - [ ] Dynamically recalculate total when branching changes the remaining path
- [ ] Build ObservationStatusBadge component (AC: #6)
  - [ ] Create `apps/mobile/src/features/inspection/components/ObservationStatusBadge/index.tsx`
  - [ ] Map observation classification to Gluestack Badge: normal -> `<Badge action="success">`, cautionary -> `<Badge action="warning">`, urgent -> `<Badge action="error">`
  - [ ] Always include icon + text label (never color alone)
- [ ] Implement incremental local persistence (AC: #7)
  - [ ] On each observation submission, write to MMKV via inspectionStore
  - [ ] Store: inspectionId, currentPromptId, observations array, timestamps
  - [ ] Validate persistence by reading back immediately after write
- [ ] Implement observation input controls (AC: #1, #6)
  - [ ] Single-select options using Gluestack `<Radio>` group for mutually exclusive observations
  - [ ] Multi-select options using Gluestack `<Checkbox>` group for additive observations
  - [ ] Free-text input using Gluestack `<Input>` for notes (integrated with voice in Story 8.3)
  - [ ] "Next" button (`<Button action="primary" variant="solid" size="xl">`) to advance to next step

## Dev Notes

### Architecture Compliance
- Prompt tree is a configurable JSON structure, not hardcoded in components — allows future server-driven updates
- Step engine is a pure TypeScript service with no side effects, easily testable
- Observations persist incrementally to MMKV per NFR9d crash resilience requirement
- Feature components live in `apps/mobile/src/features/inspection/components/`
- Skill-level adaptation is handled at the component logic layer, not via separate component variants per CLAUDE.md customization strategy

### TDD Requirements (Tests First!)
- Test 1: **One prompt at a time** — Render InspectionStepScreen with a mock prompt tree and assert only one prompt is visible at a time with a progress indicator.
- Test 2: **Adaptive branching** — Call `getNextPrompt` with "queen cells observed" option selected and assert the returned prompt is from the swarm-risk branch, not the default linear path.
- Test 3: **Skill-level adaptation (newbie)** — Render InspectionStepScreen as a Newbie user and assert explanatory description text is present.
- Test 4: **Skill-level adaptation (sideliner)** — Render InspectionStepScreen as a Sideliner user and assert no explanatory description is present, only compact label.
- Test 5: **Status classification rendering** — Render ObservationStatusBadge with classification "cautionary" and assert a warning badge with icon and "Attention" text is rendered.
- Test 6: **Incremental persistence** — Submit an observation and assert the MMKV store contains the observation with correct inspectionId and timestamp.
- Test 7: **Quick mode subset** — Call `getPromptsByInspectionType('quick')` and assert the returned prompts are a strict subset of the full prompt tree.
- Test 8: **Progress indicator accessibility** — Render StepProgressIndicator at step 3 of 8 with title "Queen Status" and assert accessibilityLabel is "Step 3 of 8, Queen Status".

### Technical Specifications
- **Prompt tree format:** JSON-serializable TypeScript objects with `InspectionPrompt[]` and branch conditions as `Record<optionId, nextPromptId>`
- **Gluestack components:** `Progress`, `Radio`, `RadioGroup`, `Checkbox`, `CheckboxGroup`, `Input`, `InputField`, `Card`, `Button`, `ButtonText`, `Badge`, `BadgeText`, `BadgeIcon`, `Heading`, `Text`
- **Touch targets:** All observation options minimum 48x48px; "Next" button 56x48px
- **Status semantics mapping:** normal -> success, cautionary -> warning, urgent -> error (per CLAUDE.md status semantics table)
- **Local persistence:** MMKV via `react-native-mmkv` for crash-safe incremental writes

### Anti-Patterns to Avoid
- DO NOT render all prompts on a single scrollable screen — strictly one decision at a time per UX spec
- DO NOT hardcode branching logic in components — keep it in the step engine service
- DO NOT batch-persist observations at the end — persist each one immediately per NFR9d
- DO NOT use color alone for observation status — always include icon + text label
- DO NOT make the prompt tree immutable at build time — design for future server-driven prompt updates
- DO NOT calculate progress as a simple fraction of a fixed total — account for dynamic branching that changes the total

### Project Structure Notes
- `apps/mobile/src/features/inspection/constants/promptTree.ts`
- `apps/mobile/src/features/inspection/services/stepEngine.ts`
- `apps/mobile/src/features/inspection/components/InspectionStepScreen/index.tsx`
- `apps/mobile/src/features/inspection/components/StepProgressIndicator/index.tsx`
- `apps/mobile/src/features/inspection/components/ObservationStatusBadge/index.tsx`
- `apps/mobile/src/features/inspection/types/index.ts`

### References
- [Source: epics.md#Story 8.2 — Observation Capture Structured Prompts and Adaptive Flow]
- [Source: ux-design-specification.md#Journey 1 — Step-by-step inspection flow]
- [Source: ux-design-specification.md#Experience Mechanics — One decision at a time]
- [Source: CLAUDE.md#Layout Principles — One decision at a time during inspection flow]
- [Source: CLAUDE.md#Status Semantics — Gluestack Action Mapping]
- [Source: architecture.md#Frontend Architecture — Zustand + TanStack Query]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
