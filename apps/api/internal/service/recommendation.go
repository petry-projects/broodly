package service

import (
	"context"
	"time"

	"github.com/broodly/api/internal/domain"
)

// RecommendationContext holds all assembled data for recommendation generation.
type RecommendationContext struct {
	HiveID         string
	UserID         string
	SkillLevel     string
	SeasonalPhase  string
	Region         string
	Sources        []ContextSource
	MissingSources []MissingSource
	AssembledAt    time.Time
}

// ContextSource represents a single data source contributing to the recommendation.
type ContextSource struct {
	Type        string    `json:"type"`
	FreshnessAt time.Time `json:"freshnessAt"`
	Data        any       `json:"data"`
	IsStale     bool      `json:"isStale"`
}

// MissingSource records a data source that was expected but unavailable.
type MissingSource struct {
	Type   string `json:"type"`
	Reason string `json:"reason"`
}

// StalenessThresholds defines maximum age for each data category.
type StalenessThresholds struct {
	Weather   time.Duration
	Flora     time.Duration
	Telemetry time.Duration
}

// DefaultStalenessThresholds returns the default staleness thresholds.
func DefaultStalenessThresholds() StalenessThresholds {
	return StalenessThresholds{
		Weather:   24 * time.Hour,
		Flora:     7 * 24 * time.Hour,
		Telemetry: 1 * time.Hour,
	}
}

// RecommendationService generates context-aware recommendations.
type RecommendationService struct {
	thresholds StalenessThresholds
}

// NewRecommendationService creates a new RecommendationService.
func NewRecommendationService() *RecommendationService {
	return &RecommendationService{
		thresholds: DefaultStalenessThresholds(),
	}
}

// AssembleContext gathers all available data sources for recommendation generation.
// Sources and MissingSources are populated when external repositories are injected
// (weather, telemetry, flora). Until integrations are wired, both slices are empty
// and confidence scoring will reflect the absence of data naturally.
func (s *RecommendationService) AssembleContext(
	_ context.Context,
	hiveID, userID, skillLevel, region, season string,
) *RecommendationContext {
	return &RecommendationContext{
		HiveID:        hiveID,
		UserID:        userID,
		SkillLevel:    skillLevel,
		SeasonalPhase: season,
		Region:        region,
		AssembledAt:   time.Now(),
	}
}

// ApplyConfidencePenalty adjusts confidence based on missing/stale data sources.
//
// Confidence type is monotonically downgraded (HIGH→MODERATE→LOW→INSUFFICIENT_DATA).
// Non-standard types (INSUFFICIENT_DATA, CONFLICTING_EVIDENCE, LIMITED_EXPERIENCE)
// are never overridden by penalty rules — only HIGH and MODERATE can be downgraded
// to LOW by the stale-source penalty.
//
// Invariant: the INSUFFICIENT_DATA cap (0.5) is applied before the universal floor
// (0.1) so the floor can never silently override the cap.
func (s *RecommendationService) ApplyConfidencePenalty(
	baseConfidence float64,
	confidenceType domain.ConfidenceType,
	ctx *RecommendationContext,
) (float64, domain.ConfidenceType) {
	penalty := 0.0
	for _, src := range ctx.Sources {
		if src.IsStale {
			penalty += 0.1
		}
	}
	for range ctx.MissingSources {
		penalty += 0.05
	}

	adjusted := baseConfidence - penalty

	// Monotonic downgrade: determine result type before applying numeric bounds.
	resultType := confidenceType
	if len(ctx.MissingSources) >= 3 {
		resultType = domain.ConfidenceInsufficientData
		// Cap applied here (before floor) per domain invariant: INSUFFICIENT_DATA ≤ 0.5.
		if adjusted > 0.5 {
			adjusted = 0.5
		}
	} else if penalty >= 0.3 && (confidenceType == domain.ConfidenceHigh || confidenceType == domain.ConfidenceModerate) {
		// Only downgrade standard levels; never override INSUFFICIENT_DATA or other types.
		resultType = domain.ConfidenceLow
	} else if penalty >= 0.2 && confidenceType == domain.ConfidenceHigh {
		resultType = domain.ConfidenceModerate
	}

	// Universal floor applied after the INSUFFICIENT_DATA cap so it cannot override it.
	if adjusted < 0.1 {
		adjusted = 0.1
	}

	return adjusted, resultType
}

// GenerateConservativeDefault returns a safe, season-aware recommendation when data
// is insufficient. Returns an error if the domain recommendation fails validation.
func (s *RecommendationService) GenerateConservativeDefault(
	hiveID, userID, season string,
) (*domain.Recommendation, error) {
	action := "Perform a routine inspection"
	rationale := "Limited data available — a standard inspection will provide the observations needed for more specific recommendations."
	fallback := "Monitor hive entrance activity and check back in one week."

	switch season {
	case "winter":
		action = "Check food stores"
		rationale = "Winter is a critical period for starvation risk. Without recent data, ensuring adequate stores is the safest action."
		fallback = "If unable to open the hive, heft-test for weight."
	case "spring":
		action = "Check for swarm preparations"
		rationale = "Spring swarm season requires proactive monitoring. Without recent inspection data, checking for queen cells is the priority."
		fallback = "Observe entrance for unusual traffic patterns."
	}

	return domain.NewRecommendation(
		"conservative-default", hiveID, userID,
		action, rationale, 0.3,
		domain.ConfidenceInsufficientData,
		fallback,
	)
}

// DetectSkillMismatch checks behavioral signals for skill level misconfiguration.
func (s *RecommendationService) DetectSkillMismatch(
	skillLevel string,
	educationViewCount int,
	guidedStepDismissalCount int,
	windowDays int,
) *string {
	if windowDays < 14 {
		return nil
	}

	threshold := 5

	if skillLevel == "sideliner" && educationViewCount >= threshold {
		msg := "You've been viewing detailed explanations frequently. Would you like to adjust your experience level for more guided content?"
		return &msg
	}

	if skillLevel == "newbie" && guidedStepDismissalCount >= threshold {
		msg := "You've been skipping guided steps often. Would you like to adjust your experience level for a more streamlined experience?"
		return &msg
	}

	return nil
}
