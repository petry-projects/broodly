package repository

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMigrationFiles_Exist(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	expectedUp := []string{
		"000001_core_domain.up.sql",
		"000002_inspections.up.sql",
		"000003_recommendations.up.sql",
		"000004_integrations.up.sql",
		"000005_skill_notifications.up.sql",
		"000006_soft_delete_columns.up.sql",
	}

	expectedDown := []string{
		"000001_core_domain.down.sql",
		"000002_inspections.down.sql",
		"000003_recommendations.down.sql",
		"000004_integrations.down.sql",
		"000005_skill_notifications.down.sql",
		"000006_soft_delete_columns.down.sql",
	}

	for _, f := range append(expectedUp, expectedDown...) {
		path := filepath.Join(migrationsDir, f)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Errorf("missing migration file: %s", f)
		}
	}
}

func TestMigrationFiles_UpContainsCreateTable(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	expectedTables := map[string][]string{
		"000001_core_domain.up.sql":          {"users", "apiaries", "hives"},
		"000002_inspections.up.sql":          {"inspections", "observations", "media"},
		"000003_recommendations.up.sql":      {"recommendations", "tasks", "audit_events", "user_feedback"},
		"000004_integrations.up.sql":         {"integrations", "telemetry_readings", "external_context"},
		"000005_skill_notifications.up.sql":  {"skill_progression", "notification_preferences", "treatment_registry"},
	}

	for file, tables := range expectedTables {
		path := filepath.Join(migrationsDir, file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", file, err)
		}

		sql := string(content)
		for _, table := range tables {
			if !strings.Contains(sql, "CREATE TABLE "+table) {
				t.Errorf("%s: missing CREATE TABLE %s", file, table)
			}
		}
	}
}

func TestMigrationFiles_DownContainsDropStatements(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	// Migrations that create tables use DROP TABLE in their down files.
	dropTableFiles := []string{
		"000001_core_domain.down.sql",
		"000002_inspections.down.sql",
		"000003_recommendations.down.sql",
		"000004_integrations.down.sql",
		"000005_skill_notifications.down.sql",
	}

	for _, file := range dropTableFiles {
		path := filepath.Join(migrationsDir, file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", file, err)
		}

		if !strings.Contains(string(content), "DROP TABLE") {
			t.Errorf("%s: missing DROP TABLE statement", file)
		}
	}

	// ALTER-only migrations use DROP COLUMN/INDEX in their down files.
	alterDownFiles := []struct {
		file   string
		marker string
		desc   string
	}{
		{"000006_soft_delete_columns.down.sql", "DROP COLUMN", "should drop added columns"},
	}

	for _, tc := range alterDownFiles {
		path := filepath.Join(migrationsDir, tc.file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", tc.file, err)
		}

		if !strings.Contains(string(content), tc.marker) {
			t.Errorf("%s: %s", tc.file, tc.desc)
		}
	}
}

func TestMigrationFiles_SequentialNumbering(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		t.Fatalf("failed to read migrations dir: %v", err)
	}

	upCount := 0
	downCount := 0
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".up.sql") {
			upCount++
		}
		if strings.HasSuffix(e.Name(), ".down.sql") {
			downCount++
		}
	}

	if upCount != downCount {
		t.Errorf("mismatch: %d up migrations, %d down migrations", upCount, downCount)
	}

	if upCount < 6 {
		t.Errorf("expected at least 6 up migrations, got %d", upCount)
	}
}

func TestMigrationFiles_ForeignKeyConstraints(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	// Story 3.1 AC: hive cannot reference non-existent apiary
	content, _ := os.ReadFile(filepath.Join(migrationsDir, "000001_core_domain.up.sql"))
	sql := string(content)
	if !strings.Contains(sql, "REFERENCES apiaries(id)") {
		t.Error("hives table missing FK to apiaries")
	}
	if !strings.Contains(sql, "REFERENCES users(id)") {
		t.Error("apiaries table missing FK to users")
	}

	// Story 3.1 AC: unique hive names per apiary
	if !strings.Contains(sql, "idx_hives_unique_name_per_apiary") {
		t.Error("missing unique index for hive names per apiary")
	}
}

