package adapter

import (
	"context"
	"time"
)

// StorageClient provides object storage operations.
type StorageClient interface {
	// Upload stores data at the given path and returns the object path.
	Upload(ctx context.Context, bucket, path string, data []byte, contentType string) error
	// SignedURL generates a time-limited download URL for an object.
	SignedURL(ctx context.Context, bucket, path string, expiry time.Duration) (string, error)
}

// SignedURLExpiry is the standard expiry for export download URLs (15 minutes).
const SignedURLExpiry = 15 * time.Minute

// NoOpStorageClient is a storage client that returns placeholder URLs (for development).
type NoOpStorageClient struct{}

func (n *NoOpStorageClient) Upload(ctx context.Context, bucket, path string, data []byte, contentType string) error {
	return nil
}

func (n *NoOpStorageClient) SignedURL(ctx context.Context, bucket, path string, expiry time.Duration) (string, error) {
	return "https://storage.googleapis.com/" + bucket + "/" + path + "?X-Goog-Expires=" + expiry.String(), nil
}
