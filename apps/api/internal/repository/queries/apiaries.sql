-- name: ListApiariesByUser :many
SELECT * FROM apiaries WHERE user_id = $1 AND deleted_at IS NULL ORDER BY name;

-- name: GetApiaryByID :one
SELECT * FROM apiaries WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: CreateApiary :one
INSERT INTO apiaries (user_id, name, latitude, longitude, region, elevation_offset, bloom_offset)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateApiary :one
UPDATE apiaries SET name = $2, latitude = $3, longitude = $4, region = $5, elevation_offset = $6, bloom_offset = $7, updated_at = NOW()
WHERE id = $1 AND user_id = $8 AND deleted_at IS NULL RETURNING *;

-- name: SoftDeleteApiary :exec
UPDATE apiaries SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: CountApiariesByUser :one
SELECT COUNT(*) FROM apiaries WHERE user_id = $1 AND deleted_at IS NULL;

-- name: DeleteApiary :exec
DELETE FROM apiaries WHERE id = $1 AND user_id = $2;