func TestMigrationFiles_RecommendationNotNullFields(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	content, _ := os.ReadFile(filepath.Join(migrationsDir, "000003_recommendations.up.sql"))
	sql := string(content)

	// Story 3.3 AC: action, rationale, confidence, fallback fields not nullable
	requiredNotNull := []string{"action TEXT NOT NULL", "rationale TEXT NOT NULL", "confidence_level", "fallback_action TEXT NOT NULL"}
	for _, field := range requiredNotNull {
		if !strings.Contains(sql, field) {
			t.Errorf("recommendations table: missing or nullable field containing %q", field)
		}
	}
}

func TestMigrationFiles_CheckConstraints(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	checks := []struct {
		file       string
		constraint string
		desc       string
	}{
		// Story 3.1: experience_level, hive type, hive status
		{"000001_core_domain.up.sql", "experience_level IN", "users.experience_level CHECK"},
		{"000001_core_domain.up.sql", "type IN", "hives.type CHECK"},
		{"000001_core_domain.up.sql", "status IN", "hives.status CHECK"},
		// Story 3.2: inspection type/status, media analysis_status
		{"000002_inspections.up.sql", "type IN", "inspections.type CHECK"},
		{"000002_inspections.up.sql", "status IN", "inspections.status CHECK"},
		{"000002_inspections.up.sql", "analysis_status IN", "media.analysis_status CHECK"},
		// Story 3.3: confidence_level range, confidence_type, task priority/status
		{"000003_recommendations.up.sql", "confidence_level >= 0", "recommendations.confidence_level range CHECK"},
		{"000003_recommendations.up.sql", "confidence_level <= 1", "recommendations.confidence_level upper bound CHECK"},
		{"000003_recommendations.up.sql", "confidence_type IN", "recommendations.confidence_type CHECK"},
		{"000003_recommendations.up.sql", "priority IN", "tasks.priority CHECK"},
		// Story 3.4: integration status, plausibility_status, source_type
		{"000004_integrations.up.sql", "status IN", "integrations.status CHECK"},
		{"000004_integrations.up.sql", "plausibility_status IN", "telemetry_readings.plausibility_status CHECK"},
		{"000004_integrations.up.sql", "source_type IN", "external_context.source_type CHECK"},
		// Story 3.5: skill level, sensitivity_level, legal_status
		{"000005_skill_notifications.up.sql", "current_level IN", "skill_progression.current_level CHECK"},
		{"000005_skill_notifications.up.sql", "sensitivity_level IN", "notification_preferences.sensitivity_level CHECK"},
		{"000005_skill_notifications.up.sql", "legal_status IN", "treatment_registry.legal_status CHECK"},
	}

	for _, tc := range checks {
		path := filepath.Join(migrationsDir, tc.file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", tc.file, err)
		}
		if !strings.Contains(string(content), tc.constraint) {
			t.Errorf("%s: missing %s", tc.file, tc.desc)
		}
	}
}

func TestMigrationFiles_UniqueConstraints(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	uniques := []struct {
		file    string
		marker  string
		desc    string
	}{
		{"000001_core_domain.up.sql", "firebase_uid TEXT NOT NULL UNIQUE", "users.firebase_uid UNIQUE"},
		{"000001_core_domain.up.sql", "idx_hives_unique_name_per_apiary", "hives unique name per apiary"},
		{"000002_inspections.up.sql", "idx_observations_order", "observations (inspection_id, sequence_order) UNIQUE"},
		{"000005_skill_notifications.up.sql", "UNIQUE", "skill_progression or notification_preferences UNIQUE"},
	}

	for _, tc := range uniques {
		path := filepath.Join(migrationsDir, tc.file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", tc.file, err)
		}
		if !strings.Contains(string(content), tc.marker) {
			t.Errorf("%s: missing %s", tc.file, tc.desc)
		}
	}
}

