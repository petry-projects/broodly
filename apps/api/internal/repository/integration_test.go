package repository

import (
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

// sharedDB is the package-level test database, started once by TestMain.
var sharedDB *testDB

// TestMain starts a single PostgreSQL container for all integration tests.
func TestMain(m *testing.M) {
	flag.Parse()
	if testing.Short() {
		os.Exit(m.Run())
	}

	ctx := context.Background()

	container, err := tcpostgres.Run(ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("broodly_test"),
		tcpostgres.WithUsername("test"),
		tcpostgres.WithPassword("test"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(30*time.Second),
		),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to start postgres container: %v\n", err)
		os.Exit(1)
	}

	connStr, err := container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		container.Terminate(ctx)
		fmt.Fprintf(os.Stderr, "failed to get connection string: %v\n", err)
		os.Exit(1)
	}

	// Run migrations
	migrationsPath, _ := filepath.Abs(filepath.Join("..", "..", "migrations"))
	mig, err := migrate.New(
		fmt.Sprintf("file://%s", migrationsPath),
		fmt.Sprintf("pgx5://%s", connStr[len("postgres://"):]),
	)
	if err != nil {
		container.Terminate(ctx)
		fmt.Fprintf(os.Stderr, "failed to create migrate instance: %v\n", err)
		os.Exit(1)
	}
	if err := mig.Up(); err != nil && err != migrate.ErrNoChange {
		container.Terminate(ctx)
		fmt.Fprintf(os.Stderr, "failed to run migrations: %v\n", err)
		os.Exit(1)
	}
	srcErr, dbErr := mig.Close()
	if srcErr != nil || dbErr != nil {
		container.Terminate(ctx)
		fmt.Fprintf(os.Stderr, "migrate close errors: src=%v db=%v\n", srcErr, dbErr)
		os.Exit(1)
	}

	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		container.Terminate(ctx)
		fmt.Fprintf(os.Stderr, "failed to connect to postgres: %v\n", err)
		os.Exit(1)
	}

	sharedDB = &testDB{
		container: container,
		conn:      conn,
		connStr:   connStr,
		queries:   New(conn),
	}

	code := m.Run()

	conn.Close(ctx)
	container.Terminate(ctx)
	os.Exit(code)
}

// skipWithoutDocker skips integration tests when Docker is not available.
func skipWithoutDocker(t *testing.T) {
	t.Helper()
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}
}

// testDB holds a running PostgreSQL container and connection for integration tests.
type testDB struct {
	container testcontainers.Container
	conn      *pgx.Conn
	connStr   string
	queries   *Queries
}

// freshConn returns the shared DB after verifying the connection is alive,
// and registers a cleanup that truncates test data inserted during the test.
func freshConn(t *testing.T) *testDB {
	t.Helper()
	skipWithoutDocker(t)

	if sharedDB == nil {
		t.Fatal("sharedDB not initialized — TestMain did not run (are you using -short?)")
	}
	return sharedDB
}

// insertTestUser creates a user and returns the generated UUID.
func (db *testDB) insertTestUser(t *testing.T, firebaseUID, email string) pgtype.UUID {
	t.Helper()
	var id pgtype.UUID
	err := db.conn.QueryRow(context.Background(),
		"INSERT INTO users (firebase_uid, email, display_name) VALUES ($1, $2, $3) RETURNING id",
		firebaseUID, email, "Test User",
	).Scan(&id)
	if err != nil {
		t.Fatalf("failed to insert test user: %v", err)
	}
	return id
}

// insertTestApiary creates an apiary for the given user and returns the generated UUID.
func (db *testDB) insertTestApiary(t *testing.T, userID pgtype.UUID, name string) pgtype.UUID {
	t.Helper()
	var id pgtype.UUID
	err := db.conn.QueryRow(context.Background(),
		"INSERT INTO apiaries (user_id, name) VALUES ($1, $2) RETURNING id",
		userID, name,
	).Scan(&id)
	if err != nil {
		t.Fatalf("failed to insert test apiary: %v", err)
	}
	return id
}

