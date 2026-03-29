---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
classification:
  projectType: mobile_app
  domain: general
  complexity: medium
  projectContext: greenfield
inputDocuments:
  - /workspaces/bmad-method/_bmad-output/planning-artifacts/product-brief-bmad-method-2026-03-15.md
  - /workspaces/bmad-method/_bmad-output/planning-artifacts/research/domain-beekeeping-research-2026-03-15.md
  - /workspaces/bmad-method/_bmad-output/planning-artifacts/research/market-beekeeping-app-improve-outcomes-research-2026-03-15.md
  - /workspaces/bmad-method/_bmad-output/brainstorming/brainstorming-session-2026-03-14-134719.md
documentCounts:
  briefCount: 1
  researchCount: 2
  brainstormingCount: 1
  projectDocsCount: 0
workflowType: prd
projectName: bmad-method
author: Humans
date: 2026-03-15
workflow_completed: true
---

# Product Requirements Document - bmad-method

**Author:** Humans
**Date:** 2026-03-15

## Executive Summary

bmad-method is a mobile-first beekeeping decision platform designed to improve colony outcomes by turning ambiguity into clear, context-aware next actions. It serves three segments—Newbie, Amateur, and Sideliner beekeepers—through a skill-adaptive guidance model that adjusts depth while preserving operational clarity in-field. The core problem addressed is not data scarcity, but decision uncertainty at high-impact moments (inspection interpretation, feeding/treatment timing, swarm-risk prevention, and multi-apiary prioritization). The product combines personal history, seasonal/local context, and optional telemetry to recommend what to do now, why it matters, and what happens if delayed. Success is measured by increased beekeeper confidence, reduced preventable losses, and improved consistency of weekly management workflows.

### What Makes This Special

This product is differentiated by a confidence-first recommendation contract: each action is explainable, localized, and adapted to user skill level rather than presented as generic static advice. The key insight is that beekeepers need trustworthy decisions, not more disconnected dashboards. bmad-method operationalizes this through a unified workflow: seasonal planning + guided inspections + structured logging + context-aware prioritization. For beginners, this reduces fear and indecision; for advanced operators, it reduces operational overhead and missed opportunities across many hives and locations. The result is a single “next best action” system that improves both behavioral execution and biological outcomes.

## Project Classification

- Project Type: mobile_app
- Domain: general (beekeeping/agri workflow product)
- Complexity: medium
- Project Context: greenfield

## Success Criteria

### User Success

- Newbie users can complete a guided inspection workflow end-to-end without external help in their first week.
- Users report higher decision confidence for feed/treat/split actions after onboarding and first month of active use.
- Users reduce preventable colony-loss drivers by acting earlier on prioritized, context-aware recommendations.
- Multi-hive users complete weekly high-priority action queues with lower planning overhead and fewer missed tasks.

### Business Success

- 3-month success: validate repeat weekly usage and confidence improvement in the Newbie segment with measurable retention lift.
- 12-month success: achieve durable adoption across Newbie, Amateur, and Sideliner tiers with improving paid conversion.
- Revenue signal: trial-to-paid conversion improves quarter-over-quarter, with premium-value features driving higher-tier adoption.
- Market signal: sustained month-over-month growth in qualified trials (users completing onboarding and first core workflow).

### Technical Success

- Recommendation engine provides explainable outputs (action, rationale, confidence) with localization and skill-level adaptation.
- Mobile workflows remain field-practical: fast task start, resilient logging, and reliable operation during inspection conditions.
- Integrations (telemetry/weather/flora where connected) measurably alter recommendation priority, not just display data.
- Data integrity and portability are maintained through structured logs and exportable records.

### Measurable Outcomes

- Week-4 retention: at least 35% of activated users.
- Weekly core-workflow completion: at least 60% of weekly active users.
- Trial-to-paid conversion: at least 8% by month 6, at least 12% by month 12.
- Positive value feedback (“helps me decide confidently”): at least 75% agreement.
- Monthly qualified-trial growth: at least 10% MoM.
- Outcome trend target: season-over-season improvement in the ratio of recommended-action-taken to recommended-action-ignored for high-priority items, as a proxy for decision-quality improvement. Direct colony outcome tracking is a post-MVP instrumentation goal requiring user-reported seasonal outcome surveys.
- Time-to-first-recommendation: median time from account creation to first personalized recommendation delivered shall be under 10 minutes.

## Product Scope

### MVP - Minimum Viable Product

- Localized, skill-adaptive decision guidance for weekly planning and in-inspection “next best action.”
- Guided inspection flow with structured logging and recommendation rationale/confidence.
- Milestone-based skill progression tied to user activity and learning progress.
- Vision AI inspection analysis that surfaces interpretable findings with confidence-aware guidance. Scope note: Vision AI is elevated from the product brief's future vision into MVP based on field research indicating that visual interpretation uncertainty is a primary driver of newbie decision paralysis. MVP scope is limited to common inspection photo types (brood pattern, queen cells, pest signs) with a minimum 70% interpretable-result rate on supported categories. If accuracy targets are not met in beta, Vision AI degrades to media-capture-only with manual tagging.
- Baseline planning calendar and prioritized weekly action queue.
- Baseline multi-hive and multi-location: MVP supports up to 5 locations and 100 hives per account with single-user management. Batch operations, route optimization, and multi-user location management are post-MVP.
- Core onboarding that captures context needed to generate immediate personalized value.
- Foundational integration layer for local context and telemetry-ready recommendations.
- Core success instrumentation for retention, workflow completion, confidence, and conversion.

### Growth Features (Post-MVP)

- Advanced predictive capabilities (e.g., swarm-risk forecasting) and richer optimization controls.
- Expanded multi-location efficiency tooling and deeper operational analytics.
- Advanced integrations and automation workflows for power users.
- Enhanced monetization tiers aligned to Amateur/Sideliner operational needs.

