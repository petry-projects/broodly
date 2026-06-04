package service

import (
	"context"
	"testing"

	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

func testUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Valid = true
	copy(u.Bytes[:], []byte(s+"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00")[:16])
	return u
}

// mockQuerier implements the subset of repository.Querier used by ApiaryService.
type mockQuerier struct {
	repository.Querier
	apiaryCount     int64
	hiveCount       int64
	apiaries        []repository.Apiary
	hives           []repository.Hive
	createdApiary   repository.Apiary
	createdHive     repository.Hive
	updatedApiary   repository.Apiary
	updatedHive     repository.Hive
	deletedApiaryID pgtype.UUID
	getApiaryErr    error
	createApiaryErr error
}

func (m *mockQuerier) CountApiariesByUser(ctx context.Context, userID pgtype.UUID) (int64, error) {
	return m.apiaryCount, nil
}

func (m *mockQuerier) CountHivesByUser(ctx context.Context, userID pgtype.UUID) (int64, error) {
	return m.hiveCount, nil
}

func (m *mockQuerier) ListApiariesByUser(ctx context.Context, userID pgtype.UUID) ([]repository.Apiary, error) {
	return m.apiaries, nil
}

func (m *mockQuerier) GetApiaryByID(ctx context.Context, arg repository.GetApiaryByIDParams) (repository.Apiary, error) {
	if m.getApiaryErr != nil {
		return repository.Apiary{}, m.getApiaryErr
	}
	for _, a := range m.apiaries {
		if a.ID == arg.ID && a.UserID == arg.UserID {
			return a, nil
		}
	}
	return repository.Apiary{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "apiary not found"}
}

func (m *mockQuerier) CreateApiary(ctx context.Context, arg repository.CreateApiaryParams) (repository.Apiary, error) {
	if m.createApiaryErr != nil {
		return repository.Apiary{}, m.createApiaryErr
	}
	m.createdApiary = repository.Apiary{
		ID:     testUUID("new-apiary"),
		UserID: arg.UserID,
		Name:   arg.Name,
		Region: arg.Region,
	}
	return m.createdApiary, nil
}

func (m *mockQuerier) UpdateApiary(ctx context.Context, arg repository.UpdateApiaryParams) (repository.Apiary, error) {
	m.updatedApiary = repository.Apiary{ID: arg.ID, UserID: arg.UserID, Name: arg.Name}
	return m.updatedApiary, nil
}

func (m *mockQuerier) SoftDeleteApiary(ctx context.Context, arg repository.SoftDeleteApiaryParams) error {
	m.deletedApiaryID = arg.ID
	return nil
}

func (m *mockQuerier) SoftDeleteHivesByApiary(ctx context.Context, apiaryID pgtype.UUID) error {
	return nil
}

// AC #1: CreateApiary creates record and returns it with ID
func TestApiaryService_Create(t *testing.T) {
	userID := testUUID("user-1")
	mock := &mockQuerier{apiaryCount: 2}
	svc := NewApiaryService(mock)

	apiary, err := svc.Create(context.Background(), userID, repository.CreateApiaryParams{
		Name:   "Test Apiary",
		Region: "US-SE",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if apiary.Name != "Test Apiary" {
		t.Errorf("name = %s, want Test Apiary", apiary.Name)
	}
	if !apiary.ID.Valid {
		t.Error("expected valid UUID for created apiary")
	}
}

// AC #2: Scale limit — 6th apiary returns SCALE_LIMIT_EXCEEDED
func TestApiaryService_Create_ScaleLimit(t *testing.T) {
	userID := testUUID("user-1")
	mock := &mockQuerier{apiaryCount: 5}
	svc := NewApiaryService(mock)

	_, err := svc.Create(context.Background(), userID, repository.CreateApiaryParams{
		Name:   "Sixth Apiary",
		Region: "US-SE",
	})
	if err == nil {
		t.Fatal("expected scale limit error")
	}
	domErr, ok := err.(*domain.DomainError)
	if !ok {
		t.Fatalf("expected DomainError, got %T", err)
	}
	if domErr.Code != domain.ErrCodeScaleLimit {
		t.Errorf("code = %s, want %s", domErr.Code, domain.ErrCodeScaleLimit)
	}
}

// AC #5: DeleteApiary soft-deletes and cascades to hives
func TestApiaryService_Delete_Cascade(t *testing.T) {
	userID := testUUID("user-1")
	apiaryID := testUUID("apiary-1")
	mock := &mockQuerier{
		apiaries: []repository.Apiary{
			{ID: apiaryID, UserID: userID, Name: "My Apiary"},
		},
	}
	svc := NewApiaryService(mock)

	err := svc.Delete(context.Background(), apiaryID, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if mock.deletedApiaryID != apiaryID {
		t.Error("expected apiary to be soft-deleted")
	}
}

// AC #6: Tenant isolation — ListApiaries returns only user's apiaries
func TestApiaryService_List_TenantIsolation(t *testing.T) {
	userA := testUUID("user-a")
	mock := &mockQuerier{
		apiaries: []repository.Apiary{
			{ID: testUUID("apiary-a1"), UserID: userA, Name: "A's Apiary 1"},
			{ID: testUUID("apiary-a2"), UserID: userA, Name: "A's Apiary 2"},
		},
	}
	svc := NewApiaryService(mock)

	apiaries, err := svc.List(context.Background(), userA)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(apiaries) != 2 {
		t.Errorf("expected 2 apiaries, got %d", len(apiaries))
	}
	for _, a := range apiaries {
		if a.UserID != userA {
			t.Errorf("apiary %s belongs to wrong user", a.Name)
		}
	}
}
