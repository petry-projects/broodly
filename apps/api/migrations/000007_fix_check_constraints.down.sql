-- Revert to original CHECK constraints.
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_confidence_type_check;
ALTER TABLE recommendations ADD CONSTRAINT recommendations_confidence_type_check
  CHECK (confidence_type IN ('insufficient_data', 'conflicting_evidence', 'high'));

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pending', 'completed', 'deferred', 'dismissed'));