### Vision (Future)

- Be the operating intelligence layer for beekeeping decisions across planning, inspection, and outcomes.
- Deliver increasingly proactive, explainable guidance that improves with each user season.
- Create a trusted, longitudinal decision system that materially improves survivability, productivity, and beekeeper confidence.

## User Journeys

### Primary User - Success Path (Newbie: Hannah, first spring)

Hannah opens the app before her weekend inspection because she is anxious about doing harm by doing the wrong thing. The onboarding memory already knows her region, hive count, goals, and comfort level, so her home screen shows a short, localized this-week checklist instead of generic tips. During inspection, she uses guided prompts and voice capture; when she sees dead bees at the entrance, the app labels this as seasonally normal with confidence and asks for follow-up cues before recommending action.

The critical moment comes when she must decide whether to feed, treat, or wait: the app gives one prioritized next step, rationale, and a safe fallback. She completes the inspection with confidence, logs actions in under a minute, and leaves with a clear next review date.

Emotional arc: anxious -> guided -> confident.

Capabilities revealed: localized guidance gate, skill-adaptive walkthroughs, explainable recommendations, voice-first structured logging, confidence and fallback model.

### Primary User - Edge Case (Amateur: Marcus, conflicting priorities)

Marcus manages two locations and wants honey yield, but a swarm-risk window appears during nectar flow. He opens the weekly decision queue expecting simple reminders; instead, he sees conflicting high-impact tasks and limited weekend time. The app detects overdue swarm-cell checks, combines telemetry and local context, and presents a ranked plan with tradeoff explanation. At the decision point, Marcus chooses a honey-biased plan but receives a catch-up branch with non-optional risk checks. Midday weather changes force a partial completion; the app reorders remaining actions by urgency and travel efficiency so he still closes critical risks.

Emotional arc: overloaded -> conflicted -> in control.

Capabilities revealed: priority engine, tradeoff-aware recommendation layer, deferred-task recovery, dynamic re-planning, multi-location queue management.

### Primary Advanced User - Operational Scale (Sideliner: Elena, 50+ hives)

Elena starts each week needing operational clarity, not education. Her dashboard opens at operation level with grouped actions by apiary and action type (feed, super, inspect, treat), plus seasonal risk indicators. In the field she uses compact, exception-first inspection mode and voice-to-action logging because hands are occupied and speed matters.

The value climax occurs when the app flags an imminent missed opportunity early enough for intervention, preventing a costly loss. End-of-day she reviews completed versus deferred actions and sees economic-impact estimates for priority decisions.

Emotional arc: fragmented -> streamlined -> optimized.

Capabilities revealed: operation-level planning, batch actions, fast inspection mode, risk escalation logic, outcome-impact tracking.

### Secondary User - Admin and Ops Journey

The account owner configures permissions, data policy, and notification behavior across hives and locations. They add a mentor and partner as read-only collaborators, define sensitivity rules for location and financial fields, and set escalation preferences by season and apiary risk. A critical operations moment happens when alerts are too noisy; admin tuning suppresses low-value notifications while preserving high-risk escalation paths.

Emotional arc: cautious -> confident governance.

Capabilities revealed: role-based access for read-only collaborators, configurable escalation policies, privacy controls, audit visibility for access and actions.

### Secondary User - Support and Troubleshooting Journey

A user reports that the app told them to wait and now they are worried they missed treatment timing. Support opens a case timeline with the exact recommendation shown, confidence level, evidence sources (local norm, personal history, telemetry), and user actions taken or not taken. They identify that telemetry sync lag reduced confidence and trigger a guided recovery workflow for the user.

The key moment is transparent root-cause explanation without blaming the user, preserving trust and retention.

Emotional arc: defensive and frustrated -> reassured and recovered.

Capabilities revealed: recommendation traceability, evidence audit trail, confidence history, recovery playbooks, support tooling.

### Integration User - API and Partner Journey

An integration engineer connects hive sensors and validates that inbound data changes recommendations in near real time. They authenticate, map hive identifiers, run test payloads, and verify that priority rankings and inspection prompts adapt when weight and temperature events arrive. The critical moment is proving integration value beyond data display: recommendation outputs and alerts must change measurably.

Emotional arc: skeptical -> validated.

Capabilities revealed: integration APIs and webhooks, identity mapping, ingestion validation, recommendation-impact verification, monitoring and health checks.

### Journey Requirements Summary

- Guidance core: localized, skill-adaptive, explainable next-best-action engine with confidence and fallback.
- Execution UX: guided and fast inspection modes, voice-first structured logging, dynamic re-planning under constraints.
- Operations layer: multi-hive and multi-location prioritization, batching, seasonal risk calendar, escalation controls.
- Trust and governance: recommendation traceability, role-based access, privacy controls, support-grade auditability.
- Integration backbone: telemetry ingestion, mapping and validation, and proof that integration changes decision outputs.

### Edge Case - Recommendation Outcome Failure (Trust Recovery)

Hannah followed the app's recommendation to delay treatment. Two weeks later, her colony shows severe mite damage. She returns to the app angry and distrustful. The system surfaces the original recommendation with its confidence level (which was moderate, not high) and the evidence context at the time. It acknowledges the outcome, offers a recovery action plan, and adjusts future recommendation calibration for her profile. The key moment: the app does not hide or excuse the outcome — it explains the decision basis transparently and provides a concrete recovery path.

Emotional arc: angry and betrayed -> heard and understood -> cautiously re-engaged.

Capabilities revealed: outcome tracking linked to recommendations, transparent post-hoc explanation, recommendation recalibration, recovery workflow generation.

### Edge Case - Abandoned Onboarding Recovery

