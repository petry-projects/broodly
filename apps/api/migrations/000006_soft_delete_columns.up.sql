-- Story 4.3: Add soft-delete support to apiaries and hives
-- Migration 000006: add deleted_at columns for soft-delete pattern

ALTER TABLE apiaries ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE hives ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_apiaries_deleted_at ON apiaries (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_hives_deleted_at ON hives (deleted_at) WHERE deleted_at IS NOT NULL;
