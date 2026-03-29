package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAuthError_Error(t *testing.T) {
	if ErrMissingToken.Error() != "Missing authorization token" {
		t.Errorf("expected 'Missing authorization token', got %q", ErrMissingToken.Error())
	}
}

func TestWriteErrorResponse_Format(t *testing.T) {
	w := httptest.NewRecorder()
	WriteErrorResponse(w, ErrMissingToken, http.StatusUnauthorized)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}

	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("expected Content-Type application/json, got %q", ct)
	}

	var resp gqlErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if len(resp.Errors) != 1 {
		t.Fatalf("expected 1 error, got %d", len(resp.Errors))
	}

	e := resp.Errors[0]
	if e.Message != "Missing authorization token" {
		t.Errorf("expected message 'Missing authorization token', got %q", e.Message)
	}
	if e.Extensions.Code != "UNAUTHENTICATED" {
		t.Errorf("expected code 'UNAUTHENTICATED', got %q", e.Extensions.Code)
	}
	if e.Extensions.Retryable != false {
		t.Errorf("expected retryable false, got true")
	}
}

func TestWriteErrorResponse_Retryable(t *testing.T) {
	w := httptest.NewRecorder()
	WriteErrorResponse(w, ErrKeyFetchFailed, http.StatusUnauthorized)

	var resp gqlErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if !resp.Errors[0].Extensions.Retryable {
		t.Errorf("expected retryable true for ErrKeyFetchFailed")
	}
}
