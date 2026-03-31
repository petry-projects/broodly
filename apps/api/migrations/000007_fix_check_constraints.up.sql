-- Fix confidence_type CHECK constraint to include all 6 valid values.
-- Previously only allowed: insufficient_data, conflicting_evidence, high.
-- Now allows: high, moderate, low, insufficient_data, conflicting_evidence, limited_experience.
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_confidence_type_check;
ALTER TABLE recommendations ADD CONSTRAINT recommendations_confidence_type_check
  CHECK (confidence_type IN ('high', 'moderate', 'low', 'insufficient_data', 'conflicting_evidence', 'limited_experience'));

-- Fix task status CHECK constraint to include in_progress.
-- Previously only allowed: pending, completed, deferred, dismissed.
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'deferred', 'dismissed'));
