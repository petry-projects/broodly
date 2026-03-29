package service

import (
	"context"
	"testing"

	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/event"
	"github.com/broodly/api/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

type mockInspQuerier struct {
	repository.Querier
	inspections []repository.Inspection
	observations []repository.Observation
	obsCount    int64
	maxSeq      interface{}
	publishedEvents []event.Event
}

func (m *mockInspQuerier) CreateInspection(ctx context.Context, arg repository.CreateInspectionParams) (repository.Inspection, error) {
	insp := repository.Inspection{
		ID:     testUUID("insp-new"),
		HiveID: arg.HiveID,
		UserID: arg.UserID,
		Type:   arg.Type,
		Status: arg.Status,
	}
	m.inspections = append(m.inspections, insp)
	return insp, nil
}

func (m *mockInspQuerier) GetInspectionByIDAndUser(ctx context.Context, arg repository.GetInspectionByIDAndUserParams) (repository.Inspection, error) {
	for _, i := range m.inspections {
		if i.ID == arg.ID && i.UserID == arg.UserID {
			return i, nil
		}
	}
	return repository.Inspection{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "not found"}
}

func (m *mockInspQuerier) GetInspectionByID(ctx context.Context, id pgtype.UUID) (repository.Inspection, error) {
	for _, i := range m.inspections {
		if i.ID == id {
			return i, nil
		}
	}
	return repository.Inspection{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "not found"}
}

func (m *mockInspQuerier) PauseInspection(ctx context.Context, id pgtype.UUID) (repository.Inspection, error) {
	for i, insp := range m.inspections {
		if insp.ID == id {
			m.inspections[i].Status = "paused"
			return m.inspections[i], nil
		}
	}
	return repository.Inspection{}, nil
}

func (m *mockInspQuerier) ResumeInspection(ctx context.Context, id pgtype.UUID) (repository.Inspection, error) {
	for i, insp := range m.inspections {
		if insp.ID == id {
			m.inspections[i].Status = "in_progress"
			return m.inspections[i], nil
		}
	}
	return repository.Inspection{}, nil
}

func (m *mockInspQuerier) CompleteInspection(ctx context.Context, arg repository.CompleteInspectionParams) (repository.Inspection, error) {
	for i, insp := range m.inspections {
		if insp.ID == arg.ID {
			m.inspections[i].Status = "completed"
			return m.inspections[i], nil
		}
	}
	return repository.Inspection{}, nil
}

func (m *mockInspQuerier) CountObservationsByInspection(ctx context.Context, id pgtype.UUID) (int64, error) {
	return m.obsCount, nil
}

func (m *mockInspQuerier) GetMaxSequenceOrder(ctx context.Context, id pgtype.UUID) (interface{}, error) {
	return m.maxSeq, nil
}

func (m *mockInspQuerier) CreateObservation(ctx context.Context, arg repository.CreateObservationParams) (repository.Observation, error) {
	obs := repository.Observation{
		ID:              testUUID("obs-new"),
		InspectionID:    arg.InspectionID,
		SequenceOrder:   arg.SequenceOrder,
		ObservationType: arg.ObservationType,
	}
	m.observations = append(m.observations, obs)
	return obs, nil
}

type mockPublisher struct {
	events []event.Event
}

func (m *mockPublisher) Publish(ctx context.Context, topic string, evt event.Event) error {
	m.events = append(m.events, evt)
	return nil
}

// AC #1: StartInspection creates IN_PROGRESS inspection
func TestInspectionService_Start(t *testing.T) {
	mock := &mockInspQuerier{}
	pub := &mockPublisher{}
	svc := NewInspectionService(mock, pub)

	hiveID := testUUID("hive-1")
	userID := testUUID("user-1")
	insp, err := svc.Start(context.Background(), hiveID, userID, "full")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if insp.Status != "in_progress" {
		t.Errorf("status = %s, want in_progress", insp.Status)
	}
	if insp.Type != "full" {
		t.Errorf("type = %s, want full", insp.Type)
	}
}

// AC #2: Quick inspection mode
func TestInspectionService_StartQuick(t *testing.T) {
	mock := &mockInspQuerier{}
	pub := &mockPublisher{}
	svc := NewInspectionService(mock, pub)

	insp, err := svc.Start(context.Background(), testUUID("hive-1"), testUUID("user-1"), "quick")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if insp.Type != "quick" {
		t.Errorf("type = %s, want quick", insp.Type)
	}
}

// AC #3: AddObservation appends with correct sequence order
func TestInspectionService_AddObservation(t *testing.T) {
	mock := &mockInspQuerier{maxSeq: int32(2)}
	pub := &mockPublisher{}
	svc := NewInspectionService(mock, pub)

	obs, err := svc.AddObservation(context.Background(), repository.CreateObservationParams{
		InspectionID:    testUUID("insp-1"),
		ObservationType: "brood_pattern",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if obs.SequenceOrder != 3 {
		t.Errorf("sequence_order = %d, want 3", obs.SequenceOrder)
	}
}

// AC #4: PauseInspection changes status
func TestInspectionService_Pause(t *testing.T) {
	inspID := testUUID("insp-1")
	userID := testUUID("user-1")
	mock := &mockInspQuerier{
		inspections: []repository.Inspection{
			{ID: inspID, UserID: userID, Status: "in_progress"},
		},
	}
	pub := &mockPublisher{}
	svc := NewInspectionService(mock, pub)

	insp, err := svc.Pause(context.Background(), inspID, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if insp.Status != "paused" {
		t.Errorf("status = %s, want paused", insp.Status)
	}
}

// AC #5: ResumeInspection restores IN_PROGRESS
func TestInspectionService_Resume(t *testing.T) {
	inspID := testUUID("insp-1")
	userID := testUUID("user-1")
	mock := &mockInspQuerier{
		inspections: []repository.Inspection{
			{ID: inspID, UserID: userID, Status: "paused"},
		},
	}
	pub := &mockPublisher{}
	svc := NewInspectionService(mock, pub)

	insp, err := svc.Resume(context.Background(), inspID, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if insp.Status != "in_progress" {
		t.Errorf("status = %s, want in_progress", insp.Status)
	}
}

// AC #6: CompleteInspection with zero observations fails
func TestInspectionService_Complete_NoObservations(t *testing.T) {
	inspID := testUUID("insp-1")
	userID := testUUID("user-1")
	mock := &mockInspQuerier{
		inspections: []repository.Inspection{
			{ID: inspID, UserID: userID, Status: "in_progress"},
		},
		obsCount: 0,
	}
	pub := &mockPublisher{}
	svc := NewInspectionService(mock, pub)

	_, err := svc.Complete(context.Background(), inspID, userID)
	if err == nil {
		t.Fatal("expected error for zero observations")
	}
	domErr, ok := err.(*domain.DomainError)
	if !ok {
		t.Fatalf("expected DomainError, got %T", err)
	}
	if domErr.Code != domain.ErrCodeInspectionIncomplete {
		t.Errorf("code = %s, want %s", domErr.Code, domain.ErrCodeInspectionIncomplete)
	}
}

// AC #7: CompleteInspection publishes event
func TestInspectionService_Complete_WithObservations(t *testing.T) {
	inspID := testUUID("insp-1")
	userID := testUUID("user-1")
	mock := &mockInspQuerier{
		inspections: []repository.Inspection{
			{ID: inspID, UserID: userID, HiveID: testUUID("hive-1"), Status: "in_progress", Type: "full"},
		},
		obsCount: 3,
	}
	pub := &mockPublisher{}
	svc := NewInspectionService(mock, pub)

	insp, err := svc.Complete(context.Background(), inspID, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if insp.Status != "completed" {
		t.Errorf("status = %s, want completed", insp.Status)
	}
	if len(pub.events) != 1 {
		t.Fatalf("expected 1 published event, got %d", len(pub.events))
	}
	if pub.events[0].EventType != "inspection.completed.v1" {
		t.Errorf("event type = %s, want inspection.completed.v1", pub.events[0].EventType)
	}
}
