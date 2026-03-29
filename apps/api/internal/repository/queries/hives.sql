-- name: ListHivesByApiary :many
SELECT * FROM hives WHERE apiary_id = $1 ORDER BY name;

-- name: GetHiveByID :one
SELECT * FROM hives WHERE id = $1;

-- name: CreateHive :one
INSERT INTO hives (apiary_id, name, type, status, notes)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateHive :one
UPDATE hives SET name = $2, type = $3, status = $4, notes = $5, updated_at = NOW()
WHERE id = $1 RETURNING *;

-- name: DeleteHive :exec
DELETE FROM hives WHERE id = $1;
