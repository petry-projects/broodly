-- Add unique constraint on (apiary_id, source_type) for external_context
-- to enable proper upsert behaviour in UpsertExternalContext query.
ALTER TABLE external_context
    ADD CONSTRAINT external_context_apiary_source_unique UNIQUE (apiary_id, source_type);