A new user begins onboarding but closes the app after entering region but before completing hive setup. On return, the system restores onboarding state and resumes from the last completed step. If the user skips optional steps, the system generates guidance using available context and flags areas where missing information limits recommendation quality.

Capabilities revealed: onboarding state persistence, progressive context enrichment, degraded-but-functional guidance with missing profile data.

## Domain-Specific Requirements

### Compliance and Regulatory

- No major sector-specific certification appears mandatory for MVP, but the product should be designed to support jurisdiction-aware guidance because beekeeping practices, treatment options, and reporting expectations vary by region.
- Recommendation outputs must avoid presenting uncertain guidance as authoritative; low-confidence cases should explicitly downgrade certainty and direct users to local extension or expert validation.
- If the product later supports loss-reporting or compliance exports such as USDA-linked documentation, record structure should be designed now to avoid expensive retrofit later.
- Privacy compliance should cover standard consumer data protections for account, location, and operational records, with clear consent for optional integrations and data sharing.
- The product shall display a persistent, accessible disclaimer that recommendations are decision-support tools and do not constitute professional veterinary, agricultural, or legal advice. This disclaimer shall be: (a) accepted during onboarding before first recommendation is shown, (b) accessible from any recommendation detail view, (c) included in exported records.
- Treatment recommendations shall include: "Verify treatment suitability for your specific conditions. The app cannot assess whether procedures were performed correctly."

### Technical Constraints

- Guidance must be localized by region and seasonal phase; generic advice is a product failure, not just a UX issue.
- Recommendation logic must expose confidence and evidence source so users can understand why an action is suggested.
- Field workflows must tolerate low-connectivity conditions, interrupted inspections, and partial data.
- Logging must be fast and multimodal, with voice/media-first entry and structured correction after capture.
- Multi-hive and multi-location support is a first-class constraint across data model, notifications, planning, and navigation.
- Voice recognition shall support a beekeeping-specific vocabulary model or custom glossary to improve accuracy for domain terms (e.g., varroa, propolis, brood, nuc, supersedure, absconding, robbing, nosema). The system shall allow users to train or correct recurring misrecognitions to improve per-user accuracy over time.
- Cards that require user action (tappable, navigational) must be visually distinct from informational cards. Actionable cards shall include a primary-colored left border indicator and navigation chevron. Informational cards shall have no action affordance. This distinction must be consistent across all screens.

### Integration Requirements

- Guidance must be localized by region and seasonal phase; generic advice is a product failure, not just a UX issue.
- Recommendation logic must expose confidence and evidence source so users can understand why an action is suggested.
- Field workflows must tolerate low-connectivity conditions, interrupted inspections, and partial data.
- Logging must be fast and multimodal, with voice/media-first entry and structured correction after capture.
- Multi-hive and multi-location support is a first-class constraint across data model, notifications, planning, and navigation.

### Integration Requirements

- Weather and bloom-context integrations need to inform recommendation timing, not just enrich screens.
- Telemetry integrations must alter prioritization, alerts, and inspection prompts in measurable ways.
- External flora or habitat sources should be integrated rather than rebuilt internally.
- Export capability should support JSON/CSV portability from launch so users can retain ownership of records and histories.

### Risk Mitigations

- Wrong advice risk: require confidence scoring, evidence attribution, and safe fallback actions.
- Localization failure risk: block or visibly degrade recommendations when region/season context is weak.
- Telemetry trust risk: surface sync status, stale-data indicators, and confidence downgrades when integrations are incomplete.
- Adoption risk: keep inspection flows short, voice-first, and useful on day one through personalized onboarding.
- Notification fatigue risk: allow configurable escalation and suppression rules tied to seasonal urgency.
- Data lock-in risk: include export and collaborator access controls from MVP.

## Innovation & Novel Patterns

### Detected Innovation Areas

- Confidence-first recommendation contract: every action includes rationale, confidence, and safe fallback rather than opaque advice.
- Personal-baseline plus local-norm fusion: decisions are grounded in both regional seasonal context and user-specific historical patterns.
- Unified operational flow: planning, guided inspection, and structured logging operate as one decision system instead of separate tools.
- Multi-persona rendering on one decision engine: Newbie, Amateur, and Sideliner each get different guidance depth without fragmenting core logic.
- Telemetry-to-action linkage: integration value is defined by changed recommendations, not passive dashboards.
- Vision AI inspection analysis extends the recommendation loop by turning captured imagery into interpretable inspection evidence rather than passive media storage.
- Acoustic colony analysis via device microphone: Users can capture a short hive-entrance audio sample during inspection. The system uses ML-based acoustic classification to surface colony-state signals (queenright confidence, agitation level, swarm-readiness indicators) as additional evidence inputs to the recommendation engine. This provides sensor-grade colony intelligence without requiring dedicated hardware, differentiating from sensor-dependent competitors.

### Market Context & Competitive Landscape

- Many beekeeping solutions provide logs, reminders, or raw telemetry, but fewer provide explainable, context-aware next-best-action guidance.
- Existing alternatives commonly fail at localization depth, recommendation transparency, or cross-persona usability in one workflow.
- Competitive differentiation here comes from execution quality of trust: accurate prioritization, understandable reasoning, and field-practical UX.
- This positions the product as an operational decision layer rather than a data viewer or journal app.

### Validation Approach

- Run field pilots across Newbie and Sideliner cohorts; compare decision confidence and task completion against baseline behaviors.
- Instrument recommendation acceptance and override rates to detect where trust is strong or weak.
- Validate telemetry impact by A/B checking whether connected data changes priority ranking and outcomes.
- Track measurable outcomes tied to innovation claims: reduced preventable misses, faster decision time, and improved weekly workflow completion.
- Use confidence calibration checks: high-confidence recommendations should correlate with stronger outcome reliability.

