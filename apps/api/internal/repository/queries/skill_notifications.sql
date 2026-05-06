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
-- Uses CTE UPDATE+INSERT because ON CONFLICT is unreliable when apiary_id is nullable:
-- standard UNIQUE treats NULL != NULL, so multiple global-pref rows could accumulate.
WITH updated AS (
  UPDATE notification_preferences
  SET sensitivity_level = $3,
      suppression_window_start = $4,
      suppression_window_end = $5,
      escalation_enabled = $6,
      updated_at = NOW()
  WHERE user_id = $1
    AND apiary_id IS NOT DISTINCT FROM $2
  RETURNING *
), inserted AS (
  INSERT INTO notification_preferences (
    user_id, apiary_id, sensitivity_level, suppression_window_start, suppression_window_end, escalation_enabled
  )
  SELECT $1, $2, $3, $4, $5, $6
  WHERE NOT EXISTS (SELECT 1 FROM updated)
  RETURNING *
)
SELECT id, user_id, apiary_id, sensitivity_level, suppression_window_start, suppression_window_end, escalation_enabled, created_at, updated_at
FROM updated
UNION ALL
SELECT id, user_id, apiary_id, sensitivity_level, suppression_window_start, suppression_window_end, escalation_enabled, created_at, updated_at
FROM inserted;

-- name: ListTreatmentsByRegion :many
SELECT * FROM treatment_registry WHERE region = $1 ORDER BY treatment_name;

-- name: ListAllTreatments :many
SELECT * FROM treatment_registry ORDER BY region, treatment_name;
