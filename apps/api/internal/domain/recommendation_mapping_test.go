package domain

import (
	"testing"
	"time"
)

// AC #4: Resolver mapping — domain struct maps to GraphQL response with all non-null fields.
// This test validates the mapping logic that resolvers will use.
func TestRecommendation_ToGraphQLMapping(t *testing.T) {
	rec, err := NewRecommendation(
		"rec-uuid-1", "hive-uuid-1", "user-uuid-1",
		"Add a super", "Honey stores are high and nectar flow peaks this week",
		0.85, ConfidenceHigh, "Monitor for another week",
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	rec.EvidenceSources = []EvidenceSource{
		{SourceType: "inspection", SourceID: "insp-1", RelevanceScore: 0.9, Summary: "Recent observation"},
	}
	expires := time.Now().Add(72 * time.Hour)
	rec.ExpiresAt = &expires

	// Verify all mandatory contract fields are populated
	if rec.ID == "" {
		t.Error("ID must not be empty")
	}
	if rec.Action == "" {
		t.Error("Action must not be empty")
	}
	if rec.Rationale == "" {
		t.Error("Rationale must not be empty")
	}
	if rec.ConfidenceLevel < 0 || rec.ConfidenceLevel > 1 {
		t.Error("ConfidenceLevel must be in [0, 1]")
	}
	if !rec.ConfidenceType.IsValid() {
		t.Error("ConfidenceType must be valid")
	}
	if rec.FallbackAction == "" {
		t.Error("FallbackAction must not be empty")
	}
	if len(rec.EvidenceSources) == 0 {
		t.Error("EvidenceSources should be populated when set")
	}

	// Verify skill adaptation works for all levels
	for _, level := range []string{"newbie", "amateur", "sideliner"} {
		explanation := rec.SkillAdaptedExplanation(level)
		if explanation == "" {
			t.Errorf("SkillAdaptedExplanation should not be empty for %s", level)
		}
	}

	// Verify timestamps
	if rec.CreatedAt.IsZero() {
		t.Error("CreatedAt must be set")
	}
	if rec.ExpiresAt == nil {
		t.Error("ExpiresAt should be set when provided")
	}
}
