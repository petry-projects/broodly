package service

import (
	"context"

	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/event"
	"github.com/broodly/api/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

const inspectionEventsTopic = "inspection-events"

// InspectionService handles inspection lifecycle business logic.
type InspectionService struct {
	queries   repository.Querier
	publisher event.EventPublisher
}

// NewInspectionService creates an InspectionService.
func NewInspectionService(q repository.Querier, pub event.EventPublisher) *InspectionService {
	return &InspectionService{queries: q, publisher: pub}
}

// Start creates a new in-progress inspection for a hive.
func (s *InspectionService) Start(ctx context.Context, hiveID, userID pgtype.UUID, inspType string) (repository.Inspection, error) {
	return s.queries.CreateInspection(ctx, repository.CreateInspectionParams{
		HiveID: hiveID,
		UserID: userID,
		Type:   inspType,
		Status: "in_progress",
		Notes:  "",
	})
}

// Pause transitions an inspection to paused status.
func (s *InspectionService) Pause(ctx context.Context, id, userID pgtype.UUID) (repository.Inspection, error) {
	insp, err := s.queries.GetInspectionByIDAndUser(ctx, repository.GetInspectionByIDAndUserParams{
		ID: id, UserID: userID,
	})
	if err != nil {
		return repository.Inspection{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "inspection not found"}
	}
	if insp.Status != "in_progress" {
		return repository.Inspection{}, &domain.DomainError{Code: domain.ErrCodeValidation, Message: "can only pause an in-progress inspection"}
	}
	return s.queries.PauseInspection(ctx, id)
}

// Resume transitions an inspection back to in-progress from paused.
func (s *InspectionService) Resume(ctx context.Context, id, userID pgtype.UUID) (repository.Inspection, error) {
	insp, err := s.queries.GetInspectionByIDAndUser(ctx, repository.GetInspectionByIDAndUserParams{
		ID: id, UserID: userID,
	})
	if err != nil {
		return repository.Inspection{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "inspection not found"}
	}
	if insp.Status != "paused" {
		return repository.Inspection{}, &domain.DomainError{Code: domain.ErrCodeValidation, Message: "can only resume a paused inspection"}
	}
	return s.queries.ResumeInspection(ctx, id)
}

// Complete finalizes an inspection, validates it has observations, and publishes an event.
func (s *InspectionService) Complete(ctx context.Context, id, userID pgtype.UUID) (repository.Inspection, error) {
	insp, err := s.queries.GetInspectionByIDAndUser(ctx, repository.GetInspectionByIDAndUserParams{
		ID: id, UserID: userID,
	})
	if err != nil {
		return repository.Inspection{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "inspection not found"}
	}
	if insp.Status == "completed" {
		return repository.Inspection{}, &domain.DomainError{Code: domain.ErrCodeValidation, Message: "inspection is already completed"}
	}

	obsCount, err := s.queries.CountObservationsByInspection(ctx, id)
	if err != nil {
		return repository.Inspection{}, err
	}
	if obsCount == 0 {
		return repository.Inspection{}, &domain.DomainError{
			Code:    domain.ErrCodeInspectionIncomplete,
			Message: "cannot complete an inspection with zero observations",
		}
	}

	completed, err := s.queries.CompleteInspection(ctx, repository.CompleteInspectionParams{
		ID:    id,
		Notes: insp.Notes,
	})
	if err != nil {
		return repository.Inspection{}, err
	}

	// Publish event for async recommendation generation
	evt := event.NewEvent("inspection.completed.v1", uuidToString(userID), map[string]any{
		"inspectionId": uuidToString(id),
		"hiveId":       uuidToString(insp.HiveID),
		"type":         insp.Type,
	})
	_ = s.publisher.Publish(ctx, inspectionEventsTopic, evt)

	return completed, nil
}

// AddObservation appends an observation with the correct sequence order.
func (s *InspectionService) AddObservation(ctx context.Context, params repository.CreateObservationParams) (repository.Observation, error) {
	maxSeqRaw, err := s.queries.GetMaxSequenceOrder(ctx, params.InspectionID)
	if err != nil {
		return repository.Observation{}, err
	}
	var maxSeq int32
	switch v := maxSeqRaw.(type) {
	case int32:
		maxSeq = v
	case int64:
		maxSeq = int32(v)
	default:
		maxSeq = 0
	}
	params.SequenceOrder = maxSeq + 1
	return s.queries.CreateObservation(ctx, params)
}

// GetByID returns an inspection by ID.
func (s *InspectionService) GetByID(ctx context.Context, id pgtype.UUID) (repository.Inspection, error) {
	return s.queries.GetInspectionByID(ctx, id)
}

// ListByHive returns inspections for a hive with optional pagination.
func (s *InspectionService) ListByHive(ctx context.Context, hiveID pgtype.UUID, limit, offset int32) ([]repository.Inspection, error) {
	if limit > 0 {
		return s.queries.ListInspectionsByHivePaginated(ctx, repository.ListInspectionsByHivePaginatedParams{
			HiveID: hiveID,
			Limit:  limit,
			Offset: offset,
		})
	}
	return s.queries.ListInspectionsByHive(ctx, hiveID)
}

// ListByUser returns inspections for a user with pagination.
func (s *InspectionService) ListByUser(ctx context.Context, userID pgtype.UUID, limit, offset int32) ([]repository.Inspection, error) {
	return s.queries.ListInspectionsByUser(ctx, repository.ListInspectionsByUserParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
}

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	const hextable = "0123456789abcdef"
	buf := make([]byte, 36)
	idx := 0
	for i := 0; i < 16; i++ {
		if i == 4 || i == 6 || i == 8 || i == 10 {
			buf[idx] = '-'
			idx++
		}
		buf[idx] = hextable[b[i]>>4]
		buf[idx+1] = hextable[b[i]&0x0f]
		idx += 2
	}
	return string(buf)
}