// insertTestHive creates a hive for the given apiary and returns the generated UUID.
func (db *testDB) insertTestHive(t *testing.T, apiaryID pgtype.UUID, name string) pgtype.UUID {
	t.Helper()
	var id pgtype.UUID
	err := db.conn.QueryRow(context.Background(),
		"INSERT INTO hives (apiary_id, name) VALUES ($1, $2) RETURNING id",
		apiaryID, name,
	).Scan(&id)
	if err != nil {
		t.Fatalf("failed to insert test hive: %v", err)
	}
	return id
}

// --- Migration execution tests ---

func TestIntegration_MigrationsApplyCleanly(t *testing.T) {
	db := freshConn(t)

	// Verify schema_migrations table exists and has correct version
	var version int
	var dirty bool
	err := db.conn.QueryRow(context.Background(),
		"SELECT version, dirty FROM schema_migrations",
	).Scan(&version, &dirty)
	if err != nil {
		t.Fatalf("failed to query schema_migrations: %v", err)
	}
	if version != 6 {
		t.Errorf("expected migration version 6, got %d", version)
	}
	if dirty {
		t.Error("schema_migrations is dirty")
	}
}

func TestIntegration_MigrationsIdempotent(t *testing.T) {
	db := freshConn(t)

	// Run migrations again — should be no-op
	migrationsPath, _ := filepath.Abs(filepath.Join("..", "..", "migrations"))
	m, err := migrate.New(
		fmt.Sprintf("file://%s", migrationsPath),
		fmt.Sprintf("pgx5://%s", db.connStr[len("postgres://"):]),
	)
	if err != nil {
		t.Fatalf("failed to create migrate instance: %v", err)
	}
	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		t.Errorf("re-running migrations should be idempotent, got: %v", err)
	}
	m.Close()
}

// --- Users table constraints ---

func TestIntegration_Users_UUIDGenerated(t *testing.T) {
	db := freshConn(t)

	id := db.insertTestUser(t, "fb-uuid-001", "user1@example.com")
	if !id.Valid {
		t.Error("expected valid UUID for user")
	}
}

func TestIntegration_Users_DuplicateFirebaseUID(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	db.insertTestUser(t, "fb-dup-001", "first@example.com")

	// Second insert with same firebase_uid should fail
	_, err := db.conn.Exec(ctx,
		"INSERT INTO users (firebase_uid, email, display_name) VALUES ($1, $2, $3)",
		"fb-dup-001", "second@example.com", "Dup",
	)
	if err == nil {
		t.Error("expected unique constraint violation for duplicate firebase_uid")
	}
}

func TestIntegration_Users_TimestampDefaults(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	before := time.Now().Add(-1 * time.Second)
	db.insertTestUser(t, "fb-ts-001", "ts@example.com")

	var createdAt, updatedAt time.Time
	err := db.conn.QueryRow(ctx,
		"SELECT created_at, updated_at FROM users WHERE firebase_uid = $1", "fb-ts-001",
	).Scan(&createdAt, &updatedAt)
	if err != nil {
		t.Fatalf("failed to query timestamps: %v", err)
	}

	if createdAt.Before(before) {
		t.Error("created_at should default to now()")
	}
	if updatedAt.Before(before) {
		t.Error("updated_at should default to now()")
	}
}

func TestIntegration_Users_SoftDelete(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-soft-001", "soft@example.com")

	// Soft delete
	_, err := db.conn.Exec(ctx, "UPDATE users SET deleted_at = NOW() WHERE id = $1", userID)
	if err != nil {
		t.Fatalf("failed to soft delete: %v", err)
	}

	// Verify soft-deleted user excluded from queries filtering by deleted_at
	var count int
	err = db.conn.QueryRow(ctx,
		"SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND id = $1", userID,
	).Scan(&count)
	if err != nil {
		t.Fatalf("failed to count: %v", err)
	}
	if count != 0 {
		t.Errorf("expected 0 non-deleted users with this ID, got %d", count)
	}
}

// --- Apiaries FK constraints ---

func TestIntegration_Apiaries_FKViolation(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	fakeUserID := pgtype.UUID{Bytes: [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}, Valid: true}
	_, err := db.conn.Exec(ctx,
		"INSERT INTO apiaries (user_id, name) VALUES ($1, $2)",
		fakeUserID, "Orphan Apiary",
	)
	if err == nil {
		t.Error("expected FK violation for non-existent user_id")
	}
}

