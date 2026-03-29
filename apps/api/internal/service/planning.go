package service

import (
	"context"
	"time"

	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

// PlanningService handles task and planning business logic.
type PlanningService struct {
	queries repository.Querier
}

// NewPlanningService creates a PlanningService.
func NewPlanningService(q repository.Querier) *PlanningService {
	return &PlanningService{queries: q}
}

// ListTasks returns tasks with optional filters and pagination.
func (s *PlanningService) ListTasks(ctx context.Context, userID pgtype.UUID, status *string, limit, offset int32) ([]repository.Task, error) {
	if status != nil {
		return s.queries.ListTasksByUserAndStatus(ctx, repository.ListTasksByUserAndStatusParams{
			UserID: userID,
			Status: *status,
			Limit:  limit,
			Offset: offset,
		})
	}
	return s.queries.ListTasksByUser(ctx, repository.ListTasksByUserParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
}

// DeferTask updates a task to deferred status with an optional reason.
func (s *PlanningService) DeferTask(ctx context.Context, id, userID pgtype.UUID, reason *string) (repository.Task, error) {
	task, err := s.queries.GetTaskByIDAndUser(ctx, repository.GetTaskByIDAndUserParams{
		ID: id, UserID: userID,
	})
	if err != nil {
		return repository.Task{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "task not found"}
	}
	if task.Status == "completed" || task.Status == "dismissed" {
		return repository.Task{}, &domain.DomainError{Code: domain.ErrCodeValidation, Message: "cannot defer a completed or dismissed task"}
	}

	var deferReason pgtype.Text
	if reason != nil {
		deferReason = pgtype.Text{String: *reason, Valid: true}
	}

	return s.queries.UpdateTaskStatus(ctx, repository.UpdateTaskStatusParams{
		ID:             id,
		Status:         "deferred",
		DeferredReason: deferReason,
	})
}

// CompleteTask marks a task as completed with a timestamp.
func (s *PlanningService) CompleteTask(ctx context.Context, id, userID pgtype.UUID) (repository.Task, error) {
	_, err := s.queries.GetTaskByIDAndUser(ctx, repository.GetTaskByIDAndUserParams{
		ID: id, UserID: userID,
	})
	if err != nil {
		return repository.Task{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "task not found"}
	}

	return s.queries.UpdateTaskStatus(ctx, repository.UpdateTaskStatusParams{
		ID:     id,
		Status: "completed",
	})
}

// IsOverdue returns true if a task's due date is in the past.
func IsOverdue(task repository.Task) bool {
	if !task.DueDate.Valid {
		return false
	}
	return task.DueDate.Time.Before(time.Now())
}

// CatchUpGuidance returns guidance text for overdue tasks.
func CatchUpGuidance(task repository.Task) *string {
	if !IsOverdue(task) {
		return nil
	}
	guidance := "This task is overdue. Consider prioritizing it in your next inspection or deferring with a reason if conditions have changed."
	return &guidance
}