func TestMigrationFiles_ForeignKeyConstraints_AllTables(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	fks := []struct {
		file string
		ref  string
		desc string
	}{
		// Story 3.1
		{"000001_core_domain.up.sql", "REFERENCES users(id)", "apiaries FK to users"},
		{"000001_core_domain.up.sql", "REFERENCES apiaries(id)", "hives FK to apiaries"},
		// Story 3.2
		{"000002_inspections.up.sql", "REFERENCES hives(id)", "inspections FK to hives"},
		{"000002_inspections.up.sql", "REFERENCES users(id)", "inspections FK to users"},
		{"000002_inspections.up.sql", "REFERENCES inspections(id)", "observations FK to inspections"},
		{"000002_inspections.up.sql", "REFERENCES observations(id)", "media FK to observations"},
		// Story 3.3
		{"000003_recommendations.up.sql", "REFERENCES hives(id)", "recommendations FK to hives"},
		{"000003_recommendations.up.sql", "REFERENCES users(id)", "recommendations FK to users"},
		{"000003_recommendations.up.sql", "REFERENCES recommendations(id)", "tasks/user_feedback FK to recommendations"},
		// Story 3.4
		{"000004_integrations.up.sql", "REFERENCES users(id)", "integrations FK to users"},
		{"000004_integrations.up.sql", "REFERENCES integrations(id)", "telemetry_readings FK to integrations"},
		{"000004_integrations.up.sql", "REFERENCES hives(id)", "telemetry_readings FK to hives"},
		{"000004_integrations.up.sql", "REFERENCES apiaries(id)", "external_context FK to apiaries"},
		// Story 3.5
		{"000005_skill_notifications.up.sql", "REFERENCES users(id)", "skill_progression FK to users"},
		{"000005_skill_notifications.up.sql", "REFERENCES apiaries(id)", "notification_preferences FK to apiaries"},
	}

	for _, tc := range fks {
		path := filepath.Join(migrationsDir, tc.file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", tc.file, err)
		}
		if !strings.Contains(string(content), tc.ref) {
			t.Errorf("%s: missing FK — %s", tc.file, tc.desc)
		}
	}
}

func TestMigrationFiles_DefaultValues(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	defaults := []struct {
		file    string
		marker  string
		desc    string
	}{
		// Story 3.2: inspection defaults
		{"000002_inspections.up.sql", "DEFAULT 'in_progress'", "inspections.status default"},
		{"000002_inspections.up.sql", "DEFAULT NOW()", "inspections.started_at default"},
		{"000002_inspections.up.sql", "DEFAULT 'pending'", "media.analysis_status default"},
		// Story 3.3: task defaults
		{"000003_recommendations.up.sql", "DEFAULT 'pending'", "tasks.status default"},
		// Story 3.4: telemetry defaults
		{"000004_integrations.up.sql", "DEFAULT 'unconfirmed'", "telemetry_readings.plausibility_status default"},
		// Story 3.5: skill defaults
		{"000005_skill_notifications.up.sql", "DEFAULT 'newbie'", "skill_progression.current_level default"},
	}

	for _, tc := range defaults {
		path := filepath.Join(migrationsDir, tc.file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", tc.file, err)
		}
		if !strings.Contains(string(content), tc.marker) {
			t.Errorf("%s: missing default — %s", tc.file, tc.desc)
		}
	}
}

