package auth

import (
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

const defaultGoogleCertsURL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

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
func (kc *KeyCache) GetKey(kid string) (*rsa.PublicKey, error) {
	kc.mu.RLock()
	if kc.keys != nil && time.Now().Before(kc.expiry) {
		key, ok := kc.keys[kid]
		kc.mu.RUnlock()
		if ok {
			return key, nil
		}
		return nil, fmt.Errorf("key ID %q not found in cache", kid)
	}
	kc.mu.RUnlock()

	return kc.refreshAndGet(kid)
}

func (kc *KeyCache) refreshAndGet(kid string) (*rsa.PublicKey, error) {
	kc.mu.Lock()
	defer kc.mu.Unlock()

	// Double-check after acquiring write lock
	if kc.keys != nil && time.Now().Before(kc.expiry) {
		key, ok := kc.keys[kid]
		if ok {
			return key, nil
		}
		return nil, fmt.Errorf("key ID %q not found in cache", kid)
	}

	keys, expiry, err := kc.fetchKeys()
	if err != nil {
		// If we have stale keys, use them as fallback
		if kc.keys != nil {
			slog.Warn("failed to refresh keys, using stale cache", "error", err)
			key, ok := kc.keys[kid]
			if ok {
				return key, nil
			}
		}
		return nil, fmt.Errorf("failed to fetch public keys: %w", err)
	}

	kc.keys = keys
	kc.expiry = expiry
	slog.Info("refreshed Google public keys", "key_count", len(keys), "expires", expiry)

	key, ok := keys[kid]
	if !ok {
		return nil, fmt.Errorf("key ID %q not found in cache", kid)
	}
	return key, nil
}

func (kc *KeyCache) fetchKeys() (map[string]*rsa.PublicKey, time.Time, error) {
	resp, err := kc.client.Get(kc.certsURL)
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
