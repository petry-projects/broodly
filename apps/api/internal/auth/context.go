package auth

import (
	"context"
	"errors"
)

type contextKey int

const (
	userIDKey contextKey = iota
	emailKey
	roleKey
)

var ErrNoAuthContext = errors.New("no auth context found")

// WithAuthContext returns a new context with auth claims injected.
func WithAuthContext(ctx context.Context, uid, email, role string) context.Context {
	ctx = context.WithValue(ctx, userIDKey, uid)
	ctx = context.WithValue(ctx, emailKey, email)
	ctx = context.WithValue(ctx, roleKey, role)
	return ctx
}

// UserIDFromContext extracts the user ID from the context.
func UserIDFromContext(ctx context.Context) (string, error) {
	uid, ok := ctx.Value(userIDKey).(string)
	if !ok || uid == "" {
		return "", ErrNoAuthContext
	}
	return uid, nil
}

// EmailFromContext extracts the email from the context.
func EmailFromContext(ctx context.Context) string {
	email, _ := ctx.Value(emailKey).(string)
	return email
}

// RoleFromContext extracts the role from the context.
// Returns an empty string when no role has been injected (i.e., auth middleware
// was not in the chain). Callers that require a role should treat "" as
// unauthorised rather than assuming a default.
func RoleFromContext(ctx context.Context) string {
	role, _ := ctx.Value(roleKey).(string)
	return role
}