func TestMigrationFiles_SeedData(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	// Story 3.5 AC7: treatment_registry seeded with initial data
	content, err := os.ReadFile(filepath.Join(migrationsDir, "000005_skill_notifications.up.sql"))
	if err != nil {
		t.Fatalf("failed to read skill_notifications migration: %v", err)
	}
	sql := string(content)

	if !strings.Contains(sql, "INSERT INTO treatment_registry") {
		t.Error("treatment_registry: missing seed data INSERT")
	}

	// Verify key treatments exist
	expectedTreatments := []string{
		"Oxalic Acid Vaporization",
		"Formic Acid",
		"Apivar",
	}
	for _, treatment := range expectedTreatments {
		if !strings.Contains(sql, treatment) {
			t.Errorf("treatment_registry: missing expected seed treatment %q", treatment)
		}
	}
}

func TestQueryFiles_TenantScoping(t *testing.T) {
	queriesDir := filepath.Join("..", "..", "internal", "repository", "queries")

	// Map each query file to its tenant scoping expectations.
	// Direct-user-owned tables use user_id. Child entities use parent FK.
	// Queries marked "intentionally unscoped" are exempt.
	type queryCheck struct {
		name              string
		scopeMarker       string // what to look for (e.g., "user_id")
		intentionallyOpen bool   // true if unscoped is correct
		reason            string // why it's unscoped
	}

	fileChecks := map[string][]queryCheck{
		"apiaries.sql": {
			{"ListApiariesByUser", "user_id", false, ""},
			{"GetApiaryByID", "user_id", false, ""},
			{"CreateApiary", "user_id", false, ""},
			{"UpdateApiary", "user_id", false, ""},
			{"DeleteApiary", "user_id", false, ""},
		},
		"users.sql": {
			{"GetUserByFirebaseUID", "", true, "auth identity lookup by firebase_uid"},
			{"GetUserByID", "id", false, ""},
			{"CreateUser", "", true, "new user creation, no pre-existing user_id"},
			{"UpdateUserDisplayName", "id", false, ""},
			{"SoftDeleteUser", "id", false, ""},
		},
		"recommendations.sql": {
			{"ListActiveRecommendationsByUser", "user_id", false, ""},
			{"ListPendingTasksByUser", "user_id", false, ""},
			{"ListAuditEventsByTenant", "tenant_id", false, ""},
			{"InsertAuditEvent", "tenant_id", false, ""},
		},
		"skill_notifications.sql": {
			{"GetSkillProgression", "user_id", false, ""},
			{"UpsertSkillProgression", "user_id", false, ""},
			{"GetNotificationPreferences", "user_id", false, ""},
			{"UpsertNotificationPreferences", "user_id", false, ""},
			{"ListTreatmentsByRegion", "", true, "reference catalog data, not user-owned"},
			{"ListAllTreatments", "", true, "reference catalog data, not user-owned"},
		},
		"integrations.sql": {
			{"CreateIntegration", "user_id", false, ""},
			{"ListIntegrationsByUser", "user_id", false, ""},
			{"ListStaleExternalContext", "", true, "worker/background job query"},
		},
	}

	for file, checks := range fileChecks {
		path := filepath.Join(queriesDir, file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", file, err)
		}
		sql := string(content)

		for _, qc := range checks {
			if !strings.Contains(sql, qc.name) {
				t.Errorf("%s: expected query %q not found", file, qc.name)
				continue
			}

			if qc.intentionallyOpen {
				// Verified: this query is intentionally unscoped
				continue
			}

			// Extract the section for this specific query
			idx := strings.Index(sql, qc.name)
			if idx < 0 {
				continue
			}
			// Find the next query or end of file
			endIdx := len(sql)
			nextQuery := strings.Index(sql[idx+len(qc.name):], "-- name:")
			if nextQuery >= 0 {
				endIdx = idx + len(qc.name) + nextQuery
			}
			querySection := sql[idx:endIdx]

			if !strings.Contains(querySection, qc.scopeMarker) {
				t.Errorf("%s: query %q missing tenant scope marker %q", file, qc.name, qc.scopeMarker)
			}
		}
	}
}

