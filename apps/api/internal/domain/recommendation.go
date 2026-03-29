package domain

import (
	"encoding/json"
	"fmt"
	"time"
)

// ConfidenceType classifies the nature of a recommendation's confidence assessment.
type ConfidenceType string

const (
	ConfidenceHigh                ConfidenceType = "HIGH"
	ConfidenceModerate            ConfidenceType = "MODERATE"
	ConfidenceLow                 ConfidenceType = "LOW"
	ConfidenceInsufficientData    ConfidenceType = "INSUFFICIENT_DATA"
	ConfidenceConflictingEvidence ConfidenceType = "CONFLICTING_EVIDENCE"
	ConfidenceLimitedExperience   ConfidenceType = "LIMITED_EXPERIENCE"
)

func (ct ConfidenceType) IsValid() bool {
	switch ct {
	case ConfidenceHigh, ConfidenceModerate, ConfidenceLow,
		ConfidenceInsufficientData, ConfidenceConflictingEvidence, ConfidenceLimitedExperience:
		return true
	}
	return false
}

// EvidenceSource tracks the provenance of data supporting a recommendation.
type EvidenceSource struct {
	SourceType     string  `json:"sourceType"`
	SourceID       string  `json:"sourceId"`
	RelevanceScore float64 `json:"relevanceScore"`
	Summary        string  `json:"summary"`
}

// DomainError represents a typed business rule violation.
type DomainError struct {
	Code      string
	Message   string
	Retryable bool
}

func (e *DomainError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Recommendation is the core domain type for AI-generated recommendations.
// All five contract fields (Action, Rationale, ConfidenceLevel, ConfidenceType, FallbackAction) are mandatory.
type Recommendation struct {
	ID              string
	HiveID          string
	UserID          string
	Action          string
	Rationale       string
	ConfidenceLevel float64
	ConfidenceType  ConfidenceType
	FallbackAction  string
	EvidenceContext map[string]any
	EvidenceSources []EvidenceSource
	SourceVersions  map[string]any
	CreatedAt       time.Time
	ExpiresAt       *time.Time
}

// NewRecommendation constructs a Recommendation with mandatory field validation.
func NewRecommendation(
	id, hiveID, userID string,
	action, rationale string,
	confidenceLevel float64,
	confidenceType ConfidenceType,
	fallbackAction string,
) (*Recommendation, error) {
	r := &Recommendation{
		ID:              id,
		HiveID:          hiveID,
		UserID:          userID,
		Action:          action,
		Rationale:       rationale,
		ConfidenceLevel: confidenceLevel,
		ConfidenceType:  confidenceType,
		FallbackAction:  fallbackAction,
		CreatedAt:       time.Now(),
	}
	if err := r.Validate(); err != nil {
		return nil, err
	}
	return r, nil
}

// Validate checks all business rules for the Recommendation contract.
func (r *Recommendation) Validate() error {
	if r.Action == "" {
		return &DomainError{Code: "VALIDATION_ERROR", Message: "action is required", Retryable: false}
	}
	if r.Rationale == "" {
		return &DomainError{Code: "VALIDATION_ERROR", Message: "rationale is required", Retryable: false}
	}
	if r.FallbackAction == "" {
		return &DomainError{Code: "VALIDATION_ERROR", Message: "fallbackAction is required", Retryable: false}
	}
	if !r.ConfidenceType.IsValid() {
		return &DomainError{Code: "VALIDATION_ERROR", Message: "invalid confidence type", Retryable: false}
	}

	// Confidence level range check
	if r.ConfidenceLevel < 0.0 || r.ConfidenceLevel > 1.0 {
		return &DomainError{Code: "INVALID_CONFIDENCE_LEVEL", Message: "confidenceLevel must be between 0.0 and 1.0", Retryable: false}
	}

	// Coherence check: INSUFFICIENT_DATA cannot have high confidence
	if r.ConfidenceType == ConfidenceInsufficientData && r.ConfidenceLevel > 0.5 {
		return &DomainError{
			Code:      "CONFIDENCE_COHERENCE_ERROR",
			Message:   "INSUFFICIENT_DATA confidence type cannot have confidence level above 0.5",
			Retryable: false,
		}
	}

	return nil
}

// EvidenceContextJSON returns the evidence context serialized as JSON bytes.
func (r *Recommendation) EvidenceContextJSON() ([]byte, error) {
	if r.EvidenceContext == nil && len(r.EvidenceSources) == 0 {
		return nil, nil
	}
	ctx := r.EvidenceContext
	if ctx == nil {
		ctx = make(map[string]any)
	}
	if len(r.EvidenceSources) > 0 {
		ctx["sources"] = r.EvidenceSources
	}
	return json.Marshal(ctx)
}

// SkillAdaptedExplanation returns a plain-language explanation adapted to the user's skill level.
func (r *Recommendation) SkillAdaptedExplanation(skillLevel string) string {
	switch skillLevel {
	case "newbie":
		return fmt.Sprintf(
			"We recommend: %s. Here's why in simple terms: %s. If you're unsure, a safe alternative is: %s.",
			r.Action, r.Rationale, r.FallbackAction,
		)
	case "amateur":
		return fmt.Sprintf(
			"Recommended action: %s. Rationale: %s. Alternative approach: %s.",
			r.Action, r.Rationale, r.FallbackAction,
		)
	case "sideliner":
		return fmt.Sprintf(
			"%s — %s (confidence: %.0f%%, fallback: %s)",
			r.Action, r.Rationale, r.ConfidenceLevel*100, r.FallbackAction,
		)
	default:
		return fmt.Sprintf(
			"Recommended action: %s. Rationale: %s. Alternative approach: %s.",
			r.Action, r.Rationale, r.FallbackAction,
		)
	}
}
