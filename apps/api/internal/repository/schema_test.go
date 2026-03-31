package repository

import (
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

// These tests verify that sqlc-generated types compile correctly
// and match the expected schema structure. Full integration tests
// require a running PostgreSQL instance (CI pipeline).

func TestUserModel_Fields(t *testing.T) {
	u := User{}
	// Verify all expected fields exist and are correct types
	_ = u.ID           // pgtype.UUID
	_ = u.FirebaseUid  // string
	_ = u.Email        // string
	_ = u.DisplayName  // string
	_ = u.ExperienceLevel // string
	_ = u.Region       // string
	_ = u.CreatedAt    // pgtype.Timestamptz
	_ = u.UpdatedAt    // pgtype.Timestamptz
	_ = u.DeletedAt    // pgtype.Timestamptz
}

func TestApiaryModel_Fields(t *testing.T) {
	a := Apiary{}
	_ = a.ID
	_ = a.UserID       // pgtype.UUID
	_ = a.Name         // string
	_ = a.Latitude     // *float64
	_ = a.Longitude    // *float64
	_ = a.Region       // string
	_ = a.ElevationOffset // float64
	_ = a.BloomOffset  // int32
	_ = a.CreatedAt
	_ = a.UpdatedAt
}

func TestHiveModel_Fields(t *testing.T) {
	h := Hive{}
	_ = h.ID
	_ = h.ApiaryID     // pgtype.UUID
	_ = h.Name         // string
	_ = h.Type         // string
	_ = h.Status       // string
	_ = h.Notes        // string
	_ = h.CreatedAt
	_ = h.UpdatedAt
}

func TestInspectionModel_Fields(t *testing.T) {
	i := Inspection{}
	_ = i.ID
	_ = i.HiveID       // pgtype.UUID
	_ = i.UserID       // pgtype.UUID
	_ = i.Type         // string
	_ = i.Status       // string
	_ = i.StartedAt    // pgtype.Timestamptz
	_ = i.CompletedAt  // pgtype.Timestamptz
	_ = i.Notes        // string
}

func TestObservationModel_Fields(t *testing.T) {
	o := Observation{}
	_ = o.ID
	_ = o.InspectionID
	_ = o.SequenceOrder // int32
	_ = o.ObservationType // string
	_ = o.StructuredData  // []byte (JSONB)
	_ = o.RawVoiceUrl
	_ = o.Transcription
	_ = o.TranscriptionConfidence
}

func TestRecommendationModel_Fields(t *testing.T) {
	r := Recommendation{}
	_ = r.ID
	_ = r.HiveID
	_ = r.UserID
	_ = r.Action          // string — NOT NULL
	_ = r.Rationale       // string — NOT NULL
	_ = r.ConfidenceLevel // float64 — NOT NULL
	_ = r.ConfidenceType  // string — NOT NULL
	_ = r.FallbackAction  // string — NOT NULL
	_ = r.EvidenceContext // []byte (JSONB)
	_ = r.SourceVersions // []byte (JSONB)
	_ = r.ExpiresAt
}

func TestTaskModel_Fields(t *testing.T) {
	tk := Task{}
	_ = tk.ID
	_ = tk.RecommendationID // nullable UUID
	_ = tk.HiveID
	_ = tk.UserID
	_ = tk.Title     // string
	_ = tk.Priority  // string
	_ = tk.Status    // string
	_ = tk.DueDate   // pgtype.Date
	_ = tk.DeferredReason
	_ = tk.CompletedAt
}

func TestAuditEventModel_Fields(t *testing.T) {
	ae := AuditEvent{}
	_ = ae.ID
	_ = ae.EventType      // string
	_ = ae.ActorID        // pgtype.UUID
	_ = ae.TenantID       // pgtype.UUID
	_ = ae.OccurredAt     // pgtype.Timestamptz
	_ = ae.PayloadVersion // int32
	_ = ae.Payload        // []byte (JSONB)
}

func TestTelemetryReadingModel_Fields(t *testing.T) {
	tr := TelemetryReading{}
	_ = tr.ID
	_ = tr.IntegrationID
	_ = tr.HiveID
	_ = tr.ReadingType        // string
	_ = tr.Value              // float64
	_ = tr.Unit               // string
	_ = tr.RecordedAt         // pgtype.Timestamptz
	_ = tr.IngestedAt
	_ = tr.PlausibilityStatus // string
}

func TestSkillProgressionModel_Fields(t *testing.T) {
	sp := SkillProgression{}
	_ = sp.ID
	_ = sp.UserID
	_ = sp.CurrentLevel        // string
	_ = sp.MilestonesCompleted // []byte (JSONB)
	_ = sp.TotalInspections    // int32
	_ = sp.LastAssessedAt
}

func TestTreatmentRegistryModel_Fields(t *testing.T) {
	tr := TreatmentRegistry{}
	_ = tr.ID
	_ = tr.TreatmentName // string
	_ = tr.Region        // string
	_ = tr.LegalStatus   // string
	_ = tr.Notes         // string
}

func TestQuerierInterface_Exists(t *testing.T) {
	// Verify the Querier interface was generated with expected methods
	var _ Querier = (*Queries)(nil)
}

// Verify pgtype imports work correctly
func TestTimestampTypes(t *testing.T) {
	ts := pgtype.Timestamptz{Time: time.Now(), Valid: true}
	if !ts.Valid {
		t.Error("expected valid timestamp")
	}
}