func TestQueryFiles_ChildEntityScoping(t *testing.T) {
	queriesDir := filepath.Join("..", "..", "internal", "repository", "queries")

	// Child entities (hives, inspections, observations, media) are scoped
	// via parent FK, not direct user_id. This test verifies they at least
	// scope by their parent entity.
	type childCheck struct {
		query       string
		scopeMarker string
		desc        string
	}

	childFiles := map[string][]childCheck{
		"hives.sql": {
			{"ListHivesByApiary", "apiary_id", "hives scoped by parent apiary"},
		},
		"inspections.sql": {
			{"ListInspectionsByHive", "hive_id", "inspections scoped by parent hive"},
			{"ListObservationsByInspection", "inspection_id", "observations scoped by parent inspection"},
			{"ListMediaByObservation", "observation_id", "media scoped by parent observation"},
		},
	}

	for file, checks := range childFiles {
		path := filepath.Join(queriesDir, file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", file, err)
		}
		sql := string(content)

		for _, cc := range checks {
			if !strings.Contains(sql, cc.query) {
				t.Errorf("%s: expected query %q not found", file, cc.query)
				continue
			}

			idx := strings.Index(sql, cc.query)
			endIdx := len(sql)
			nextQuery := strings.Index(sql[idx+len(cc.query):], "-- name:")
			if nextQuery >= 0 {
				endIdx = idx + len(cc.query) + nextQuery
			}
			querySection := sql[idx:endIdx]

			if !strings.Contains(querySection, cc.scopeMarker) {
				t.Errorf("%s: query %q missing parent scope %q — %s", file, cc.query, cc.scopeMarker, cc.desc)
			}
		}
	}
}

func TestMigrationFiles_SoftDeleteColumns(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	// Story 4.3: migration 000006 adds deleted_at to apiaries and hives
	content, err := os.ReadFile(filepath.Join(migrationsDir, "000006_soft_delete_columns.up.sql"))
	if err != nil {
		t.Fatalf("failed to read 000006_soft_delete_columns.up.sql: %v", err)
	}
	sql := string(content)

	if !strings.Contains(sql, "ALTER TABLE apiaries ADD COLUMN deleted_at") {
		t.Error("000006: missing ALTER TABLE apiaries ADD COLUMN deleted_at")
	}
	if !strings.Contains(sql, "ALTER TABLE hives ADD COLUMN deleted_at") {
		t.Error("000006: missing ALTER TABLE hives ADD COLUMN deleted_at")
	}

	// Down migration should drop the columns
	downContent, err := os.ReadFile(filepath.Join(migrationsDir, "000006_soft_delete_columns.down.sql"))
	if err != nil {
		t.Fatalf("failed to read 000006_soft_delete_columns.down.sql: %v", err)
	}
	downSQL := string(downContent)

	if !strings.Contains(downSQL, "DROP") {
		t.Error("000006 down: missing DROP statement for cleanup")
	}
}

func TestMigrationFiles_AuditAppendOnly(t *testing.T) {
	// Story 3.3 AC: audit_events is append-only — verify no UPDATE/DELETE queries in sqlc
	queriesDir := filepath.Join("..", "..", "internal", "repository", "queries", "recommendations.sql")
	content, err := os.ReadFile(queriesDir)
	if err != nil {
		t.Fatalf("failed to read recommendations.sql: %v", err)
	}

	sql := string(content)
	// InsertAuditEvent should exist
	if !strings.Contains(sql, "InsertAuditEvent") {
		t.Error("missing InsertAuditEvent query")
	}

	// No UpdateAuditEvent or DeleteAuditEvent should exist
	if strings.Contains(sql, "UpdateAuditEvent") {
		t.Error("audit_events should be append-only: found UpdateAuditEvent query")
	}
	if strings.Contains(sql, "DeleteAuditEvent") {
		t.Error("audit_events should be append-only: found DeleteAuditEvent query")
	}
}
