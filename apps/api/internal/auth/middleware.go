package auth

import (
	"log/slog"
	"net/http"
	"strings"
)

// Middleware returns a chi-compatible middleware that validates Firebase ID tokens.
func Middleware(projectID string, keyCache *KeyCache) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				WriteErrorResponse(w, ErrMissingToken, http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader || tokenString == "" {
				// No "Bearer " prefix or empty token
				WriteErrorResponse(w, ErrMissingToken, http.StatusUnauthorized)
				return
			}

			claims, err := ValidateToken(tokenString, projectID, keyCache)
			if err != nil {
				authErr, ok := err.(*AuthError)
				if !ok {
					authErr = ErrInvalidToken
				}
				slog.Warn("auth failure", "error", authErr.Message, "uid", "unknown")
				WriteErrorResponse(w, authErr, http.StatusUnauthorized)
				return
			}

			role := claims.Role
			if role == "" {
				role = "owner"
			}

			ctx := WithAuthContext(r.Context(), claims.Subject, claims.Email, role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