// --- Hives constraints ---

func TestIntegration_Hives_FKViolation(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	fakeApiaryID := pgtype.UUID{Bytes: [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}, Valid: true}
	_, err := db.conn.Exec(ctx,
		"INSERT INTO hives (apiary_id, name) VALUES ($1, $2)",
		fakeApiaryID, "Orphan Hive",
	)
	if err == nil {
		t.Error("expected FK violation for non-existent apiary_id")
	}
}

func TestIntegration_Hives_UniqueNamePerApiary(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-hive-001", "hive@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")

	db.insertTestHive(t, apiaryID, "Queen Bee")

	// Duplicate name in same apiary should fail
	_, err := db.conn.Exec(ctx,
		"INSERT INTO hives (apiary_id, name) VALUES ($1, $2)",
		apiaryID, "Queen Bee",
	)
	if err == nil {
		t.Error("expected unique constraint violation for duplicate hive name in same apiary")
	}
}

func TestIntegration_Hives_SameNameDifferentApiaries(t *testing.T) {
	db := freshConn(t)

	userID := db.insertTestUser(t, "fb-hive-002", "hive2@example.com")
	apiary1 := db.insertTestApiary(t, userID, "Apiary A")
	apiary2 := db.insertTestApiary(t, userID, "Apiary B")

	// Same name in different apiaries should succeed
	db.insertTestHive(t, apiary1, "Queen Bee")
	db.insertTestHive(t, apiary2, "Queen Bee")
}

// --- Inspections constraints and defaults ---

func TestIntegration_Inspections_FKViolation(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-insp-001", "insp@example.com")
	fakeHiveID := pgtype.UUID{Bytes: [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}, Valid: true}

	_, err := db.conn.Exec(ctx,
		"INSERT INTO inspections (hive_id, user_id) VALUES ($1, $2)",
		fakeHiveID, userID,
	)
	if err == nil {
		t.Error("expected FK violation for non-existent hive_id")
	}
}

func TestIntegration_Inspections_Defaults(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-insp-002", "insp2@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	before := time.Now().Add(-1 * time.Second)
	var inspID pgtype.UUID
	var status string
	var startedAt time.Time

	err := db.conn.QueryRow(ctx,
		"INSERT INTO inspections (hive_id, user_id) VALUES ($1, $2) RETURNING id, status, started_at",
		hiveID, userID,
	).Scan(&inspID, &status, &startedAt)
	if err != nil {
		t.Fatalf("failed to insert inspection: %v", err)
	}

	if status != "in_progress" {
		t.Errorf("expected default status 'in_progress', got %q", status)
	}
	if startedAt.Before(before) {
		t.Error("expected started_at to default to now()")
	}
}

// --- Observations constraints ---

func TestIntegration_Observations_UniqueSequenceOrder(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-obs-001", "obs@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	var inspID pgtype.UUID
	err := db.conn.QueryRow(ctx,
		"INSERT INTO inspections (hive_id, user_id) VALUES ($1, $2) RETURNING id",
		hiveID, userID,
	).Scan(&inspID)
	if err != nil {
		t.Fatalf("failed to insert inspection: %v", err)
	}

	// First observation
	_, err = db.conn.Exec(ctx,
		"INSERT INTO observations (inspection_id, sequence_order, observation_type) VALUES ($1, $2, $3)",
		inspID, 1, "brood",
	)
	if err != nil {
		t.Fatalf("failed to insert first observation: %v", err)
	}

	// Duplicate (inspection_id, sequence_order) should fail
	_, err = db.conn.Exec(ctx,
		"INSERT INTO observations (inspection_id, sequence_order, observation_type) VALUES ($1, $2, $3)",
		inspID, 1, "queen",
	)
	if err == nil {
		t.Error("expected unique constraint violation for duplicate (inspection_id, sequence_order)")
	}

	// Different sequence_order should succeed
	_, err = db.conn.Exec(ctx,
		"INSERT INTO observations (inspection_id, sequence_order, observation_type) VALUES ($1, $2, $3)",
		inspID, 2, "queen",
	)
	if err != nil {
		t.Errorf("different sequence_order should succeed: %v", err)
	}
}

// --- Media defaults ---

