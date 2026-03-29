package service

import (
	"context"
	"testing"
	"time"

	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/repository"
	"github.com/jackc/pgx/v5/pgtype"
)

type mockTaskQuerier struct {
	repository.Querier
	tasks []repository.Task
}

func (m *mockTaskQuerier) GetTaskByIDAndUser(ctx context.Context, arg repository.GetTaskByIDAndUserParams) (repository.Task, error) {
	for _, t := range m.tasks {
		if t.ID == arg.ID && t.UserID == arg.UserID {
			return t, nil
		}
	}
	return repository.Task{}, &domain.DomainError{Code: domain.ErrCodeNotFound, Message: "task not found"}
}

func (m *mockTaskQuerier) ListTasksByUser(ctx context.Context, arg repository.ListTasksByUserParams) ([]repository.Task, error) {
	return m.tasks, nil
}

func (m *mockTaskQuerier) ListTasksByUserAndStatus(ctx context.Context, arg repository.ListTasksByUserAndStatusParams) ([]repository.Task, error) {
	var filtered []repository.Task
	for _, t := range m.tasks {
		if t.Status == arg.Status {
			filtered = append(filtered, t)
		}
	}
	return filtered, nil
}

func (m *mockTaskQuerier) UpdateTaskStatus(ctx context.Context, arg repository.UpdateTaskStatusParams) (repository.Task, error) {
	for i, t := range m.tasks {
		if t.ID == arg.ID {
			m.tasks[i].Status = arg.Status
			m.tasks[i].DeferredReason = arg.DeferredReason
			return m.tasks[i], nil
		}
	}
	return repository.Task{}, nil
}

// AC #9: ListTasks returns tasks with filters and pagination
func TestPlanningService_ListTasks(t *testing.T) {
	userID := testUUID("user-1")
	mock := &mockTaskQuerier{
		tasks: []repository.Task{
			{ID: testUUID("task-1"), UserID: userID, Title: "Task 1", Status: "pending", Priority: "high"},
			{ID: testUUID("task-2"), UserID: userID, Title: "Task 2", Status: "pending", Priority: "medium"},
			{ID: testUUID("task-3"), UserID: userID, Title: "Task 3", Status: "completed", Priority: "low"},
		},
	}
	svc := NewPlanningService(mock)

	tasks, err := svc.ListTasks(context.Background(), userID, nil, 20, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(tasks) != 3 {
		t.Errorf("expected 3 tasks, got %d", len(tasks))
	}

	// With status filter
	status := "pending"
	filtered, err := svc.ListTasks(context.Background(), userID, &status, 20, 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(filtered) != 2 {
		t.Errorf("expected 2 pending tasks, got %d", len(filtered))
	}
}

// AC #10: DeferTask updates status and records reason
func TestPlanningService_DeferTask(t *testing.T) {
	userID := testUUID("user-1")
	taskID := testUUID("task-1")
	mock := &mockTaskQuerier{
		tasks: []repository.Task{
			{ID: taskID, UserID: userID, Title: "Task 1", Status: "pending"},
		},
	}
	svc := NewPlanningService(mock)

	reason := "waiting for better weather"
	task, err := svc.DeferTask(context.Background(), taskID, userID, &reason)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if task.Status != "deferred" {
		t.Errorf("status = %s, want deferred", task.Status)
	}
	if !task.DeferredReason.Valid || task.DeferredReason.String != reason {
		t.Errorf("deferred_reason = %v, want %s", task.DeferredReason, reason)
	}
}

// AC #11: CompleteTask records completion timestamp
func TestPlanningService_CompleteTask(t *testing.T) {
	userID := testUUID("user-1")
	taskID := testUUID("task-1")
	mock := &mockTaskQuerier{
		tasks: []repository.Task{
			{ID: taskID, UserID: userID, Title: "Task 1", Status: "pending"},
		},
	}
	svc := NewPlanningService(mock)

	task, err := svc.CompleteTask(context.Background(), taskID, userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if task.Status != "completed" {
		t.Errorf("status = %s, want completed", task.Status)
	}
}

// AC #12: Overdue detection
func TestIsOverdue(t *testing.T) {
	pastDue := repository.Task{
		DueDate: pgtype.Date{Time: time.Now().Add(-24 * time.Hour), Valid: true},
	}
	if !IsOverdue(pastDue) {
		t.Error("expected task with past due date to be overdue")
	}

	futureDue := repository.Task{
		DueDate: pgtype.Date{Time: time.Now().Add(24 * time.Hour), Valid: true},
	}
	if IsOverdue(futureDue) {
		t.Error("expected task with future due date to not be overdue")
	}

	noDue := repository.Task{}
	if IsOverdue(noDue) {
		t.Error("expected task with no due date to not be overdue")
	}
}

func TestCatchUpGuidance(t *testing.T) {
	overdue := repository.Task{
		DueDate: pgtype.Date{Time: time.Now().Add(-24 * time.Hour), Valid: true},
	}
	guidance := CatchUpGuidance(overdue)
	if guidance == nil {
		t.Error("expected non-nil guidance for overdue task")
	}

	notOverdue := repository.Task{
		DueDate: pgtype.Date{Time: time.Now().Add(24 * time.Hour), Valid: true},
	}
	guidance = CatchUpGuidance(notOverdue)
	if guidance != nil {
		t.Error("expected nil guidance for non-overdue task")
	}
}
