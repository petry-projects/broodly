-- name: ListHivesByApiary :many
SELECT * FROM hives WHERE apiary_id = $1 ORDER BY name;

-- name: GetHiveByID :one
SELECT h.id, h.apiary_id, h.name, h.type, h.status, h.notes, h.created_at, h.updated_at
FROM hives h
JOIN apiaries a ON h.apiary_id = a.id
WHERE h.id = $1 AND a.user_id = $2;

-- name: CreateHive :one
INSERT INTO hives (apiary_id, name, type, status, notes)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateHive :one
UPDATE hives SET name = $2, type = $3, status = $4, notes = $5, updated_at = NOW()
WHERE id = $1 AND apiary_id IN (SELECT id FROM apiaries WHERE user_id = $6)
RETURNING *;

-- name: DeleteHive :exec
DELETE FROM hives WHERE id = $1 AND apiary_id IN (SELECT id FROM apiaries WHERE user_id = $2);
