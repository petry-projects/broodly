-- name: CreateRecommendation :one
INSERT INTO recommendations (hive_id, user_id, action, rationale, confidence_level, confidence_type, fallback_action, evidence_context, source_versions, expires_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: GetRecommendationByID :one
SELECT * FROM recommendations WHERE id = $1;

-- name: ListRecommendationsByHive :many
SELECT * FROM recommendations WHERE hive_id = $1 ORDER BY created_at DESC;

-- name: ListActiveRecommendationsByUser :many
SELECT * FROM recommendations WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC;

-- name: CreateTask :one
INSERT INTO tasks (recommendation_id, hive_id, user_id, title, priority, due_date)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetTaskByID :one
SELECT * FROM tasks WHERE id = $1;

-- name: ListPendingTasksByUser :many
SELECT * FROM tasks WHERE user_id = $1 AND status = 'pending' ORDER BY due_date NULLS LAST, priority;

-- name: UpdateTaskStatus :one
UPDATE tasks SET status = $2, deferred_reason = $3, completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE NULL END
WHERE id = $1 RETURNING *;

-- name: InsertAuditEvent :exec
INSERT INTO audit_events (event_type, actor_id, tenant_id, payload_version, payload)
VALUES ($1, $2, $3, $4, $5);

-- name: ListAuditEventsByTenant :many
SELECT * FROM audit_events WHERE tenant_id = $1 ORDER BY occurred_at DESC LIMIT $2;

-- name: CreateUserFeedback :one
INSERT INTO user_feedback (recommendation_id, user_id, outcome_report)
VALUES ($1, $2, $3)
RETURNING *;
