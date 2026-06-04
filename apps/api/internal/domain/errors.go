package domain

import (
	"context"
	"fmt"

	"github.com/vektah/gqlparser/v2/gqlerror"
)

// GraphQL error code constants for client matching.
const (
	ErrCodeValidation        = "VALIDATION_ERROR"
	ErrCodeForbidden         = "FORBIDDEN"
	ErrCodeNotFound          = "NOT_FOUND"
	ErrCodeScaleLimit        = "SCALE_LIMIT_EXCEEDED"
	ErrCodeConfidenceLevel   = "INVALID_CONFIDENCE_LEVEL"
	ErrCodeConfidenceCohere  = "CONFIDENCE_COHERENCE_ERROR"
	ErrCodeInspectionIncomplete = "INSPECTION_INCOMPLETE"
)

// NewGraphQLError creates a gqlerror.Error with typed domain error extensions.
func NewGraphQLError(ctx context.Context, code, message string, retryable bool) *gqlerror.Error {
	return &gqlerror.Error{
		Message: message,
		Extensions: map[string]any{
			"code":      code,
			"message":   message,
			"retryable": retryable,
		},
	}
}

// ToGraphQLError converts a DomainError to a gqlerror.Error.
func ToGraphQLError(ctx context.Context, err *DomainError) *gqlerror.Error {
	return NewGraphQLError(ctx, err.Code, err.Message, err.Retryable)
}

// ValidationError returns a structured validation error.
func ValidationError(ctx context.Context, msg string) *gqlerror.Error {
	return NewGraphQLError(ctx, ErrCodeValidation, msg, false)
}

// ForbiddenError returns a structured authorization error.
func ForbiddenError(ctx context.Context) *gqlerror.Error {
	return NewGraphQLError(ctx, ErrCodeForbidden, "you do not have permission to perform this action", false)
}

// NotFoundError returns a structured not-found error.
func NotFoundError(ctx context.Context, resource string) *gqlerror.Error {
	return NewGraphQLError(ctx, ErrCodeNotFound, fmt.Sprintf("%s not found", resource), false)
}

// ScaleLimitError returns a structured scale limit error.
func ScaleLimitError(ctx context.Context, msg string) *gqlerror.Error {
	return NewGraphQLError(ctx, ErrCodeScaleLimit, msg, false)
}
