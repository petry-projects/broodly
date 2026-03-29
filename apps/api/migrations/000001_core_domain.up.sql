-- Story 3.1: Core Domain Schema — Users, Apiaries, Hives
-- Migration 000001: foundational tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    experience_level TEXT NOT NULL DEFAULT 'newbie' CHECK (experience_level IN ('newbie', 'amateur', 'sideliner')),
    region TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_firebase_uid ON users (firebase_uid);
CREATE INDEX idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NOT NULL;

-- Apiaries table
CREATE TABLE apiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    region TEXT NOT NULL DEFAULT '',
    elevation_offset DOUBLE PRECISION NOT NULL DEFAULT 0,
    bloom_offset INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apiaries_user_id ON apiaries (user_id);

-- Hives table
CREATE TABLE hives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    apiary_id UUID NOT NULL REFERENCES apiaries(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'langstroth' CHECK (type IN ('langstroth', 'top_bar', 'warre', 'other')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dead', 'sold')),
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hives_apiary_id ON hives (apiary_id);
CREATE UNIQUE INDEX idx_hives_unique_name_per_apiary ON hives (apiary_id, name);
