-- name: CreateInspection :one
INSERT INTO inspections (hive_id, user_id, type, status, notes)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetInspectionByID :one
SELECT * FROM inspections WHERE id = $1;

-- name: ListInspectionsByHive :many
SELECT * FROM inspections WHERE hive_id = $1 ORDER BY started_at DESC;

-- name: CompleteInspection :one
UPDATE inspections SET status = 'completed', completed_at = NOW(), notes = $2
WHERE id = $1 RETURNING *;

-- name: PauseInspection :one
UPDATE inspections SET status = 'paused' WHERE id = $1 RETURNING *;

-- name: CreateObservation :one
INSERT INTO observations (inspection_id, sequence_order, observation_type, structured_data, raw_voice_url, transcription, transcription_confidence)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListObservationsByInspection :many
SELECT * FROM observations WHERE inspection_id = $1 ORDER BY sequence_order;

-- name: CreateMedia :one
INSERT INTO media (observation_id, storage_path, content_type)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateMediaAnalysis :one
UPDATE media SET analysis_status = $2, analysis_result = $3
WHERE id = $1 RETURNING *;

-- name: ListMediaByObservation :many
SELECT * FROM media WHERE observation_id = $1;
