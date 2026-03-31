-- name: CreateIntegration :one
INSERT INTO integrations (user_id, provider, credentials_ref, hive_mappings)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListIntegrationsByUser :many
SELECT * FROM integrations WHERE user_id = $1;

-- name: UpdateIntegrationSync :one
UPDATE integrations SET last_sync_at = NOW(), status = $2
WHERE id = $1 RETURNING *;

-- name: CreateTelemetryReading :exec
INSERT INTO telemetry_readings (integration_id, hive_id, reading_type, value, unit, recorded_at, plausibility_status)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: ListTelemetryByHive :many
SELECT * FROM telemetry_readings WHERE hive_id = $1 AND recorded_at >= $2 ORDER BY recorded_at;

-- name: UpsertExternalContext :one
INSERT INTO external_context (apiary_id, source_type, data, fetched_at, staleness_threshold_hours)
VALUES ($1, $2, $3, NOW(), $4)
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, fetched_at = NOW()
RETURNING *;

-- name: GetExternalContext :one
SELECT * FROM external_context WHERE apiary_id = $1 AND source_type = $2 ORDER BY fetched_at DESC LIMIT 1;

-- name: ListStaleExternalContext :many
SELECT * FROM external_context
WHERE fetched_at < NOW() - (staleness_threshold_hours || ' hours')::INTERVAL;
