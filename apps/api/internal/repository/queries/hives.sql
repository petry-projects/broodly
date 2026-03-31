-- name: ListHivesByApiary :many
SELECT * FROM hives WHERE apiary_id = $1 AND deleted_at IS NULL ORDER BY name;

-- name: GetHiveByID :one
SELECT * FROM hives WHERE id = $1 AND deleted_at IS NULL;

-- name: GetHiveByIDAndUser :one
SELECT h.* FROM hives h
JOIN apiaries a ON h.apiary_id = a.id
WHERE h.id = $1 AND a.user_id = $2 AND h.deleted_at IS NULL AND a.deleted_at IS NULL;

-- name: CreateHive :one
INSERT INTO hives (apiary_id, name, type, status, notes)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateHive :one
UPDATE hives SET name = $2, type = $3, status = $4, notes = $5, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL RETURNING *;

-- name: SoftDeleteHive :exec
UPDATE hives SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL;

-- name: SoftDeleteHivesByApiary :exec
UPDATE hives SET deleted_at = NOW() WHERE apiary_id = $1 AND deleted_at IS NULL;

-- name: CountHivesByUser :one
SELECT COUNT(*) FROM hives h
JOIN apiaries a ON h.apiary_id = a.id
WHERE a.user_id = $1 AND h.deleted_at IS NULL AND a.deleted_at IS NULL;

-- name: ListHivesByApiaryIDs :many
SELECT * FROM hives WHERE apiary_id = ANY($1::uuid[]) AND deleted_at IS NULL ORDER BY apiary_id, name;

-- name: DeleteHive :exec
DELETE FROM hives WHERE id = $1;
