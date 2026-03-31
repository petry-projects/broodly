package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHasPermission_Owner(t *testing.T) {
	perms := []Permission{ReadHive, WriteHive, ReadApiary, WriteApiary, ReadInspection, WriteInspection, ReadRecommendation, ReadAudit}
	for _, p := range perms {
		if !HasPermission("owner", p) {
			t.Errorf("owner should have permission %s", p)
		}
	}
}

func TestHasPermission_Collaborator(t *testing.T) {
	allowed := []Permission{ReadHive, ReadApiary, ReadInspection}
	for _, p := range allowed {
		if !HasPermission("collaborator", p) {
			t.Errorf("collaborator should have permission %s", p)
		}
	}

	denied := []Permission{WriteHive, WriteApiary, WriteInspection}
	for _, p := range denied {
		if HasPermission("collaborator", p) {
			t.Errorf("collaborator should NOT have permission %s", p)
		}
	}
}

func TestHasPermission_Support(t *testing.T) {
	allowed := []Permission{ReadRecommendation, ReadAudit}
	for _, p := range allowed {
		if !HasPermission("support", p) {
			t.Errorf("support should have permission %s", p)
		}
	}

	denied := []Permission{ReadHive, WriteHive, ReadApiary, WriteApiary, ReadInspection, WriteInspection}
	for _, p := range denied {
		if HasPermission("support", p) {
			t.Errorf("support should NOT have permission %s", p)
		}
	}
}

func TestHasPermission_UnknownRole(t *testing.T) {
	if HasPermission("", ReadHive) {
		t.Error("empty role should have no permissions")
	}
	if HasPermission("hacker", ReadHive) {
		t.Error("unknown role should have no permissions")
	}
}

func TestRequirePermission_Passes(t *testing.T) {
	ctx := WithAuthContext(context.Background(), "user-1", "user@test.com", "owner")
	req := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)
	w := httptest.NewRecorder()

	called := false
	handler := RequirePermission(WriteHive)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	handler.ServeHTTP(w, req)

	if !called {
		t.Error("handler should have been called for owner with WriteHive")
	}
	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestRequirePermission_Denies(t *testing.T) {
	ctx := WithAuthContext(context.Background(), "user-1", "user@test.com", "collaborator")
	req := httptest.NewRequest(http.MethodPost, "/test", nil).WithContext(ctx)
	w := httptest.NewRecorder()

	handler := RequirePermission(WriteHive)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should NOT be called for collaborator with WriteHive")
	}))

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}

	var resp gqlErrorResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if len(resp.Errors) == 0 || resp.Errors[0].Extensions.Code != "FORBIDDEN" {
		t.Error("expected FORBIDDEN error code")
	}
}

func TestRequirePermission_Support_ReadAudit(t *testing.T) {
	ctx := WithAuthContext(context.Background(), "support-1", "support@test.com", "support")
	req := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)
	w := httptest.NewRecorder()

	called := false
	handler := RequirePermission(ReadAudit)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	handler.ServeHTTP(w, req)

	if !called {
		t.Error("handler should be called for support with ReadAudit")
	}
}

func TestRequirePermission_Support_DeniedWrite(t *testing.T) {
	ctx := WithAuthContext(context.Background(), "support-1", "support@test.com", "support")
	req := httptest.NewRequest(http.MethodPost, "/test", nil).WithContext(ctx)
	w := httptest.NewRecorder()

	handler := RequirePermission(WriteHive)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should NOT be called for support with WriteHive")
	}))

	handler.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}
