package auth

import (
	"net/http"
)

// Permission represents a specific action on a resource.
type Permission string

const (
	ReadHive              Permission = "read:hive"
	WriteHive             Permission = "write:hive"
	ReadApiary            Permission = "read:apiary"
	WriteApiary           Permission = "write:apiary"
	ReadInspection        Permission = "read:inspection"
	WriteInspection       Permission = "write:inspection"
	ReadRecommendation    Permission = "read:recommendation_history"
	ReadAudit             Permission = "read:audit"
)

var rolePermissions = map[string]map[Permission]bool{
	"owner": {
		ReadHive: true, WriteHive: true,
		ReadApiary: true, WriteApiary: true,
		ReadInspection: true, WriteInspection: true,
		ReadRecommendation: true,
		ReadAudit: true,
	},
	"collaborator": {
		ReadHive: true,
		ReadApiary: true,
		ReadInspection: true,
	},
	"support": {
		ReadRecommendation: true,
		ReadAudit: true,
	},
}

var (
	ErrForbidden = &AuthError{Code: "FORBIDDEN", Message: "You do not have permission to perform this action", Retryable: false}
)

// HasPermission checks if a role has the specified permission.
func HasPermission(role string, perm Permission) bool {
	perms, ok := rolePermissions[role]
	if !ok {
		return false
	}
	return perms[perm]
}

// RequirePermission returns a chi middleware that checks the authenticated user has the required permission.
func RequirePermission(perm Permission) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := RoleFromContext(r.Context())

			if !HasPermission(role, perm) {
				WriteErrorResponse(w, ErrForbidden, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