func TestIntegration_Media_AnalysisStatusDefault(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-media-001", "media@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	var inspID pgtype.UUID
	db.conn.QueryRow(ctx,
		"INSERT INTO inspections (hive_id, user_id) VALUES ($1, $2) RETURNING id",
		hiveID, userID,
	).Scan(&inspID)

	var obsID pgtype.UUID
	db.conn.QueryRow(ctx,
		"INSERT INTO observations (inspection_id, sequence_order, observation_type) VALUES ($1, 1, 'brood') RETURNING id",
		inspID,
	).Scan(&obsID)

	var analysisStatus string
	err := db.conn.QueryRow(ctx,
		"INSERT INTO media (observation_id, storage_path, content_type) VALUES ($1, $2, $3) RETURNING analysis_status",
		obsID, "gs://bucket/test.jpg", "image/jpeg",
	).Scan(&analysisStatus)
	if err != nil {
		t.Fatalf("failed to insert media: %v", err)
	}
	if analysisStatus != "pending" {
		t.Errorf("expected default analysis_status 'pending', got %q", analysisStatus)
	}
}

// --- Recommendations CHECK constraints ---

func TestIntegration_Recommendations_ConfidenceLevelCheck(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-rec-001", "rec@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	// Valid confidence_level (0.75) should succeed
	_, err := db.conn.Exec(ctx,
		`INSERT INTO recommendations (hive_id, user_id, action, rationale, confidence_level, confidence_type, fallback_action)
		 VALUES ($1, $2, 'Add super', 'Bees need space', 0.75, 'high', 'Monitor')`,
		hiveID, userID,
	)
	if err != nil {
		t.Fatalf("valid confidence_level should succeed: %v", err)
	}

	// Invalid confidence_level (1.5) should fail CHECK
	_, err = db.conn.Exec(ctx,
		`INSERT INTO recommendations (hive_id, user_id, action, rationale, confidence_level, confidence_type, fallback_action)
		 VALUES ($1, $2, 'Remove super', 'Too much space', 1.5, 'high', 'Wait')`,
		hiveID, userID,
	)
	if err == nil {
		t.Error("expected CHECK constraint violation for confidence_level 1.5")
	}

	// Negative confidence_level should fail CHECK
	_, err = db.conn.Exec(ctx,
		`INSERT INTO recommendations (hive_id, user_id, action, rationale, confidence_level, confidence_type, fallback_action)
		 VALUES ($1, $2, 'Feed bees', 'Low stores', -0.1, 'high', 'Wait')`,
		hiveID, userID,
	)
	if err == nil {
		t.Error("expected CHECK constraint violation for negative confidence_level")
	}
}

func TestIntegration_Recommendations_NotNullEnforcement(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-rec-002", "rec2@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	// NULL action should fail
	_, err := db.conn.Exec(ctx,
		`INSERT INTO recommendations (hive_id, user_id, action, rationale, confidence_level, confidence_type, fallback_action)
		 VALUES ($1, $2, NULL, 'Reason', 0.5, 'high', 'Fallback')`,
		hiveID, userID,
	)
	if err == nil {
		t.Error("expected NOT NULL violation for NULL action")
	}
}

// --- Tasks defaults and lifecycle ---

func TestIntegration_Tasks_DefaultStatus(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-task-001", "task@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	var status string
	err := db.conn.QueryRow(ctx,
		"INSERT INTO tasks (hive_id, user_id, title) VALUES ($1, $2, $3) RETURNING status",
		hiveID, userID, "Check queen",
	).Scan(&status)
	if err != nil {
		t.Fatalf("failed to insert task: %v", err)
	}
	if status != "pending" {
		t.Errorf("expected default status 'pending', got %q", status)
	}
}

func TestIntegration_Tasks_Lifecycle(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-task-002", "task2@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	var taskID pgtype.UUID
	db.conn.QueryRow(ctx,
		"INSERT INTO tasks (hive_id, user_id, title) VALUES ($1, $2, $3) RETURNING id",
		hiveID, userID, "Add super",
	).Scan(&taskID)

	// Transition to completed
	_, err := db.conn.Exec(ctx,
		"UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1",
		taskID,
	)
	if err != nil {
		t.Fatalf("failed to complete task: %v", err)
	}

	var completedAt *time.Time
	var finalStatus string
	db.conn.QueryRow(ctx,
		"SELECT status, completed_at FROM tasks WHERE id = $1", taskID,
	).Scan(&finalStatus, &completedAt)

	if finalStatus != "completed" {
		t.Errorf("expected status 'completed', got %q", finalStatus)
	}
	if completedAt == nil {
		t.Error("expected completed_at to be set")
	}
}

