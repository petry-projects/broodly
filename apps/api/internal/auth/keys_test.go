package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"math/big"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// generateTestCert creates a self-signed certificate and returns the PEM and private key.
func generateTestCert(t *testing.T) (string, *rsa.PrivateKey) {
	t.Helper()

	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("failed to generate RSA key: %v", err)
	}

	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "test"},
		NotBefore:    time.Now().Add(-1 * time.Hour),
		NotAfter:     time.Now().Add(24 * time.Hour),
	}

	certDER, err := x509.CreateCertificate(rand.Reader, template, template, &privateKey.PublicKey, privateKey)
	if err != nil {
		t.Fatalf("failed to create certificate: %v", err)
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})
	return string(certPEM), privateKey
}

func setupMockCertServer(t *testing.T, certPEM string, fetchCount *atomic.Int64) *httptest.Server {
	t.Helper()

	certs := map[string]string{"test-kid-1": certPEM}
	certsJSON, _ := json.Marshal(certs)

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if fetchCount != nil {
			fetchCount.Add(1)
		}
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(certsJSON)
	}))
}

func TestKeyCache_FetchAndCache(t *testing.T) {
	certPEM, _ := generateTestCert(t)
	var fetchCount atomic.Int64
	server := setupMockCertServer(t, certPEM, &fetchCount)
	defer server.Close()

	kc := NewKeyCache(server.URL, server.Client())

	// First call fetches
	key1, err := kc.GetKey(context.Background(), "test-kid-1")
	if err != nil {
		t.Fatalf("first GetKey failed: %v", err)
	}
	if key1 == nil {
		t.Fatal("expected non-nil key")
	}
	if fetchCount.Load() != 1 {
		t.Errorf("expected 1 fetch, got %d", fetchCount.Load())
	}

	// Second call uses cache
	key2, err := kc.GetKey(context.Background(), "test-kid-1")
	if err != nil {
		t.Fatalf("second GetKey failed: %v", err)
	}
	if key2 != key1 {
		t.Error("expected same key pointer from cache")
	}
	if fetchCount.Load() != 1 {
		t.Errorf("expected still 1 fetch (cached), got %d", fetchCount.Load())
	}
}

func TestKeyCache_ExpiryRefreshes(t *testing.T) {
	certPEM, _ := generateTestCert(t)
	var fetchCount atomic.Int64
	server := setupMockCertServer(t, certPEM, &fetchCount)
	defer server.Close()

	kc := NewKeyCache(server.URL, server.Client())

	// Fetch once
	_, err := kc.GetKey(context.Background(), "test-kid-1")
	if err != nil {
		t.Fatalf("first GetKey failed: %v", err)
	}

	// Force expiry
	kc.mu.Lock()
	kc.expiry = time.Now().Add(-1 * time.Second)
	kc.mu.Unlock()

	// Should re-fetch
	_, err = kc.GetKey(context.Background(), "test-kid-1")
	if err != nil {
		t.Fatalf("GetKey after expiry failed: %v", err)
	}
	if fetchCount.Load() != 2 {
		t.Errorf("expected 2 fetches after expiry, got %d", fetchCount.Load())
	}
}

func TestKeyCache_ConcurrentAccess(t *testing.T) {
	certPEM, _ := generateTestCert(t)
	var fetchCount atomic.Int64
	server := setupMockCertServer(t, certPEM, &fetchCount)
	defer server.Close()

	kc := NewKeyCache(server.URL, server.Client())

	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := kc.GetKey(context.Background(), "test-kid-1")
			if err != nil {
				t.Errorf("concurrent GetKey failed: %v", err)
			}
		}()
	}
	wg.Wait()

	// Due to sync, should only have 1 fetch (or very few due to lock contention)
	if fetchCount.Load() > 2 {
		t.Errorf("expected <=2 fetches with sync, got %d", fetchCount.Load())
	}
}

func TestKeyCache_StaleKeyFallback(t *testing.T) {
	certPEM, _ := generateTestCert(t)

	callCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		if callCount == 1 {
			certs := map[string]string{"test-kid-1": certPEM}
			certsJSON, _ := json.Marshal(certs)
			w.Header().Set("Cache-Control", "public, max-age=1")
			_, _ = w.Write(certsJSON)
		} else {
			// Second call fails
			w.WriteHeader(http.StatusInternalServerError)
		}
	}))
	defer server.Close()

	kc := NewKeyCache(server.URL, server.Client())

	// First fetch succeeds
	_, err := kc.GetKey(context.Background(), "test-kid-1")
	if err != nil {
		t.Fatalf("first GetKey failed: %v", err)
	}

	// Force expiry (within staleFallbackWindow)
	kc.mu.Lock()
	kc.expiry = time.Now().Add(-1 * time.Second)
	kc.mu.Unlock()

	// Second fetch fails but stale keys should work (within staleFallbackWindow)
	key, err := kc.GetKey(context.Background(), "test-kid-1")
	if err != nil {
		t.Fatalf("expected stale key fallback, got error: %v", err)
	}
	if key == nil {
		t.Fatal("expected non-nil stale key")
	}
}

func TestKeyCache_UnknownKid(t *testing.T) {
	certPEM, _ := generateTestCert(t)
	server := setupMockCertServer(t, certPEM, nil)
	defer server.Close()

	kc := NewKeyCache(server.URL, server.Client())

	_, err := kc.GetKey(context.Background(), "unknown-kid")
	if err == nil {
		t.Fatal("expected error for unknown kid")
	}
}

func TestKeyCache_WarmCacheMissTriggersRefresh(t *testing.T) {
	cert1PEM, _ := generateTestCert(t)
	cert2PEM, _ := generateTestCert(t)

	callCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		var certs map[string]string
		if callCount == 1 {
			// First fetch: only test-kid-1
			certs = map[string]string{"test-kid-1": cert1PEM}
		} else {
			// Second fetch (rotation): both kids
			certs = map[string]string{
				"test-kid-1":   cert1PEM,
				"rotated-kid":  cert2PEM,
			}
		}
		certsJSON, _ := json.Marshal(certs)
		w.Header().Set("Cache-Control", "public, max-age=3600")
		_, _ = w.Write(certsJSON)
	}))
	defer server.Close()

	kc := NewKeyCache(server.URL, server.Client())

	// Warm the cache with test-kid-1
	_, err := kc.GetKey(context.Background(), "test-kid-1")
	if err != nil {
		t.Fatalf("first GetKey failed: %v", err)
	}
	if callCount != 1 {
		t.Fatalf("expected 1 fetch, got %d", callCount)
	}

	// Request rotated-kid — should trigger one refresh even though cache is warm
	key, err := kc.GetKey(context.Background(), "rotated-kid")
	if err != nil {
		t.Fatalf("expected rotated-kid to be found after refresh, got error: %v", err)
	}
	if key == nil {
		t.Fatal("expected non-nil key for rotated-kid")
	}
	if callCount != 2 {
		t.Errorf("expected 2 fetches (warm-cache miss triggers refresh), got %d", callCount)
	}
}
