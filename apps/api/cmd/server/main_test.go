package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/broodly/api/graph/resolver"
	"github.com/broodly/api/internal/auth"
)

func testResolver() *resolver.Resolver {
	return &resolver.Resolver{}
}

func TestHealthEndpoint(t *testing.T) {
	kc := auth.NewKeyCache("http://localhost:0/unused", nil)
	r := newRouter("test-project", kc, testResolver())

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	expected := `{"status":"ok"}`
	if w.Body.String() != expected {
		t.Errorf("expected body %q, got %q", expected, w.Body.String())
	}
}

func TestGraphQLEndpoint_RequiresAuth(t *testing.T) {
	kc := auth.NewKeyCache("http://localhost:0/unused", nil)
	r := newRouter("test-project", kc, testResolver())

	req := httptest.NewRequest(http.MethodPost, "/graphql", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for unauthenticated /graphql, got %d", w.Code)
	}
}