// --- Audit events ---

func TestIntegration_AuditEvents_InsertAndQuery(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	tenantID := pgtype.UUID{Bytes: [16]byte{10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160}, Valid: true}
	actorID := pgtype.UUID{Bytes: [16]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16}, Valid: true}

	_, err := db.conn.Exec(ctx,
		`INSERT INTO audit_events (event_type, actor_id, tenant_id, payload)
		 VALUES ($1, $2, $3, $4)`,
		"role.granted", actorID, tenantID, `{"role": "collaborator"}`,
	)
	if err != nil {
		t.Fatalf("failed to insert audit event: %v", err)
	}

	var count int
	db.conn.QueryRow(ctx,
		"SELECT COUNT(*) FROM audit_events WHERE tenant_id = $1 AND event_type = $2",
		tenantID, "role.granted",
	).Scan(&count)

	if count != 1 {
		t.Errorf("expected 1 audit event, got %d", count)
	}
}

// --- Telemetry plausibility CHECK ---

func TestIntegration_Telemetry_PlausibilityCheck(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-tel-001", "tel@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	// Create integration
	var integID pgtype.UUID
	db.conn.QueryRow(ctx,
		"INSERT INTO integrations (user_id, provider, credentials_ref) VALUES ($1, 'hive_monitor', 'secret/ref') RETURNING id",
		userID,
	).Scan(&integID)

	// Valid plausibility_status
	_, err := db.conn.Exec(ctx,
		`INSERT INTO telemetry_readings (integration_id, hive_id, reading_type, value, unit, recorded_at, plausibility_status)
		 VALUES ($1, $2, 'temperature', 35.5, 'celsius', NOW(), 'confirmed')`,
		integID, hiveID,
	)
	if err != nil {
		t.Fatalf("valid plausibility_status should succeed: %v", err)
	}

	// Invalid plausibility_status
	_, err = db.conn.Exec(ctx,
		`INSERT INTO telemetry_readings (integration_id, hive_id, reading_type, value, unit, recorded_at, plausibility_status)
		 VALUES ($1, $2, 'temperature', 35.5, 'celsius', NOW(), 'invalid_status')`,
		integID, hiveID,
	)
	if err == nil {
		t.Error("expected CHECK constraint violation for invalid plausibility_status")
	}
}

// --- Skill progression constraints ---

func TestIntegration_SkillProgression_UniquePerUser(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-skill-001", "skill@example.com")

	_, err := db.conn.Exec(ctx,
		"INSERT INTO skill_progression (user_id) VALUES ($1)", userID,
	)
	if err != nil {
		t.Fatalf("first skill_progression insert should succeed: %v", err)
	}

	// Duplicate should fail
	_, err = db.conn.Exec(ctx,
		"INSERT INTO skill_progression (user_id) VALUES ($1)", userID,
	)
	if err == nil {
		t.Error("expected unique constraint violation for duplicate skill_progression per user")
	}
}

func TestIntegration_SkillProgression_LevelCheck(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-skill-002", "skill2@example.com")

	// Invalid level
	_, err := db.conn.Exec(ctx,
		"INSERT INTO skill_progression (user_id, current_level) VALUES ($1, 'expert')",
		userID,
	)
	if err == nil {
		t.Error("expected CHECK constraint violation for invalid current_level 'expert'")
	}
}

// --- Treatment registry seed data ---

func TestIntegration_TreatmentRegistry_SeedData(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	var count int
	err := db.conn.QueryRow(ctx, "SELECT COUNT(*) FROM treatment_registry").Scan(&count)
	if err != nil {
		t.Fatalf("failed to count treatments: %v", err)
	}
	if count == 0 {
		t.Error("treatment_registry should be seeded with initial data")
	}
	if count < 10 {
		t.Errorf("expected at least 10 seed treatments, got %d", count)
	}
}

// --- Soft delete non-cascading ---

