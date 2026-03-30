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
	Type       string    `json:"type"`
	FreshnessAt time.Time `json:"freshnessAt"`
	Data       any       `json:"data"`
	IsStale    bool      `json:"isStale"`
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
func (s *RecommendationService) AssembleContext(
	_ context.Context,
	hiveID, userID, skillLevel, region, season string,
) *RecommendationContext {
	ctx := &RecommendationContext{
		HiveID:        hiveID,
		UserID:        userID,
		SkillLevel:    skillLevel,
		SeasonalPhase: season,
		Region:        region,
		AssembledAt:   time.Now(),
	}

	// In production: fetch from repositories and external APIs
	// For now, mark all optional sources as missing
	ctx.MissingSources = append(ctx.MissingSources,
		MissingSource{Type: "weather", Reason: "weather integration not configured"},
		MissingSource{Type: "telemetry", Reason: "no telemetry devices connected"},
		MissingSource{Type: "flora", Reason: "flora database not available"},
	)

	return ctx
}

// ApplyConfidencePenalty adjusts confidence based on missing/stale data sources.
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
	if adjusted < 0.1 {
		adjusted = 0.1
	}

	// Downgrade confidence type if significant penalty.
	// Order matters: most severe condition (missing sources) wins.
	resultType := confidenceType
	if len(ctx.MissingSources) >= 3 {
		resultType = domain.ConfidenceInsufficientData
		if adjusted > 0.5 {
			adjusted = 0.5
		}
	} else if penalty >= 0.3 {
		resultType = domain.ConfidenceLow
	} else if penalty >= 0.2 && confidenceType == domain.ConfidenceHigh {
		resultType = domain.ConfidenceModerate
	}

	return adjusted, resultType
}

// GenerateConservativeDefault returns a safe recommendation when data is insufficient.
func (s *RecommendationService) GenerateConservativeDefault(
	hiveID, userID, season string,
) *domain.Recommendation {
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

	r, err := domain.NewRecommendation(
		"conservative-default", hiveID, userID,
		action, rationale, 0.3,
		domain.ConfidenceInsufficientData,
		fallback,
	)
	if err != nil {
		return nil
	}
	return r
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
