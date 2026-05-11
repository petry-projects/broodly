package auth

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	defaultGoogleCertsURL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

	// staleFallbackWindow is the grace period after cache expiry during which stale
	// keys may be used if a refresh fails. After this window, stale keys are rejected.
	staleFallbackWindow = 5 * time.Minute
)

// KeyCache fetches and caches Google's public keys for Firebase token verification.
type KeyCache struct {
	mu       sync.RWMutex
	keys     map[string]*rsa.PublicKey
	expiry   time.Time
	certsURL string
	client   *http.Client
}

// NewKeyCache creates a new KeyCache that fetches from the given URL.
func NewKeyCache(certsURL string, client *http.Client) *KeyCache {
	if certsURL == "" {
		certsURL = defaultGoogleCertsURL
	}
	if client == nil {
		client = &http.Client{Timeout: 10 * time.Second}
	}
	return &KeyCache{
		certsURL: certsURL,
		client:   client,
	}
}

// GetKey returns the RSA public key for the given key ID, fetching/refreshing as needed.
// A warm-cache miss (kid not found but cache not expired) triggers one refresh to handle
// cert rotation without waiting for TTL expiry.
func (kc *KeyCache) GetKey(ctx context.Context, kid string) (*rsa.PublicKey, error) {
	kc.mu.RLock()
	if kc.keys != nil && time.Now().Before(kc.expiry) {
		if key, ok := kc.keys[kid]; ok {
			kc.mu.RUnlock()
			return key, nil
		}
		// kid not found in warm cache — fall through to refresh for cert rotation handling
	}
	kc.mu.RUnlock()

	return kc.refreshAndGet(ctx, kid)
}

func (kc *KeyCache) refreshAndGet(ctx context.Context, kid string) (*rsa.PublicKey, error) {
	kc.mu.Lock()
	defer kc.mu.Unlock()

	// Double-check after acquiring write lock
	if kc.keys != nil && time.Now().Before(kc.expiry) {
		if key, ok := kc.keys[kid]; ok {
			return key, nil
		}
		// kid still not found — proceed with forced refresh
	}

	keys, expiry, err := kc.fetchKeys(ctx)
	if err != nil {
		// Use stale keys as fallback only within the bounded grace window.
		// After staleFallbackWindow, reject to ensure revoked keys stop being trusted.
		if kc.keys != nil && time.Now().Before(kc.expiry.Add(staleFallbackWindow)) {
			slog.Warn("failed to refresh keys, using stale cache", "error", err)
			if key, ok := kc.keys[kid]; ok {
				return key, nil
			}
		} else if kc.keys != nil {
			slog.Error("stale key fallback window exceeded, rejecting request", "error", err)
		}
		return nil, ErrKeyFetchFailed
	}

	kc.keys = keys
	kc.expiry = expiry
	slog.Info("refreshed Google public keys", "key_count", len(keys), "expires", expiry)

	key, ok := keys[kid]
	if !ok {
		return nil, fmt.Errorf("key ID %q not found after refresh", kid)
	}
	return key, nil
}

func (kc *KeyCache) fetchKeys(ctx context.Context) (map[string]*rsa.PublicKey, time.Time, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, kc.certsURL, nil)
	if err != nil {
		return nil, time.Time{}, fmt.Errorf("creating request: %w", err)
	}

	resp, err := kc.client.Do(req)
	if err != nil {
		return nil, time.Time{}, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, time.Time{}, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, time.Time{}, fmt.Errorf("reading response: %w", err)
	}

	expiry := parseCacheControlMaxAge(resp.Header.Get("Cache-Control"))

	keys, err := parseCertificates(body)
	if err != nil {
		return nil, time.Time{}, err
	}

	return keys, expiry, nil
}

func parseCacheControlMaxAge(header string) time.Time {
	for _, part := range strings.Split(header, ",") {
		part = strings.TrimSpace(part)
		if strings.HasPrefix(part, "max-age=") {
			seconds, err := strconv.Atoi(strings.TrimPrefix(part, "max-age="))
			if err == nil && seconds > 0 {
				return time.Now().Add(time.Duration(seconds) * time.Second)
			}
		}
	}
	// Default 1 hour if no Cache-Control
	return time.Now().Add(1 * time.Hour)
}

func parseCertificates(body []byte) (map[string]*rsa.PublicKey, error) {
	// Google returns JSON: {"kid1": "-----BEGIN CERTIFICATE-----\n...", "kid2": "..."}
	var certs map[string]string
	if err := json.Unmarshal(body, &certs); err != nil {
		return nil, fmt.Errorf("parsing certificate JSON: %w", err)
	}

	keys := make(map[string]*rsa.PublicKey, len(certs))
	for kid, certPEM := range certs {
		block, _ := pem.Decode([]byte(certPEM))
		if block == nil {
			return nil, fmt.Errorf("failed to decode PEM for key %s", kid)
		}

		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("parsing certificate for key %s: %w", kid, err)
		}

		rsaKey, ok := cert.PublicKey.(*rsa.PublicKey)
		if !ok {
			return nil, fmt.Errorf("key %s is not RSA", kid)
		}

		keys[kid] = rsaKey
	}

	return keys, nil
}
