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
	}

	expectedDown := []string{
		"000001_core_domain.down.sql",
		"000002_inspections.down.sql",
		"000003_recommendations.down.sql",
		"000004_integrations.down.sql",
		"000005_skill_notifications.down.sql",
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

func TestMigrationFiles_DownContainsDropTable(t *testing.T) {
	migrationsDir := filepath.Join("..", "..", "migrations")

	downFiles := []string{
		"000001_core_domain.down.sql",
		"000002_inspections.down.sql",
		"000003_recommendations.down.sql",
		"000004_integrations.down.sql",
		"000005_skill_notifications.down.sql",
	}

	for _, file := range downFiles {
		path := filepath.Join(migrationsDir, file)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", file, err)
		}

		if !strings.Contains(string(content), "DROP TABLE") {
			t.Errorf("%s: missing DROP TABLE statement", file)
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

	if upCount != 5 {
		t.Errorf("expected 5 up migrations, got %d", upCount)
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
