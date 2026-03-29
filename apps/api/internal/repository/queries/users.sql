-- name: GetUserByFirebaseUID :one
SELECT * FROM users WHERE firebase_uid = $1 AND deleted_at IS NULL;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;

-- name: CreateUser :one
INSERT INTO users (firebase_uid, email, display_name, experience_level, region)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateUserDisplayName :one
UPDATE users SET display_name = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *;

-- name: UpdateUserProfile :one
UPDATE users SET display_name = $2, experience_level = $3, region = $4, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL RETURNING *;

-- name: SoftDeleteUser :exec
UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1;
