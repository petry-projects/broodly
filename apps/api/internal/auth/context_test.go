package auth

import (
	"context"
	"testing"
)

func TestUserIDFromContext_WithUser(t *testing.T) {
	ctx := WithAuthContext(context.Background(), "user-123", "user@test.com", "owner")

	uid, err := UserIDFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if uid != "user-123" {
		t.Errorf("expected uid 'user-123', got %q", uid)
	}
}

func TestUserIDFromContext_Missing(t *testing.T) {
	ctx := context.Background()

	_, err := UserIDFromContext(ctx)
	if err != ErrNoAuthContext {
		t.Errorf("expected ErrNoAuthContext, got %v", err)
	}
}

func TestEmailFromContext_WithEmail(t *testing.T) {
	ctx := WithAuthContext(context.Background(), "uid", "user@test.com", "owner")

	email := EmailFromContext(ctx)
	if email != "user@test.com" {
		t.Errorf("expected 'user@test.com', got %q", email)
	}
}

func TestEmailFromContext_Missing(t *testing.T) {
	ctx := context.Background()

	email := EmailFromContext(ctx)
	if email != "" {
		t.Errorf("expected empty string, got %q", email)
	}
}

func TestRoleFromContext_WithRole(t *testing.T) {
	ctx := WithAuthContext(context.Background(), "uid", "email", "collaborator")

	role := RoleFromContext(ctx)
	if role != "collaborator" {
		t.Errorf("expected 'collaborator', got %q", role)
	}
}

func TestRoleFromContext_DefaultOwner(t *testing.T) {
	ctx := context.Background()

	role := RoleFromContext(ctx)
	if role != "owner" {
		t.Errorf("expected default 'owner', got %q", role)
	}
}