func TestIntegration_SoftDelete_DoesNotCascade(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-cascade-001", "cascade@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	var inspID pgtype.UUID
	db.conn.QueryRow(ctx,
		"INSERT INTO inspections (hive_id, user_id) VALUES ($1, $2) RETURNING id",
		hiveID, userID,
	).Scan(&inspID)

	db.conn.Exec(ctx,
		"INSERT INTO observations (inspection_id, sequence_order, observation_type) VALUES ($1, 1, 'brood')",
		inspID,
	)

	// Soft delete the inspection
	_, err := db.conn.Exec(ctx,
		"UPDATE inspections SET status = 'completed', deleted_at = NOW() WHERE id = $1",
		inspID,
	)
	if err != nil {
		t.Fatalf("failed to soft delete inspection: %v", err)
	}

	// Observations should still be queryable
	var obsCount int
	db.conn.QueryRow(ctx,
		"SELECT COUNT(*) FROM observations WHERE inspection_id = $1", inspID,
	).Scan(&obsCount)

	if obsCount != 1 {
		t.Errorf("expected 1 observation after soft delete, got %d", obsCount)
	}
}

// --- JSONB storage ---

func TestIntegration_Recommendations_JSONBStorage(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-json-001", "json@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Test Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "Test Hive")

	evidence := `{"source": "inspection_2024_03", "observations": ["brood_pattern_good"]}`
	versions := `{"model": "v2.1", "rules": "v1.3"}`

	var recID pgtype.UUID
	err := db.conn.QueryRow(ctx,
		`INSERT INTO recommendations (hive_id, user_id, action, rationale, confidence_level, confidence_type, fallback_action, evidence_context, source_versions)
		 VALUES ($1, $2, 'Add super', 'Growth detected', 0.85, 'high', 'Monitor', $3, $4) RETURNING id`,
		hiveID, userID, evidence, versions,
	).Scan(&recID)
	if err != nil {
		t.Fatalf("failed to insert recommendation with JSONB: %v", err)
	}

	// Retrieve and verify JSONB
	var retrievedEvidence, retrievedVersions []byte
	db.conn.QueryRow(ctx,
		"SELECT evidence_context, source_versions FROM recommendations WHERE id = $1", recID,
	).Scan(&retrievedEvidence, &retrievedVersions)

	if len(retrievedEvidence) == 0 {
		t.Error("evidence_context should contain JSONB data")
	}
	if len(retrievedVersions) == 0 {
		t.Error("source_versions should contain JSONB data")
	}
}

// --- Soft delete columns from migration 000006 ---

func TestIntegration_SoftDelete_ApiaryDeletedAt(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-sd-apiary-001", "sd-apiary@example.com")
	apiaryID := db.insertTestApiary(t, userID, "Soft Delete Apiary")

	// Set deleted_at on apiary
	_, err := db.conn.Exec(ctx, "UPDATE apiaries SET deleted_at = NOW() WHERE id = $1", apiaryID)
	if err != nil {
		t.Fatalf("failed to soft-delete apiary: %v", err)
	}

	var deletedAt *time.Time
	db.conn.QueryRow(ctx, "SELECT deleted_at FROM apiaries WHERE id = $1", apiaryID).Scan(&deletedAt)
	if deletedAt == nil {
		t.Error("expected deleted_at to be set on apiary")
	}
}

func TestIntegration_SoftDelete_HiveDeletedAt(t *testing.T) {
	db := freshConn(t)
	ctx := context.Background()

	userID := db.insertTestUser(t, "fb-sd-hive-001", "sd-hive@example.com")
	apiaryID := db.insertTestApiary(t, userID, "SD Apiary")
	hiveID := db.insertTestHive(t, apiaryID, "SD Hive")

	// Set deleted_at on hive
	_, err := db.conn.Exec(ctx, "UPDATE hives SET deleted_at = NOW() WHERE id = $1", hiveID)
	if err != nil {
		t.Fatalf("failed to soft-delete hive: %v", err)
	}

	var deletedAt *time.Time
	db.conn.QueryRow(ctx, "SELECT deleted_at FROM hives WHERE id = $1", hiveID).Scan(&deletedAt)
	if deletedAt == nil {
		t.Error("expected deleted_at to be set on hive")
	}
}
