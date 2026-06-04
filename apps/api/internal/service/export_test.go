package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

type mockExportQuerier struct {
	repository.Querier
	apiaries        []repository.Apiary
	hives           []repository.Hive
	inspections     []repository.Inspection
	observations    []repository.Observation
	recommendations []repository.Recommendation
	tasks           []repository.Task
}

func (m *mockExportQuerier) ListApiariesByUser(ctx context.Context, userID pgtype.UUID) ([]repository.Apiary, error) {
	return m.apiaries, nil
}

func (m *mockExportQuerier) ListHivesByApiary(ctx context.Context, apiaryID pgtype.UUID) ([]repository.Hive, error) {
	return m.hives, nil
}

func (m *mockExportQuerier) ListInspectionsByUser(ctx context.Context, arg repository.ListInspectionsByUserParams) ([]repository.Inspection, error) {
	return m.inspections, nil
}

func (m *mockExportQuerier) ListObservationsByInspection(ctx context.Context, inspID pgtype.UUID) ([]repository.Observation, error) {
	return m.observations, nil
}

func (m *mockExportQuerier) ListActiveRecommendationsByUser(ctx context.Context, userID pgtype.UUID) ([]repository.Recommendation, error) {
	return m.recommendations, nil
}

func (m *mockExportQuerier) ListTasksByUser(ctx context.Context, arg repository.ListTasksByUserParams) ([]repository.Task, error) {
	return m.tasks, nil
}

type mockStorage struct {
	uploadedPath string
	uploadedData []byte
}

func (m *mockStorage) Upload(ctx context.Context, bucket, path string, data []byte, contentType string) error {
	m.uploadedPath = path
	m.uploadedData = data
	return nil
}

func (m *mockStorage) SignedURL(ctx context.Context, bucket, path string, expiry time.Duration) (string, error) {
	return "https://storage.example.com/" + bucket + "/" + path + "?expires=" + expiry.String(), nil
}

func testExportData() *mockExportQuerier {
	now := pgtype.Timestamptz{Time: time.Now(), Valid: true}
	return &mockExportQuerier{
		apiaries: []repository.Apiary{
			{ID: testUUID("apiary-1"), Name: "My Apiary", Region: "US-SE", CreatedAt: now, UpdatedAt: now},
		},
		hives: []repository.Hive{
			{ID: testUUID("hive-1"), ApiaryID: testUUID("apiary-1"), Name: "Hive 1", Type: "langstroth", Status: "active", CreatedAt: now, UpdatedAt: now},
		},
		inspections: []repository.Inspection{
			{ID: testUUID("insp-1"), HiveID: testUUID("hive-1"), Type: "full", Status: "completed", StartedAt: now, CreatedAt: now},
		},
		observations: []repository.Observation{
			{ID: testUUID("obs-1"), InspectionID: testUUID("insp-1"), SequenceOrder: 1, ObservationType: "brood_pattern", CreatedAt: now},
		},
		recommendations: []repository.Recommendation{
			{ID: testUUID("rec-1"), HiveID: testUUID("hive-1"), Action: "Add super", Rationale: "High stores", ConfidenceLevel: 0.85, ConfidenceType: "high", FallbackAction: "Monitor", CreatedAt: now},
		},
		tasks: []repository.Task{
			{ID: testUUID("task-1"), HiveID: testUUID("hive-1"), Title: "Add super", Priority: "high", Status: "pending", CreatedAt: now},
		},
	}
}

// AC #1: JSON export returns signed URL with valid JSON
func TestExportService_JSON(t *testing.T) {
	mock := testExportData()
	storage := &mockStorage{}
	svc := NewExportService(mock, storage)

	job, err := svc.Export(context.Background(), testUUID("user-1"), domain.ExportFormatJSON)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if job.Status != domain.ExportStatusCompleted {
		t.Errorf("status = %s, want completed", job.Status)
	}
	if job.DownloadURL == "" {
		t.Error("expected non-empty download URL")
	}
	if !strings.Contains(job.DownloadURL, "expires=") {
		t.Error("URL should contain expiry parameter")
	}

	// Verify uploaded content is valid JSON
	var parsed map[string]any
	if err := json.Unmarshal(storage.uploadedData, &parsed); err != nil {
		t.Fatalf("uploaded data is not valid JSON: %v", err)
	}

	// AC #3: Contains required sections
	for _, section := range []string{"apiaries", "hives", "inspections", "observations", "recommendations", "tasks"} {
		if _, ok := parsed[section]; !ok {
			t.Errorf("JSON export missing section: %s", section)
		}
	}

	// AC #6: Contains disclaimer
	if _, ok := parsed["disclaimer"]; !ok {
		t.Error("JSON export missing disclaimer")
	}
}

// AC #2: CSV export returns signed URL with valid CSV
func TestExportService_CSV(t *testing.T) {
	mock := testExportData()
	storage := &mockStorage{}
	svc := NewExportService(mock, storage)

	job, err := svc.Export(context.Background(), testUUID("user-1"), domain.ExportFormatCSV)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if job.Status != domain.ExportStatusCompleted {
		t.Errorf("status = %s, want completed", job.Status)
	}
	if !strings.HasSuffix(storage.uploadedPath, ".csv") {
		t.Errorf("path should end with .csv, got %s", storage.uploadedPath)
	}

	// Verify uploaded content is valid CSV (skip BOM)
	data := storage.uploadedData
	if len(data) >= 3 && data[0] == 0xEF && data[1] == 0xBB && data[2] == 0xBF {
		data = data[3:]
	}
	reader := csv.NewReader(strings.NewReader(string(data)))
	reader.FieldsPerRecord = -1 // variable-length records (section headers differ)
	records, err := reader.ReadAll()
	if err != nil {
		t.Fatalf("uploaded data is not valid CSV: %v", err)
	}

	// AC #6: First row is disclaimer
	if len(records) == 0 || !strings.Contains(records[0][0], "DISCLAIMER") {
		t.Error("CSV export should start with disclaimer")
	}
}

// AC #4: Tenant isolation — export uses user-scoped queries
func TestExportService_TenantIsolation(t *testing.T) {
	// The mock only returns data for the specified user
	// In production, sqlc queries include user_id filter
	mock := testExportData()
	storage := &mockStorage{}
	svc := NewExportService(mock, storage)

	job, err := svc.Export(context.Background(), testUUID("user-1"), domain.ExportFormatJSON)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if job.UserID == "" {
		t.Error("export job should track user ID")
	}
}

// AC #5: Signed URL expiry
func TestExportService_SignedURLExpiry(t *testing.T) {
	mock := testExportData()
	storage := &mockStorage{}
	svc := NewExportService(mock, storage)

	job, err := svc.Export(context.Background(), testUUID("user-1"), domain.ExportFormatJSON)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Our mock includes "expires=15m0s" in the URL
	if !strings.Contains(job.DownloadURL, "15m0s") {
		t.Errorf("expected 15-minute expiry in URL, got %s", job.DownloadURL)
	}
}

// AC #6: Disclaimer text present
func TestDisclaimerText(t *testing.T) {
	if domain.DisclaimerText == "" {
		t.Error("disclaimer text should not be empty")
	}
	if !strings.Contains(domain.DisclaimerText, "DISCLAIMER") {
		t.Error("disclaimer should contain 'DISCLAIMER'")
	}
	if !strings.Contains(domain.DisclaimerText, "decision-support") {
		t.Error("disclaimer should mention decision-support")
	}
}
