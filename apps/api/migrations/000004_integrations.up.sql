-- Story 3.4: Integrations, Telemetry, and External Context Schema

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    provider TEXT NOT NULL,
    credentials_ref TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    hive_mappings JSONB NOT NULL DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integrations_user_id ON integrations (user_id);

CREATE TABLE telemetry_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id),
    hive_id UUID NOT NULL REFERENCES hives(id),
    reading_type TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    unit TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    plausibility_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (plausibility_status IN ('confirmed', 'unconfirmed', 'anomalous'))
);

CREATE INDEX idx_telemetry_hive_recorded ON telemetry_readings (hive_id, recorded_at);
CREATE INDEX idx_telemetry_integration_id ON telemetry_readings (integration_id);

CREATE TABLE external_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apiary_id UUID NOT NULL REFERENCES apiaries(id),
    source_type TEXT NOT NULL CHECK (source_type IN ('weather', 'flora')),
    data JSONB NOT NULL DEFAULT '{}',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    staleness_threshold_hours INTEGER NOT NULL DEFAULT 24
);

CREATE INDEX idx_external_context_apiary_id ON external_context (apiary_id);
CREATE INDEX idx_external_context_fetched_at ON external_context (fetched_at);
