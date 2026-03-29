-- Story 3.3: Recommendations, Tasks, and Audit Schema

CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hive_id UUID NOT NULL REFERENCES hives(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    rationale TEXT NOT NULL,
    confidence_level DOUBLE PRECISION NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    confidence_type TEXT NOT NULL CHECK (confidence_type IN ('insufficient_data', 'conflicting_evidence', 'high')),
    fallback_action TEXT NOT NULL,
    evidence_context JSONB NOT NULL DEFAULT '{}',
    source_versions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_recommendations_hive_id ON recommendations (hive_id);
CREATE INDEX idx_recommendations_user_id ON recommendations (user_id);
CREATE INDEX idx_recommendations_created_at ON recommendations (created_at);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID REFERENCES recommendations(id),
    hive_id UUID NOT NULL REFERENCES hives(id),
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'deferred', 'dismissed')),
    due_date DATE,
    deferred_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks (user_id);
CREATE INDEX idx_tasks_hive_id ON tasks (hive_id);
CREATE INDEX idx_tasks_status ON tasks (status) WHERE status = 'pending';

-- Audit events — append-only
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    actor_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload_version INTEGER NOT NULL DEFAULT 1,
    payload JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_audit_events_tenant_id ON audit_events (tenant_id);
CREATE INDEX idx_audit_events_occurred_at ON audit_events (occurred_at);
CREATE INDEX idx_audit_events_event_type ON audit_events (event_type);

-- User feedback on recommendations
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    outcome_report TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_feedback_recommendation_id ON user_feedback (recommendation_id);
