package domain

import (
	"encoding/json"
	"testing"
)

func validParams() (string, string, string, string, string, float64, ConfidenceType, string) {
	return "rec-1", "hive-1", "user-1",
		"Add a super", "Honey stores are high and nectar flow is strong",
		0.85, ConfidenceHigh, "Monitor for another week"
}

// AC #1: Construction validation — missing mandatory fields
func TestNewRecommendation_RejectsMissingFields(t *testing.T) {
	tests := []struct {
		name           string
		action         string
		rationale      string
		fallbackAction string
		wantErrCode    string
	}{
		{"empty action", "", "rationale", "fallback", "VALIDATION_ERROR"},
		{"empty rationale", "action", "", "fallback", "VALIDATION_ERROR"},
		{"empty fallback", "action", "rationale", "", "VALIDATION_ERROR"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewRecommendation("id", "hive", "user", tt.action, tt.rationale, 0.8, ConfidenceHigh, tt.fallbackAction)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
			domErr, ok := err.(*DomainError)
			if !ok {
				t.Fatalf("expected DomainError, got %T", err)
			}
			if domErr.Code != tt.wantErrCode {
				t.Errorf("expected code %s, got %s", tt.wantErrCode, domErr.Code)
			}
		})
	}
}

func TestNewRecommendation_AcceptsAllValidFields(t *testing.T) {
	id, hiveID, userID, action, rationale, level, cType, fallback := validParams()
	rec, err := NewRecommendation(id, hiveID, userID, action, rationale, level, cType, fallback)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Action != action {
		t.Errorf("action = %s, want %s", rec.Action, action)
	}
	if rec.ConfidenceLevel != level {
		t.Errorf("confidenceLevel = %f, want %f", rec.ConfidenceLevel, level)
	}
}

// AC #2: Confidence level range validation
func TestValidate_ConfidenceLevelRange(t *testing.T) {
	tests := []struct {
		name    string
		level   float64
		wantErr bool
		errCode string
	}{
		{"negative", -0.1, true, "INVALID_CONFIDENCE_LEVEL"},
		{"above one", 1.1, true, "INVALID_CONFIDENCE_LEVEL"},
		{"zero", 0.0, false, ""},
		{"one", 1.0, false, ""},
		{"mid", 0.5, false, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewRecommendation("id", "hive", "user", "action", "rationale", tt.level, ConfidenceHigh, "fallback")
			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				domErr, ok := err.(*DomainError)
				if !ok {
					t.Fatalf("expected DomainError, got %T", err)
				}
				if domErr.Code != tt.errCode {
					t.Errorf("code = %s, want %s", domErr.Code, tt.errCode)
				}
			} else {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
			}
		})
	}
}

// AC #3: Confidence coherence — INSUFFICIENT_DATA with high confidence is rejected
func TestValidate_ConfidenceCoherence(t *testing.T) {
	// INSUFFICIENT_DATA + 0.8 should fail
	_, err := NewRecommendation("id", "hive", "user", "action", "rationale", 0.8, ConfidenceInsufficientData, "fallback")
	if err == nil {
		t.Fatal("expected coherence error for INSUFFICIENT_DATA with 0.8 confidence")
	}
	domErr, ok := err.(*DomainError)
	if !ok {
		t.Fatalf("expected DomainError, got %T", err)
	}
	if domErr.Code != "CONFIDENCE_COHERENCE_ERROR" {
		t.Errorf("code = %s, want CONFIDENCE_COHERENCE_ERROR", domErr.Code)
	}

	// HIGH + 0.9 should pass
	rec, err := NewRecommendation("id", "hive", "user", "action", "rationale", 0.9, ConfidenceHigh, "fallback")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.ConfidenceType != ConfidenceHigh {
		t.Errorf("confidenceType = %s, want HIGH", rec.ConfidenceType)
	}

	// INSUFFICIENT_DATA + 0.3 should pass (within threshold)
	rec2, err := NewRecommendation("id", "hive", "user", "action", "rationale", 0.3, ConfidenceInsufficientData, "fallback")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec2.ConfidenceType != ConfidenceInsufficientData {
		t.Errorf("confidenceType = %s, want INSUFFICIENT_DATA", rec2.ConfidenceType)
	}
}

