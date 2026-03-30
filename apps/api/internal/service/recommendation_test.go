package service

import (
	"context"
	"testing"
	"time"

	"github.com/broodly/api/internal/domain"
)

func TestAssembleContext(t *testing.T) {
	svc := NewRecommendationService()

	t.Run("includes user and hive identifiers", func(t *testing.T) {
		ctx := svc.AssembleContext(context.Background(), "hive-1", "user-1", "amateur", "Oregon", "spring")
		if ctx.HiveID != "hive-1" {
			t.Errorf("expected hive-1, got %s", ctx.HiveID)
		}
		if ctx.UserID != "user-1" {
			t.Errorf("expected user-1, got %s", ctx.UserID)
		}
		if ctx.SkillLevel != "amateur" {
			t.Errorf("expected amateur, got %s", ctx.SkillLevel)
		}
	})

	t.Run("includes seasonal phase and region", func(t *testing.T) {
		ctx := svc.AssembleContext(context.Background(), "h", "u", "newbie", "London", "summer")
		if ctx.SeasonalPhase != "summer" {
			t.Errorf("expected summer, got %s", ctx.SeasonalPhase)
		}
		if ctx.Region != "London" {
			t.Errorf("expected London, got %s", ctx.Region)
		}
	})

	t.Run("flags missing context sources with reason", func(t *testing.T) {
		ctx := svc.AssembleContext(context.Background(), "h", "u", "newbie", "OR", "spring")
		if len(ctx.MissingSources) == 0 {
			t.Error("expected missing sources to be flagged")
		}
		found := false
		for _, ms := range ctx.MissingSources {
			if ms.Type == "weather" && ms.Reason != "" {
				found = true
			}
		}
		if !found {
			t.Error("expected weather missing source with reason")
		}
	})

	t.Run("sets assembled timestamp", func(t *testing.T) {
		before := time.Now()
		ctx := svc.AssembleContext(context.Background(), "h", "u", "newbie", "OR", "spring")
		if ctx.AssembledAt.Before(before) {
			t.Error("assembled timestamp should be at or after test start")
		}
	})
}

func TestApplyConfidencePenalty(t *testing.T) {
	svc := NewRecommendationService()

	t.Run("no penalty with fresh sources", func(t *testing.T) {
		ctx := &RecommendationContext{
			Sources: []ContextSource{
				{Type: "inspection", IsStale: false},
			},
		}
		conf, ct := svc.ApplyConfidencePenalty(0.8, domain.ConfidenceHigh, ctx)
		if conf != 0.8 {
			t.Errorf("expected 0.8, got %f", conf)
		}
		if ct != domain.ConfidenceHigh {
			t.Errorf("expected HIGH, got %s", ct)
		}
	})

	t.Run("downgrades with stale sources", func(t *testing.T) {
		ctx := &RecommendationContext{
			Sources: []ContextSource{
				{Type: "weather", IsStale: true},
				{Type: "telemetry", IsStale: true},
			},
		}
		conf, ct := svc.ApplyConfidencePenalty(0.8, domain.ConfidenceHigh, ctx)
		if conf >= 0.8 {
			t.Errorf("expected reduced confidence, got %f", conf)
		}
		if ct != domain.ConfidenceModerate {
			t.Errorf("expected MODERATE after penalty, got %s", ct)
		}
	})

	t.Run("INSUFFICIENT_DATA when many sources missing", func(t *testing.T) {
		ctx := &RecommendationContext{
			MissingSources: []MissingSource{
				{Type: "weather", Reason: "unavailable"},
				{Type: "telemetry", Reason: "unavailable"},
				{Type: "flora", Reason: "unavailable"},
			},
		}
		conf, ct := svc.ApplyConfidencePenalty(0.9, domain.ConfidenceHigh, ctx)
		if ct != domain.ConfidenceInsufficientData {
			t.Errorf("expected INSUFFICIENT_DATA, got %s", ct)
		}
		if conf > 0.5 {
			t.Errorf("expected confidence capped at 0.5, got %f", conf)
		}
	})

	t.Run("confidence never goes below 0.1", func(t *testing.T) {
		ctx := &RecommendationContext{
			Sources: []ContextSource{
				{IsStale: true}, {IsStale: true}, {IsStale: true},
				{IsStale: true}, {IsStale: true}, {IsStale: true},
			},
			MissingSources: []MissingSource{
				{}, {}, {}, {},
			},
		}
		conf, _ := svc.ApplyConfidencePenalty(0.3, domain.ConfidenceLow, ctx)
		if conf < 0.1 {
			t.Errorf("expected minimum 0.1, got %f", conf)
		}
	})
}

func TestGenerateConservativeDefault(t *testing.T) {
	svc := NewRecommendationService()

	t.Run("generates valid recommendation", func(t *testing.T) {
		r := svc.GenerateConservativeDefault("hive-1", "user-1", "spring")
		if r == nil {
			t.Fatal("expected recommendation, got nil")
		}
		if r.Action == "" {
			t.Error("expected non-empty action")
		}
		if r.Rationale == "" {
			t.Error("expected non-empty rationale")
		}
		if r.FallbackAction == "" {
			t.Error("expected non-empty fallback")
		}
		if r.ConfidenceType != domain.ConfidenceInsufficientData {
			t.Errorf("expected INSUFFICIENT_DATA, got %s", r.ConfidenceType)
		}
	})

	t.Run("winter recommendation focuses on food stores", func(t *testing.T) {
		r := svc.GenerateConservativeDefault("h", "u", "winter")
		if r.Action != "Check food stores" {
			t.Errorf("expected food stores action, got: %s", r.Action)
		}
	})

	t.Run("spring recommendation focuses on swarm prep", func(t *testing.T) {
		r := svc.GenerateConservativeDefault("h", "u", "spring")
		if r.Action != "Check for swarm preparations" {
			t.Errorf("expected swarm prep action, got: %s", r.Action)
		}
	})
}

func TestDetectSkillMismatch(t *testing.T) {
	svc := NewRecommendationService()

	t.Run("no mismatch within first 14 days", func(t *testing.T) {
		result := svc.DetectSkillMismatch("sideliner", 10, 0, 7)
		if result != nil {
			t.Error("expected nil for short window")
		}
	})

	t.Run("detects sideliner viewing too many explanations", func(t *testing.T) {
		result := svc.DetectSkillMismatch("sideliner", 5, 0, 14)
		if result == nil {
			t.Fatal("expected mismatch suggestion")
		}
		if *result == "" {
			t.Error("expected non-empty suggestion")
		}
	})

	t.Run("detects newbie dismissing guided steps", func(t *testing.T) {
		result := svc.DetectSkillMismatch("newbie", 0, 5, 14)
		if result == nil {
			t.Fatal("expected mismatch suggestion")
		}
	})

	t.Run("no mismatch for amateur with normal usage", func(t *testing.T) {
		result := svc.DetectSkillMismatch("amateur", 3, 2, 14)
		if result != nil {
			t.Error("expected nil for normal usage")
		}
	})

	t.Run("requires sustained pattern not single instance", func(t *testing.T) {
		result := svc.DetectSkillMismatch("sideliner", 2, 0, 14)
		if result != nil {
			t.Error("expected nil for below threshold")
		}
	})
}
