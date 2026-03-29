-- name: GetSkillProgression :one
SELECT * FROM skill_progression WHERE user_id = $1;

-- name: UpsertSkillProgression :one
INSERT INTO skill_progression (user_id, current_level, milestones_completed, total_inspections, last_assessed_at)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (user_id) DO UPDATE SET current_level = EXCLUDED.current_level, milestones_completed = EXCLUDED.milestones_completed, total_inspections = EXCLUDED.total_inspections, last_assessed_at = NOW(), updated_at = NOW()
RETURNING *;

-- name: GetNotificationPreferences :one
SELECT * FROM notification_preferences WHERE user_id = $1 AND apiary_id IS NOT DISTINCT FROM $2;

-- name: UpsertNotificationPreferences :one
INSERT INTO notification_preferences (user_id, apiary_id, sensitivity_level, suppression_window_start, suppression_window_end, escalation_enabled)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id, apiary_id) DO UPDATE SET sensitivity_level = EXCLUDED.sensitivity_level, suppression_window_start = EXCLUDED.suppression_window_start, suppression_window_end = EXCLUDED.suppression_window_end, escalation_enabled = EXCLUDED.escalation_enabled, updated_at = NOW()
RETURNING *;

-- name: ListTreatmentsByRegion :many
SELECT * FROM treatment_registry WHERE region = $1 ORDER BY treatment_name;

-- name: ListAllTreatments :many
SELECT * FROM treatment_registry ORDER BY region, treatment_name;
