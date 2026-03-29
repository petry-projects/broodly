-- Story 3.5: Skill Progression, Notification Preferences, Treatment Registry

CREATE TABLE skill_progression (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    current_level TEXT NOT NULL DEFAULT 'newbie' CHECK (current_level IN ('newbie', 'amateur', 'sideliner')),
    milestones_completed JSONB NOT NULL DEFAULT '[]',
    total_inspections INTEGER NOT NULL DEFAULT 0,
    last_assessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_progression_user_id ON skill_progression (user_id);

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    apiary_id UUID REFERENCES apiaries(id),
    sensitivity_level TEXT NOT NULL DEFAULT 'normal' CHECK (sensitivity_level IN ('low', 'normal', 'high')),
    suppression_window_start TIME,
    suppression_window_end TIME,
    escalation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, apiary_id)
);

CREATE INDEX idx_notification_prefs_user_id ON notification_preferences (user_id);

CREATE TABLE treatment_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_name TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT '',
    legal_status TEXT NOT NULL CHECK (legal_status IN ('approved', 'restricted', 'prescription_required', 'prohibited')),
    notes TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial treatment data
INSERT INTO treatment_registry (treatment_name, region, legal_status, notes) VALUES
    ('Oxalic Acid Vaporization', 'US', 'approved', 'EPA-registered. Apply during broodless period for best efficacy.'),
    ('Oxalic Acid Dribble', 'US', 'approved', 'EPA-registered. Single application per broodless period.'),
    ('Formic Acid (MAQS)', 'US', 'approved', 'Mite Away Quick Strips. Can be used with honey supers.'),
    ('Formic Acid (Formic Pro)', 'US', 'approved', 'Extended-release formic acid strips.'),
    ('Apivar (Amitraz)', 'US', 'approved', 'Synthetic miticide. Remove before honey flow.'),
    ('Apiguard (Thymol)', 'US', 'approved', 'Thymol-based. Temperature-dependent efficacy (15-30°C).'),
    ('CheckMite+ (Coumaphos)', 'US', 'restricted', 'Restricted due to resistance concerns. Last resort only.'),
    ('Hopguard 3', 'US', 'approved', 'Hop beta acids. Can be used with honey supers.'),
    ('Oxalic Acid Vaporization', 'EU', 'approved', 'Widely used across EU member states.'),
    ('Formic Acid', 'EU', 'approved', 'Various formulations approved across EU.'),
    ('Thymol', 'EU', 'approved', 'Natural treatment, widely available.'),
    ('Amitraz', 'EU', 'prescription_required', 'Requires veterinary prescription in most EU countries.');
