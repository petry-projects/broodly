package auth

import (
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
func ValidateToken(tokenString string, projectID string, keyCache *KeyCache) (*FirebaseClaims, error) {
	expectedIssuer := fmt.Sprintf("https://securetoken.google.com/%s", projectID)

	token, err := jwt.ParseWithClaims(tokenString, &FirebaseClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Ensure RS256 algorithm
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("missing kid in token header")
		}

		return keyCache.GetKey(kid)
	},
		jwt.WithIssuer(expectedIssuer),
		jwt.WithAudience(projectID),
		jwt.WithExpirationRequired(),
	)

	if err != nil {
		if isExpiredError(err) {
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

func isExpiredError(err error) bool {
	return errors.Is(err, jwt.ErrTokenExpired)
}