### Risk Mitigation

- If recommendation trust underperforms, default to conservative safe-action modes with stronger uncertainty messaging.
- If telemetry quality is inconsistent, degrade gracefully and visibly to history-plus-local-context recommendations.
- If personalization is sparse for new users, rely on robust regional baselines until personal history matures.
- If multi-persona UX becomes complex, preserve one core decision model and adjust only presentation depth.
- If innovation claims are not validated early, re-scope to strongest proven wedge: localized explainable inspection support.

## Mobile App Specific Requirements

### Project-Type Overview

bmad-method is a field-first mobile product where the core value is fast, trustworthy decision support during real inspections.
The mobile experience must optimize for intermittent connectivity, hands-busy workflows, and short high-stakes decision windows, while preserving explainability and user trust across skill levels.

### Technical Architecture Considerations

- Mobile architecture should prioritize low-latency task flows (open app -> start inspection -> capture observation -> receive next action) with resilient local state.
- Recommendation delivery should support graceful degradation when integrations are stale or unavailable, while preserving confidence signaling.
- Structured logging and recommendation traceability must be available on-device for in-field continuity and post-session sync.
- Multi-hive and multi-location context should be first-class in navigation and local data models to avoid single-hive bottlenecks.

### Platform Requirements

- MVP platform strategy should support both major mobile ecosystems (iOS and Android) with consistent core workflows.
- Core parity is required for onboarding, weekly planning, guided inspections, logging, recommendations, and alert handling.
- Performance targets should prioritize time to first meaningful action in field conditions over visual complexity.
- Accessibility and readability standards should be enforced for outdoor usage (glare, quick scanning, larger tap targets).

### Device Permissions

- Microphone: required for voice-first logging and hands-busy capture.
- Camera and Photos: required for media-assisted inspection records and optional image-based analysis workflows.
- Location: required for localization gate (region and season context); should support explicit user control and fallback behaviors.
- Notifications: required for seasonal urgency and escalation logic.
- Permissions must be progressive and purpose-specific (request only at the moment of feature use), with clear trust messaging for why each permission matters.

### Offline Mode

- Users must be able to run inspection workflows and capture logs with no network.
- Core recommendation flow should continue using last-known local and seasonal context and clearly label degraded confidence when live data is unavailable.
- Sync architecture should support queued writes, conflict-safe merges, and user-visible sync status.
- Offline failure handling must preserve user work first, then reconcile in background when connectivity returns.

### Push Strategy

- Notification model must be risk- and season-aware, not fixed-frequency.
- Escalation should be configurable by persona and apiary (for example stronger escalation in swarm-risk windows, lower noise outside critical periods).
- Alerts should be actionable and context-rich: what changed, why it matters, and the fastest safe next step.
- Notification fatigue safeguards are required: suppression windows, bundling, and user-tunable thresholds.

### Store Compliance

- App behavior and permissions must align with platform store policies for privacy, background processing, and health/safety-adjacent guidance language.
- Recommendation copy should avoid overclaiming certainty; uncertainty and safe fallback language should be explicit.
- Data handling disclosures must clearly cover location, media, telemetry, and export capabilities.
- Release process should include policy pre-checks for permission usage narratives and consent flows.

### Implementation Considerations

- Build the recommendation contract (action + rationale + confidence + fallback) as a reusable mobile domain primitive across screens.
- Treat onboarding as data foundation for mobile relevance: without region, goals, and skill context, downstream mobile UX quality drops sharply.
- Instrument mobile-specific operational metrics: inspection start latency, completion rates under poor connectivity, sync reliability, and notification action rates.
- Sequence delivery so MVP proves the core field loop first, then expands into advanced predictive and optimization features.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

MVP Approach: Problem-solving MVP with trust-first execution (prove the app helps users make better decisions in real inspections, not just track data).

Resource Requirements: Small cross-functional core team (mobile plus backend/integration plus product/design plus domain validation support) focused on one high-confidence loop before expansion.

### MVP Feature Set (Phase 1)

Core User Journeys Supported:
- Newbie guided inspection success path.
- Amateur weekly prioritization with risk-aware task ordering.
- Sideliner operational view for high-priority actions across locations (lean version).

Must-Have Capabilities:
- Localization gate (region plus seasonal context required before guidance).
- Explainable recommendation contract (action plus rationale plus confidence plus safe fallback).
- Guided inspection flow with voice-first structured logging.
- Milestone-based skill progression that reflects user maturity over time.
- Vision AI inspection analysis for image-assisted interpretation during core inspection workflows.
- Weekly decision queue with essential prioritization logic.
- Baseline multi-hive and multi-location data model and navigation.
- Offline-tolerant capture plus deferred sync.
- Notification system with configurable seasonal urgency (lean controls).
- Core metrics instrumentation for confidence, completion, retention, and conversion.
- Data export (JSON and CSV) and read-only collaborator access baseline.

### Post-MVP Features

Phase 2 (Post-MVP):
- Stronger tradeoff controls (honey versus swarm-risk biasing).
- Advanced telemetry-driven triggers and richer integration automation.
- Enhanced operations features (batch workflows, deeper multi-location optimization).
- Improved support and audit tooling and recommendation trace depth.
- Early predictive models where data quality supports reliability.
- Regional activity signals: surface anonymized, aggregated management-activity patterns from users in the same climate zone as contextual decision support (e.g., treatment timing consensus, feeding activity trends).
- Mentor-mentee pairing: optional structured mentorship connections with shared visibility into hive status (permission-gated), enabling guided coaching within the platform.
- Compliance-formatted record exports: generate jurisdiction-aware inspection, treatment, and hive-movement reports compatible with state apiary program requirements.
- Conversational inspection Q&A: voice-driven, context-aware question answering during inspections, using RAG over curated domain knowledge combined with user hive context.
- AI-generated inspection narratives: after each inspection, automatically generate a human-readable summary report from structured observations, photos, and voice notes.
- Predictive colony trajectory modeling: per-colony health trajectory projections based on longitudinal inspection data, telemetry, and regional patterns.

