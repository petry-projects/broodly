package service

import (
	"context"

	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

const maxApiariesPerAccount = 5

// ApiaryService handles apiary business logic.
type ApiaryService struct {
	queries repository.Querier
}

// NewApiaryService creates an ApiaryService.
func NewApiaryService(q repository.Querier) *ApiaryService {
	return &ApiaryService{queries: q}
}

// List returns all apiaries for a user.
func (s *ApiaryService) List(ctx context.Context, userID pgtype.UUID) ([]repository.Apiary, error) {
	return s.queries.ListApiariesByUser(ctx, userID)
}

// GetByID returns an apiary by ID with ownership check.
func (s *ApiaryService) GetByID(ctx context.Context, id, userID pgtype.UUID) (repository.Apiary, error) {
	return s.queries.GetApiaryByID(ctx, repository.GetApiaryByIDParams{
		ID:     id,
		UserID: userID,
	})
}

// Create creates a new apiary after enforcing the scale limit.
func (s *ApiaryService) Create(ctx context.Context, userID pgtype.UUID, params repository.CreateApiaryParams) (repository.Apiary, error) {
	count, err := s.queries.CountApiariesByUser(ctx, userID)
	if err != nil {
		return repository.Apiary{}, err
	}
	if count >= maxApiariesPerAccount {
		return repository.Apiary{}, &domain.DomainError{
			Code:    domain.ErrCodeScaleLimit,
			Message: "maximum of 5 apiaries per account reached",
		}
	}
	params.UserID = userID
	return s.queries.CreateApiary(ctx, params)
}

// Update updates an apiary with ownership verification.
func (s *ApiaryService) Update(ctx context.Context, id, userID pgtype.UUID, params repository.UpdateApiaryParams) (repository.Apiary, error) {
	params.ID = id
	params.UserID = userID
	return s.queries.UpdateApiary(ctx, params)
}

// Delete soft-deletes an apiary and all its hives.
func (s *ApiaryService) Delete(ctx context.Context, id, userID pgtype.UUID) error {
	// Verify ownership first
	_, err := s.queries.GetApiaryByID(ctx, repository.GetApiaryByIDParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		return err
	}

	// Cascade soft-delete hives first
	if err := s.queries.SoftDeleteHivesByApiary(ctx, id); err != nil {
		return err
	}
	return s.queries.SoftDeleteApiary(ctx, repository.SoftDeleteApiaryParams{
		ID:     id,
		UserID: userID,
	})
}
