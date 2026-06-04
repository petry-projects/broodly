package service

import (
	"context"

	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

const maxHivesPerAccount = 100

// HiveService handles hive business logic.
type HiveService struct {
	queries repository.Querier
}

// NewHiveService creates a HiveService.
func NewHiveService(q repository.Querier) *HiveService {
	return &HiveService{queries: q}
}

// List returns all hives for an apiary.
func (s *HiveService) List(ctx context.Context, apiaryID pgtype.UUID) ([]repository.Hive, error) {
	return s.queries.ListHivesByApiary(ctx, apiaryID)
}

// GetByID returns a hive by ID.
func (s *HiveService) GetByID(ctx context.Context, id pgtype.UUID) (repository.Hive, error) {
	return s.queries.GetHiveByID(ctx, id)
}

// GetByIDAndUser returns a hive by ID with user ownership check.
func (s *HiveService) GetByIDAndUser(ctx context.Context, id, userID pgtype.UUID) (repository.Hive, error) {
	return s.queries.GetHiveByIDAndUser(ctx, repository.GetHiveByIDAndUserParams{
		ID:     id,
		UserID: userID,
	})
}

// Create creates a new hive after enforcing the scale limit.
func (s *HiveService) Create(ctx context.Context, userID pgtype.UUID, params repository.CreateHiveParams) (repository.Hive, error) {
	count, err := s.queries.CountHivesByUser(ctx, userID)
	if err != nil {
		return repository.Hive{}, err
	}
	if count >= maxHivesPerAccount {
		return repository.Hive{}, &domain.DomainError{
			Code:    domain.ErrCodeScaleLimit,
			Message: "maximum of 100 hives per account reached",
		}
	}
	return s.queries.CreateHive(ctx, params)
}

// Update updates a hive.
func (s *HiveService) Update(ctx context.Context, id pgtype.UUID, params repository.UpdateHiveParams) (repository.Hive, error) {
	params.ID = id
	return s.queries.UpdateHive(ctx, params)
}

// Delete soft-deletes a hive.
func (s *HiveService) Delete(ctx context.Context, id pgtype.UUID) error {
	return s.queries.SoftDeleteHive(ctx, id)
}

// ListByApiaryIDs returns hives for multiple apiaries (batch/dataloader support).
func (s *HiveService) ListByApiaryIDs(ctx context.Context, apiaryIDs []pgtype.UUID) ([]repository.Hive, error) {
	return s.queries.ListHivesByApiaryIDs(ctx, apiaryIDs)
}