Phase 3 (Expansion):
- Mature predictive intelligence (for example swarm-risk forecasting at higher confidence).
- Expanded ecosystem and compliance outputs (for example advanced reporting pathways).
- Broader market extensions and premium operational tiers.

### Risk Mitigation Strategy

Technical Risks:
- Highest risk: recommendation accuracy and trust under variable data quality.
- Mitigation: confidence calibration, explicit degraded modes, and phased rollout of advanced prediction.

Market Risks:
- Highest risk: users perceive another logging app rather than decision value.
- Mitigation: MVP centers on in-inspection next-action clarity and measurable confidence and outcome improvements.

Resource Risks:
- Highest risk: over-scoped MVP delays learning.
- Mitigation: enforce strict phase gates; defer non-core differentiators unless they improve the proving loop directly.

Liability Risks:
- Highest risk: recommendations are advisory, not professional veterinary or agricultural guidance. If a user follows guidance and loses colonies, there is potential legal exposure.
- Mitigation: terms of service must include explicit disclaimers. In-app recommendation language must consistently frame actions as suggestions with user discretion emphasized. Legal review of recommendation copy is required before launch.

AI Inference Cost Risks:
- Highest risk: Vision AI and recommendation engine inference costs may exceed sustainable per-user thresholds at scale.
- Mitigation: model per-user-per-month AI costs and monitor against revenue targets. Implement usage-based throttling or tiered access if per-user AI costs exceed sustainable thresholds.
- Vision AI scope gate: if image-analysis precision on the MVP validation set does not reach 70% by the end of beta, Vision AI will be descoped to media capture with manual tagging and deferred to Phase 2.

Seasonal Usage Concentration Risks:
- Highest risk: active usage will spike sharply in spring/early summer and drop in winter. Infrastructure must handle 3-5x peak-to-trough load variation.
- Mitigation: retention and engagement metrics must be interpreted with seasonal normalization. Winter engagement features (e.g., season review, next-season planning, skill progression) should be considered for post-MVP to reduce churn during off-season.

## Functional Requirements

### User Identity, Profiles, and Access

- FR1a: A user can create an account using Google and Apple Sign-In.
- FR1b: A user can update account settings including display name.
- FR1c: (Removed — social login providers handle account recovery natively.)
- FR1d: A user can delete their account and all associated data.
- FR2: A user can set and update a beekeeper profile including experience level, goals, and operating preferences.
- FR2a: The system shall allow users to modify all onboarding-provided profile data (experience level, region, apiary name, hive count, goals, interaction preference) at any time from the Settings screen, with immediate effect on recommendation depth, seasonal context, and interaction mode.
- FR2b: A new user must complete a guided onboarding flow that captures region, apiary name, hive count, hive configuration, experience level, management focus (sliding scale between honey production and making splits as competing priorities), and interaction preference (voice-first vs tap) before the system generates personalized guidance. Colony health is always prioritized regardless of management focus setting.
- FR2c: The system shall block or visibly degrade guidance quality if required onboarding context (region, experience level) is incomplete.
- FR2e: The system shall support progressive profile enrichment, allowing future versions to collect additional personalization details (e.g., hive types, queen marking preferences, treatment history, mentor relationship) without requiring re-onboarding. The profile data model shall be extensible so that new fields can be added and populated incrementally from settings or contextual prompts.
- FR2d: The system shall monitor user behavior for signals of skill-level mismatch (e.g., an "Experienced" user frequently viewing educational explanations, or a "Newbie" user consistently dismissing guided steps) and suggest profile adjustment.
- FR3: A user can register, edit, and manage multiple apiary locations.
- FR4: A user can register and manage multiple hives within each location.
- FR5: An account owner can grant read-only access to designated collaborators.
- FR5a: The system shall display an auditable access history log showing all collaborator permission changes with timestamps.
- FR6: An account owner can revoke collaborator access.
- FR7: The system can maintain an auditable history of collaborator access changes.

### Localization and Context Intelligence

- FR8: The system can determine and maintain a user’s active regional and seasonal context.
- FR8a: The system shall detect when a user’s device location significantly diverges from their registered apiary locations and prompt for confirmation or re-registration.
- FR8b: When a user registers apiaries in a new region, the system shall reset seasonal context for those apiaries to the new region’s baseline and clearly inform the user that personal history from a prior region will not be used for seasonal timing recommendations in the new location until local history is established.
- FR9: The system can prevent or clearly flag guidance when required localization context is unavailable.
- FR10: The system can incorporate local weather context into guidance decisions.
- FR10a: The system shall display regional hive scale weight averages on the homepage, sourced from beecounted.org or equivalent public scale network. Data shall show average daily weight change for the user's area with freshness timestamp.
- FR11: The system can incorporate bloom/flora context into guidance decisions.
- FR11a: The system shall allow users to apply microclimate adjustments to their apiary's seasonal context, including elevation offset and observed bloom timing relative to regional baseline.
- FR11b: When a user consistently overrides or delays acting on regionally-timed recommendations, the system shall detect this pattern and suggest a microclimate adjustment.
- FR11c: The system shall integrate with beecounted.org (or equivalent regional scale weight network) to provide local nectar flow indicators alongside weather and bloom data.
- FR12: The system can combine user history and regional context when generating recommendations.
- FR12a: The system shall maintain a jurisdiction-aware treatment registry that flags treatments by legal status (approved, restricted, prescription-required, prohibited) for each supported region.
- FR12b: The system shall never recommend a treatment flagged as prohibited in the user's registered jurisdiction. Treatments flagged as restricted or prescription-required shall include a visible regulatory notice and a directive to consult local authorities or a veterinarian before use.
- FR12b2: The app shall offer a 'Live Mode' option, accessible from a persistent Live Mode EQ icon (amber gradient equalizer bars) in the top app bar (next to the Notifications bell icon) on every authenticated screen. When activated, Live Mode verbally summarizes all current context to the user via TTS: weather changes, bloom status, scale weight trends, pending actions, and any alerts. This enables a hands-free briefing from any screen without navigating back to the homepage. The homepage may additionally feature a Live Mode entry card for discoverability.
- FR12c: When the jurisdiction registry does not have data for a user's region, treatment recommendations shall include a disclaimer: "Treatment regulations vary by location — verify legality with your local agricultural authority before use."

