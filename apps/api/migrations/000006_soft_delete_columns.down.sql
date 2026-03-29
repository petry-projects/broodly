DROP INDEX IF EXISTS idx_hives_deleted_at;
DROP INDEX IF EXISTS idx_apiaries_deleted_at;
ALTER TABLE hives DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE apiaries DROP COLUMN IF EXISTS deleted_at;
