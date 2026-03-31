package auth

import (
	"encoding/json"
	"net/http"
)

// AuthError represents a structured authentication error following the GraphQL error extensions format.
type AuthError struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	Retryable bool   `json:"retryable"`
}

var (
	ErrMissingToken  = &AuthError{Code: "UNAUTHENTICATED", Message: "Missing authorization token", Retryable: false}
	ErrExpiredToken  = &AuthError{Code: "UNAUTHENTICATED", Message: "Token expired", Retryable: false}
	ErrInvalidToken  = &AuthError{Code: "UNAUTHENTICATED", Message: "Invalid token", Retryable: false}
	ErrKeyFetchFailed = &AuthError{Code: "UNAUTHENTICATED", Message: "Authentication service temporarily unavailable", Retryable: true}
)

func (e *AuthError) Error() string {
	return e.Message
}

type gqlErrorExtensions struct {
	Code      string `json:"code"`
	Retryable bool   `json:"retryable"`
}

type gqlError struct {
	Message    string             `json:"message"`
	Extensions gqlErrorExtensions `json:"extensions"`
}

type gqlErrorResponse struct {
	Errors []gqlError `json:"errors"`
}

// WriteErrorResponse writes a structured GraphQL error response to the HTTP response writer.
func WriteErrorResponse(w http.ResponseWriter, authErr *AuthError, statusCode int) {
	resp := gqlErrorResponse{
		Errors: []gqlError{
			{
				Message: authErr.Message,
				Extensions: gqlErrorExtensions{
					Code:      authErr.Code,
					Retryable: authErr.Retryable,
				},
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(resp)
}