### Planning and Prioritization

- FR13: A user can view a current-week prioritized action queue across hives and locations. The weekly planning view shall prominently feature a Live Discussion Mode entry point at the top, allowing users to begin voice-driven plan review immediately without additional taps.
- FR13a: The weekly planning view shall display a 'Required Materials' checklist before the action queue, listing supplies and equipment needed for the week's planned activities (e.g., treatments, supers, syrup, splitting equipment). Materials shall be linked to the specific hive/action requiring them. This section is shown only when materials are needed.
- FR14: The system can rank actions by urgency and expected outcome impact.
- FR15: A user can view a seasonal planning calendar of recommended activities.
- FR16: Overdue tasks shall be highlighted within their apiary and hive context (e.g., with an URGENT badge and warning styling) rather than surfaced as a separate negative card. The weekly plan shall maintain a constructive tone. The system shall surface catch-up guidance inline with the overdue item.
- FR16b: A user can defer, reschedule, or dismiss a queued action with optional reason capture, and the system shall adjust remaining priorities accordingly.
- FR17: A user can view risk-themed seasonal signals (for example swarm, starvation, pest pressure, queen risk).
- FR18: The system can update priorities when new relevant context is received.

### Guided Inspection and Decision Support

- FR19: A user can start a VOICE-FIRST guided inspection workflow for a selected hive. Upon entering each inspection step, the system shall immediately begin listening for voice input. The system shall prompt the user conversationally through each step, process voice responses, and advance to the next step when the user indicates completion (e.g., says "done", "next", or "skip"). Manual UI interaction shall not be required for any inspection step. The inspection mode shall be designed as a continuous beeyard session, not a per-hive session. The user starts once and flows through all hives that need attention.
- FR19a: The system shall present a safety awareness checklist before a user's first guided inspection FOR NEWBIE PERSONA ONLY, covering protective equipment, sting allergy risk, and emergency preparedness. The checklist must be acknowledged before the inspection workflow begins. Amateur and Sideliner personas shall skip directly to the inspection flow. The checklist appears for the Newbie's first 3 inspections, then becomes optional.
- FR19b: Each guided inspection step shall present the prompt as a conversational voice message from the system, display the user's voice response as a live transcript, provide real-time acknowledgment, and offer a clear way to advance (voice command "done"/"next"/"skip" or tap fallback). No card-based option selection shall be required.
- FR19c (CRITICAL — Key Differentiator): The system shall support a continuous, hands-free beeyard session where the user can inspect multiple hives sequentially without touching the device. Once in inspection mode, the user navigates between hives via voice commands (e.g., 'next hive', 'move to Hive 4', 'done with this hive'). All observations, actions, and media triggers are voice-driven. UI tapping shall be available as a fallback but shall never be required for any beeyard workflow. This zero-tap beeyard experience is a core product differentiator.
- FR19d: The system shall maintain per-hive context during a continuous multi-hive session. When the user moves to the next hive, the system shall: (1) save all observations for the current hive, (2) announce the next hive's context (last inspection, current status, recommended inspection type), (3) begin guided steps for the new hive. Voice command 'which hive am I on?' shall confirm current hive context.
- FR20: The system can adapt inspection guidance based on voice observations captured during the session. The system shall process natural language descriptions and extract structured observations in real-time, providing conversational acknowledgment and follow-up questions.
- FR21: The system can provide a recommended next action during inspection.
- FR21a: After completing the observation steps of an inspection, the system shall initiate a voice-driven discussion about the next scheduled action for this hive. The system proposes a follow-up date and type based on observations; the user can agree, modify, or decline via voice. This agreed follow-up is auto-scheduled without requiring any UI taps.
- FR22: The system can provide rationale for each recommendation.
- FR23: The system can provide a confidence level for each recommendation.
- FR24: The system can provide a safe fallback action when recommendation confidence is limited.
- FR25: A user can complete a shortened inspection path for time-constrained sessions.
- FR25b: A user can pause and resume an in-progress inspection workflow, with the system preserving captured observations and adapting remaining guidance to the resumed context.
- FR25c: The inspection flow shall include all required steps (minimum 5: entrance assessment, brood inspection, queen cell check, overall colony assessment, action planning) with each step being voice-driven and conversationally guided.
- FR26: The system can distinguish and communicate normal versus cautionary versus urgent observations.

### Logging, Records, and Data Portability