// AC #5: Evidence serialization — evidenceContext contains structured source references
func TestEvidenceContextJSON(t *testing.T) {
	rec, err := NewRecommendation("id", "hive", "user", "action", "rationale", 0.8, ConfidenceHigh, "fallback")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	rec.EvidenceSources = []EvidenceSource{
		{SourceType: "inspection", SourceID: "insp-1", RelevanceScore: 0.9, Summary: "Recent brood pattern observation"},
		{SourceType: "knowledge_base", SourceID: "kb-1", RelevanceScore: 0.7, Summary: "Spring management best practices"},
		{SourceType: "telemetry", SourceID: "tel-1", RelevanceScore: 0.6, Summary: "Weight increase trend"},
	}

	data, err := rec.EvidenceContextJSON()
	if err != nil {
		t.Fatalf("serialization error: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}

	sources, ok := parsed["sources"].([]any)
	if !ok {
		t.Fatal("expected 'sources' array in evidence context")
	}
	if len(sources) != 3 {
		t.Errorf("expected 3 evidence sources, got %d", len(sources))
	}

	// Verify each source has required fields
	for i, s := range sources {
		src, ok := s.(map[string]any)
		if !ok {
			t.Errorf("source %d: expected map, got %T", i, s)
			continue
		}
		for _, field := range []string{"sourceType", "sourceId", "relevanceScore", "summary"} {
			if _, exists := src[field]; !exists {
				t.Errorf("source %d: missing field %s", i, field)
			}
		}
	}
}

// AC #6: Skill-adapted explanation varies by user skill level
func TestSkillAdaptedExplanation(t *testing.T) {
	rec, err := NewRecommendation("id", "hive", "user", "Add a super", "Honey stores are high", 0.85, ConfidenceHigh, "Monitor for another week")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	newbieExplanation := rec.SkillAdaptedExplanation("newbie")
	sidelinerExplanation := rec.SkillAdaptedExplanation("sideliner")
	amateurExplanation := rec.SkillAdaptedExplanation("amateur")

	// Each skill level should produce a different explanation
	if newbieExplanation == sidelinerExplanation {
		t.Error("newbie and sideliner explanations should differ")
	}
	if newbieExplanation == amateurExplanation {
		t.Error("newbie and amateur explanations should differ")
	}

	// Newbie should contain simple language cues
	if !containsSubstring(newbieExplanation, "simple terms") {
		t.Error("newbie explanation should contain 'simple terms'")
	}

	// Sideliner should contain confidence percentage
	if !containsSubstring(sidelinerExplanation, "85%") {
		t.Error("sideliner explanation should contain confidence percentage")
	}
}

// AC #7: Fallback enforcement — low-confidence recommendations always have non-empty fallbackAction
func TestFallbackEnforcement(t *testing.T) {
	// Low confidence (0.2) with empty fallback should fail
	_, err := NewRecommendation("id", "hive", "user", "action", "rationale", 0.2, ConfidenceLow, "")
	if err == nil {
		t.Fatal("expected error for empty fallback with low confidence")
	}

	// Low confidence with valid fallback should pass
	rec, err := NewRecommendation("id", "hive", "user", "action", "rationale", 0.2, ConfidenceLow, "Safe default action")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.FallbackAction == "" {
		t.Error("fallbackAction should not be empty")
	}

	// High confidence with valid fallback should also pass (fallback always required)
	rec2, err := NewRecommendation("id", "hive", "user", "action", "rationale", 0.9, ConfidenceHigh, "Alternative approach")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec2.FallbackAction == "" {
		t.Error("fallbackAction should not be empty even with high confidence")
	}
}

func TestConfidenceType_IsValid(t *testing.T) {
	valid := []ConfidenceType{ConfidenceHigh, ConfidenceModerate, ConfidenceLow, ConfidenceInsufficientData, ConfidenceConflictingEvidence, ConfidenceLimitedExperience}
	for _, ct := range valid {
		if !ct.IsValid() {
			t.Errorf("%s should be valid", ct)
		}
	}

	invalid := ConfidenceType("INVALID")
	if invalid.IsValid() {
		t.Error("INVALID should not be valid")
	}
}

func containsSubstring(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsStr(s, substr))
}

func containsStr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
