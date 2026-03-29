package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
)

const testProjectID = "broodly-test"

// testKeyCache creates a KeyCache pre-loaded with the given key.
func testKeyCache(t *testing.T, kid string, key *rsa.PublicKey) *KeyCache {
	t.Helper()
	kc := &KeyCache{
		keys:   map[string]*rsa.PublicKey{kid: key},
		expiry: time.Now().Add(1 * time.Hour),
	}
	return kc
}

func signTestToken(t *testing.T, privateKey *rsa.PrivateKey, kid string, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = kid
	signed, err := token.SignedString(privateKey)
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	return signed
}

func validClaims() jwt.MapClaims {
	return jwt.MapClaims{
		"sub":   "user-123",
		"email": "user@test.com",
		"role":  "owner",
		"iss":   fmt.Sprintf("https://securetoken.google.com/%s", testProjectID),
		"aud":   testProjectID,
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
		"iat":   time.Now().Add(-1 * time.Minute).Unix(),
	}
}

func TestMiddleware_MissingHeader(t *testing.T) {
	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	kc := testKeyCache(t, "kid1", &privateKey.PublicKey)
	mw := Middleware(testProjectID, kc)

	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called")
	}))

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}

	var resp gqlErrorResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if len(resp.Errors) == 0 || resp.Errors[0].Extensions.Code != "UNAUTHENTICATED" {
		t.Errorf("expected UNAUTHENTICATED error code")
	}
	if resp.Errors[0].Message != "Missing authorization token" {
		t.Errorf("expected 'Missing authorization token', got %q", resp.Errors[0].Message)
	}
}

func TestMiddleware_EmptyBearerToken(t *testing.T) {
	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	kc := testKeyCache(t, "kid1", &privateKey.PublicKey)
	mw := Middleware(testProjectID, kc)

	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called")
	}))

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer ")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestMiddleware_ExpiredToken(t *testing.T) {
	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	kc := testKeyCache(t, "kid1", &privateKey.PublicKey)
	mw := Middleware(testProjectID, kc)

	claims := validClaims()
	claims["exp"] = time.Now().Add(-1 * time.Hour).Unix()
	tokenStr := signTestToken(t, privateKey, "kid1", claims)

	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called")
	}))

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}

	var resp gqlErrorResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if len(resp.Errors) == 0 || resp.Errors[0].Message != "Token expired" {
		t.Errorf("expected 'Token expired' message, got %q", resp.Errors[0].Message)
	}
}

func TestMiddleware_MalformedToken(t *testing.T) {
	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	kc := testKeyCache(t, "kid1", &privateKey.PublicKey)
	mw := Middleware(testProjectID, kc)

	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called")
	}))

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer not-a-jwt")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}

	var resp gqlErrorResponse
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if len(resp.Errors) == 0 || resp.Errors[0].Message != "Invalid token" {
		t.Errorf("expected 'Invalid token' message, got %q", resp.Errors[0].Message)
	}
}

func TestMiddleware_WrongSigningKey(t *testing.T) {
	correctKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	wrongKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	kc := testKeyCache(t, "kid1", &correctKey.PublicKey)
	mw := Middleware(testProjectID, kc)

	// Sign with wrong key
	tokenStr := signTestToken(t, wrongKey, "kid1", validClaims())

	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("handler should not be called")
	}))

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestMiddleware_ValidToken(t *testing.T) {
	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	kc := testKeyCache(t, "kid1", &privateKey.PublicKey)
	mw := Middleware(testProjectID, kc)

	tokenStr := signTestToken(t, privateKey, "kid1", validClaims())

	var capturedUID, capturedEmail, capturedRole string
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedUID, _ = UserIDFromContext(r.Context())
		capturedEmail = EmailFromContext(r.Context())
		capturedRole = RoleFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
	if capturedUID != "user-123" {
		t.Errorf("expected uid 'user-123', got %q", capturedUID)
	}
	if capturedEmail != "user@test.com" {
		t.Errorf("expected email 'user@test.com', got %q", capturedEmail)
	}
	if capturedRole != "owner" {
		t.Errorf("expected role 'owner', got %q", capturedRole)
	}
}

func TestMiddleware_ValidToken_MissingEmail(t *testing.T) {
	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	kc := testKeyCache(t, "kid1", &privateKey.PublicKey)
	mw := Middleware(testProjectID, kc)

	claims := validClaims()
	delete(claims, "email")
	tokenStr := signTestToken(t, privateKey, "kid1", claims)

	var capturedEmail string
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedEmail = EmailFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 even without email, got %d", w.Code)
	}
	if capturedEmail != "" {
		t.Errorf("expected empty email, got %q", capturedEmail)
	}
}

func TestMiddleware_Integration_ChiRouter(t *testing.T) {
	privateKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	kc := testKeyCache(t, "kid1", &privateKey.PublicKey)

	r := chi.NewRouter()

	// Health excluded from auth
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// GraphQL protected by auth
	r.Group(func(r chi.Router) {
		r.Use(Middleware(testProjectID, kc))
		r.Post("/graphql", func(w http.ResponseWriter, r *http.Request) {
			uid, _ := UserIDFromContext(r.Context())
			_, _ = w.Write([]byte(fmt.Sprintf(`{"uid":"%s"}`, uid)))
		})
	})

	// Test unauthenticated request to /graphql
	req := httptest.NewRequest(http.MethodPost, "/graphql", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for unauthenticated /graphql, got %d", w.Code)
	}

	// Test authenticated request to /graphql
	tokenStr := signTestToken(t, privateKey, "kid1", validClaims())
	req = httptest.NewRequest(http.MethodPost, "/graphql", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for authenticated /graphql, got %d", w.Code)
	}

	// Test health endpoint (no auth required)
	req = httptest.NewRequest(http.MethodGet, "/health", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("expected 200 for /health, got %d", w.Code)
	}
}