- FR27: A user can create inspection records using voice input as the PRIMARY interaction mode. Voice listening shall begin automatically at each inspection step. The system shall NOT use the term "recording" — instead use "listening" to describe the active voice capture state. Tap-based input shall be available as a fallback but shall not be the default interaction. Voice commands shall include hive navigation: 'next hive', 'move to [hive name]', 'go back to [hive name]', 'which hive am I on?', 'how many hives left?', 'end session'.
- FR28: A user can add media-based observations to hive records.
- FR29: The system can convert captured inputs into structured, action-typed records.
- FR29a: Inspection follow-up actions agreed during the voice-driven post-step discussion (FR21a) shall be automatically scheduled without requiring the user to tap a button. The inspection summary shall display the scheduled follow-up as a confirmation (e.g., 'Re-inspect Mar 28 — scheduled') rather than as an action requiring user input.
- FR30: A user can review and correct structured records after capture.
- FR30a: The system shall retain original audio recordings for voice-captured observations to support post-session correction.
- FR30b: The system shall flag voice entries with low transcription confidence for user review during a post-inspection correction step.
- FR30c: The system shall provide a post-session review screen ('Evening Review') available after the user leaves the beeyard. This review presents all hives inspected during the session with: captured observations, voice transcripts, photos/videos, AI analysis results, and recommended follow-up actions. The user can correct transcriptions, add notes, confirm or adjust observations, add additional photos/videos via a "+" action, and approve follow-up scheduling from this screen — all via tap-based UI (since they're no longer in the field).
- FR31: The system can maintain longitudinal hive and action history.
- FR31a: The hive detail screen shall include an 'Activity Log' view showing a reverse chronological list of all actions logged for the hive, including inspections, treatments, observations, and system events. Each entry shall show date, action type, summary, and any associated media.
- FR32: A user can export their records in JSON format.
- FR33: A user can export their records in CSV format.

### Learning Progression and Inspection Intelligence

- FR34: A user can view milestone-based skill progression tied to completed activities and learning progress.
- FR35: The system can adapt guidance depth based on the user’s current skill progression state.
- FR36: A user can capture inspection imagery for automated analysis during inspection workflows.
- FR37: The system can surface interpretable inspection findings from captured imagery with associated confidence.
- FR38: The system can use image-derived findings as additional evidence in recommendation generation.

### Notifications and Operational Alerts

- FR39: The system can send actionable notifications tied to seasonal and operational risk.
- FR40: The system shall provide global notification controls including on/off toggle, quiet hours, and seasonal escalation auto-adjustment. Per-apiary sensitivity controls are NOT required for MVP. Additionally, the system shall provide per-category notification toggles allowing users to independently enable or disable each notification type: Seasonal Risk Alerts, Telemetry Alerts, Inspection Reminders, Task & Follow-Up Reminders, Skill Milestone Notifications, and Feedback Prompts.
- FR40a2: The system shall provide a 'Notification Types' informational screen accessible from notification settings that displays each notification category with a description, example notification, and the toggle to control it. Categories: Seasonal Risk Alerts (swarm, starvation, pest, queen), Telemetry Alerts (weight anomalies, temperature events), Inspection Reminders (overdue or upcoming inspections), Task & Follow-Up Reminders (pending actions, escalations), Skill Milestones (progression achievements), and Feedback Prompts (periodic decision-confidence surveys).
- FR40b: The system shall support notification quiet hours with configurable start/end times.
- FR41: The system can escalate unresolved high-priority alerts.
- FR42: The system can suppress or reduce low-value notifications based on user settings.
- FR43: Notifications can include contextual reason and recommended next step.

### Integrations and External Data

- FR44: A user can connect supported telemetry providers.
- FR44a: The system shall display connected integration status with freshness indicators and allow disconnect while preserving historical data.
- FR45: The system can ingest telemetry linked to specific hives and locations.
- FR46: The system can indicate telemetry freshness and sync status.
- FR46a: When the user has configured weight telemetry access, the homepage shall display a 'Your Hives' scale weight card showing per-hive weight trends from the user's own connected sensors, in addition to the regional average card.
- FR47: The system can adjust recommendation priority based on connected telemetry.
- FR47a: The system shall apply plausibility checks to incoming telemetry data before using it to trigger alerts or alter recommendation priority. Single-reading anomalies (e.g., sudden large weight change without corroborating temperature or prior trend signals) shall be flagged as "unconfirmed sensor reading" rather than treated as confirmed events.
- FR47b: Telemetry-triggered urgent alerts shall require corroboration from at least one additional signal (e.g., sustained trend over multiple readings, corroborating sensor type, or seasonal plausibility) before escalating to push notification level.
- FR48: The system can continue operating with degraded guidance when integrations are unavailable.
- FR48a: The system shall track and expose freshness timestamps for each external context source (weather, bloom/flora, telemetry) independently.
- FR48b: The system shall apply confidence penalties to recommendations when any contributing external context source exceeds its defined staleness threshold, and shall communicate which source is degraded.
- FR48c: The system shall define maximum acceptable staleness thresholds per external data category (e.g., weather: 24 hours, bloom/flora: 7 days, telemetry: configurable per sensor type).
- FR49: A user can disconnect integrations while preserving historical records.

### Supportability, Trust, and Governance

- FR50: A support role can review the recommendation history associated with a user-reported issue.
- FR51: The system can preserve recommendation evidence context (history, local signals, telemetry status, and image-analysis status) for troubleshooting.
- FR52: The system can support recovery guidance flows after missed or delayed actions.
- FR53: The system can retain an auditable trail of recommendation and user action events relevant to trust and support.
- FR54: The system can present uncertainty explicitly to users when evidence is incomplete.
- FR54a: The system shall distinguish between low confidence due to conflicting evidence and low confidence due to insufficient data, and communicate each state differently to users.
- FR54b: The system shall allow users to report that a recommendation led to a negative outcome, and shall store this feedback linked to the recommendation evidence context for calibration review.
- FR54c: The system shall flag recommendation scenarios where the training data or regional baseline coverage is below a defined threshold, and present these as "limited experience" rather than a numeric confidence score.
- FR55: The system can enforce role-appropriate visibility for sensitive account data.
- FR55b: The system can present periodic in-app feedback prompts to measure user-reported decision confidence and perceived value.
- FR56: A user can capture a short audio recording of hive activity during an inspection workflow.
- FR57: The system can analyze hive audio recordings to surface colony-state indicators (e.g., queenright confidence, agitation, swarm readiness) with associated confidence levels.
- FR58: The system can incorporate audio-derived colony-state indicators as evidence inputs to recommendation generation.

## Non-Functional Requirements

### Performance

- NFR1: The system shall load the primary operational home screen within 2 seconds under normal mobile network conditions.
- NFR2: The system shall return a recommendation response within 2 seconds for typical in-session inspection inputs when required context is available.
- NFR3: The system shall allow creation of a voice-first inspection log entry in 60 seconds or less for standard workflows.
- NFR4: The system shall preserve usable interaction performance on commonly used modern mobile devices across supported OS versions.
- NFR5: The system shall return image-analysis results for standard inspection photos within 5 seconds under normal network conditions or provide explicit pending-state feedback when longer processing is required.
- NFR5b: The system shall achieve voice-to-text transcription accuracy of at least 90% word accuracy for common beekeeping terminology under typical outdoor noise conditions.

### Reliability and Availability

- NFR6: The system shall provide graceful degraded operation for core inspection and logging workflows during temporary network loss.
- NFR7: The system shall queue offline writes and synchronize them once connectivity is restored without user data loss.
- NFR8: The system shall achieve monthly service availability of at least 99.5% for core planning and recommendation services.
- NFR9: The system shall provide visible sync-status indicators when local and server state are not yet aligned.
- NFR9b: The system shall perform automated backups of all user data with a recovery point objective (RPO) of no more than 4 hours and a recovery time objective (RTO) of no more than 2 hours.
- NFR9c: The system shall retain user hive records and recommendation history for at least 3 years from creation, or until account deletion is requested.
- NFR9d: Each observation, voice capture, and action logged during an inspection session shall be persisted to local storage incrementally as it is captured, not batched at session completion. If the app terminates unexpectedly, the user shall be able to resume from the last persisted observation.

### Security and Privacy

- NFR10: The system shall encrypt user data in transit and at rest.
- NFR11: The system shall enforce role-based access controls for account owner and collaborator permissions.
- NFR12: The system shall support user-controlled data export and account-level access revocation.
- NFR13: The system shall log security-relevant access and permission-change events for auditability.
- NFR14: The system shall collect only required permission scopes and provide purpose-specific consent messaging for location, microphone, camera, and notifications.
- NFR14b: The system shall complete account deletion and associated data purge within 30 days of user request, consistent with GDPR Article 17 and comparable privacy regulations.

### Scalability

- NFR15: The system architecture shall support at least 5,000 concurrent active users without requiring fundamental redesign of recommendation, queue, or sync subsystems. Initial MVP baseline shall be documented at launch and the 10x target recalibrated.
- NFR16: The system shall maintain core recommendation and queue responsiveness with less than 10% degradation under planned seasonal peak usage loads.
- NFR17: The system shall support multi-location, multi-hive accounts at Sideliner scale within defined MVP and post-MVP limits.
- NFR17a: Explicit scale tiers: MVP must support up to 50 hives across up to 5 locations; Post-MVP Phase 2 must support up to 250 hives across up to 15 locations; Phase 3 targets TBD based on usage data.
- NFR17b: Weekly action queues exceeding 20 items per apiary shall be paginated or grouped by action type with counts, rather than rendered as a flat list.
- NFR17c: Action queue computation for accounts exceeding 100 hives shall use progressive loading — display highest-priority apiary within 2 seconds and load remaining apiaries in background.

### Accessibility and Usability Quality

- NFR18: The mobile experience shall conform to WCAG 2.1 AA principles for key user journeys.
- NFR19: The system shall support readable, high-contrast, outdoor-usable interaction patterns for core inspection and planning screens.
- NFR20: The system shall provide interaction targets and flow structures usable in hands-busy field contexts.

### Integration Quality

- NFR21: The system shall detect and surface telemetry freshness and staleness status for connected integrations.
- NFR22: The system shall degrade recommendation confidence when required external inputs are stale or unavailable.
- NFR23: The system shall support version-tolerant integration contracts to minimize disruption from provider-side API changes.
- NFR23b: The system shall enforce rate limits on integration API endpoints, with documented thresholds per provider, and return standard HTTP 429 responses when limits are exceeded.

### Observability and Trust

- NFR24: The system shall maintain traceability for recommendation output, including confidence level and contributing evidence context.
- NFR25: The system shall capture product telemetry needed to measure confidence impact, workflow completion, and recommendation acceptance and override behavior.
- NFR26: The system shall expose operational health metrics and alerting for critical sync, recommendation, notification, and image-analysis pipelines.
- NFR27: The system shall suppress high-confidence visual-analysis conclusions when model confidence falls below the defined trust threshold and present a fallback guidance path instead.
- NFR28: The system shall achieve at least 80% precision on supported inspection image categories (brood pattern assessment, queen cell detection, pest/disease indicators) as measured against expert-labeled validation sets before production deployment.

### Developer Experience and Local Tooling

- NFR29: The development environment shall use Firebase Auth Emulator for local development and testing, eliminating the need for real Firebase credentials during development workflows.
- NFR30: The repository shall include documented environment variable templates (`.env.example`) for all required configuration, enabling new developers to bootstrap local environments without tribal knowledge.
- NFR31: The CD pipeline shall inject Firebase configuration (API keys, native config files) from CI secrets during build and deploy, with no manual credential distribution required.
- NFR32: Firebase project infrastructure (project, web app, auth providers) shall be provisioned via Terraform, ensuring environment parity and reproducible setup across dev, staging, and production.
