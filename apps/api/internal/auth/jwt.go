package auth

import (
	"context"
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// FirebaseClaims represents the claims in a Firebase ID token.
type FirebaseClaims struct {
	jwt.RegisteredClaims
	Email string `json:"email"`
	Role  string `json:"role"`
}

// ValidateToken validates a Firebase ID token and returns the extracted claims.
func ValidateToken(ctx context.Context, tokenString string, projectID string, keyCache *KeyCache) (*FirebaseClaims, error) {
	expectedIssuer := fmt.Sprintf("https://securetoken.google.com/%s", projectID)

	token, err := jwt.ParseWithClaims(tokenString, &FirebaseClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Enforce RS256 explicitly — Firebase ID tokens use RS256 only.
		// Accepting other RSA variants (RS384, RS512) enables algorithm confusion attacks.
		if token.Method.Alg() != jwt.SigningMethodRS256.Alg() {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("missing kid in token header")
		}

		return keyCache.GetKey(ctx, kid)
	},
		jwt.WithIssuer(expectedIssuer),
		jwt.WithAudience(projectID),
		jwt.WithExpirationRequired(),
	)

	if err != nil {
		// Check for key-fetch failure first so it propagates as retryable.
		var authErr *AuthError
		if errors.As(err, &authErr) {
			return nil, authErr
		}
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*FirebaseClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// sub (uid) must be non-empty
	if claims.Subject == "" {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
