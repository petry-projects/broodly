package resolver

import (
	"strings"
	"time"

	"github.com/broodly/api/graph/model"
	"github.com/broodly/api/internal/repository"
	"github.com/broodly/api/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
)

func uuidToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	return formatUUID(b)
}

func formatUUID(b [16]byte) string {
	return strings.Join([]string{
		hex(b[0:4]),
		hex(b[4:6]),
		hex(b[6:8]),
		hex(b[8:10]),
		hex(b[10:16]),
	}, "-")
}

func hex(b []byte) string {
	const hextable = "0123456789abcdef"
	dst := make([]byte, len(b)*2)
	for i, v := range b {
		dst[i*2] = hextable[v>>4]
		dst[i*2+1] = hextable[v&0x0f]
	}
	return string(dst)
}

func stringToUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	// Strip dashes and validate exact length
	clean := strings.ReplaceAll(s, "-", "")
	if len(clean) != 32 {
		return u
	}
	// Validate all characters are valid hex before marking as Valid
	for i := 0; i < 16; i++ {
		hi, ok1 := strictHexVal(clean[i*2])
		lo, ok2 := strictHexVal(clean[i*2+1])
		if !ok1 || !ok2 {
			return pgtype.UUID{}
		}
		u.Bytes[i] = hi<<4 | lo
	}
	u.Valid = true
	return u
}

// strictHexVal converts a hex character to its numeric value,
// returning false if the character is not a valid hex digit.
func strictHexVal(c byte) (byte, bool) {
	switch {
	case c >= '0' && c <= '9':
		return c - '0', true
	case c >= 'a' && c <= 'f':
		return c - 'a' + 10, true
	case c >= 'A' && c <= 'F':
		return c - 'A' + 10, true
	default:
		return 0, false
	}
}

func timestampToTime(ts pgtype.Timestamptz) time.Time {
	if !ts.Valid {
		return time.Time{}
	}
	return ts.Time
}

func timePtr(ts pgtype.Timestamptz) *time.Time {
	if !ts.Valid {
		return nil
	}
	t := ts.Time
	return &t
}

func float8ToPtr(f pgtype.Float8) *float64 {
	if !f.Valid {
		return nil
	}
	return &f.Float64
}

func apiaryToModel(a repository.Apiary) *model.Apiary {
	return &model.Apiary{
		ID:              uuidToString(a.ID),
		Name:            a.Name,
		Latitude:        float8ToPtr(a.Latitude),
		Longitude:       float8ToPtr(a.Longitude),
		Region:          a.Region,
		ElevationOffset: a.ElevationOffset,
		BloomOffset:     int(a.BloomOffset),
		// Hives is initialized to an empty slice; populate via a field resolver or
		// dataloader when nested hive data is required.
		Hives:     []*model.Hive{},
		CreatedAt: timestampToTime(a.CreatedAt),
		UpdatedAt: timestampToTime(a.UpdatedAt),
	}
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func hiveToModel(h repository.Hive) *model.Hive {
	return &model.Hive{
		ID:   uuidToString(h.ID),
		Name: h.Name,
		Type: model.HiveType(strings.ToUpper(h.Type)),
		// Apiary is a non-null field in the schema (apiary: Apiary!).
		// Populate via a field resolver or dataloader when the nested apiary is required.
		Apiary:    nil,
		Status:    model.HiveStatus(strings.ToUpper(h.Status)),
		Notes:     h.Notes,
		CreatedAt: timestampToTime(h.CreatedAt),
		UpdatedAt: timestampToTime(h.UpdatedAt),
	}
}

func inspectionToModel(i repository.Inspection) *model.Inspection {
	m := &model.Inspection{
		ID:   uuidToString(i.ID),
		Type: model.InspectionType(strings.ToUpper(i.Type)),
		// Hive is a non-null field in the schema (hive: Hive!).
		// Populate via a field resolver or dataloader when the nested hive is required.
		Hive:         nil,
		Status:       model.InspectionStatus(strings.ToUpper(i.Status)),
		StartedAt:    timestampToTime(i.StartedAt),
		Notes:        i.Notes,
		CreatedAt:    timestampToTime(i.CreatedAt),
		Observations: []*model.Observation{},
	}
	if i.CompletedAt.Valid {
		t := i.CompletedAt.Time
		m.CompletedAt = &t
	}
	return m
}

func observationToModel(o repository.Observation) *model.Observation {
	m := &model.Observation{
		ID:              uuidToString(o.ID),
		SequenceOrder:   int(o.SequenceOrder),
		ObservationType: model.ObservationType(strings.ToUpper(o.ObservationType)),
		// Inspection is a non-null field in the schema (inspection: Inspection!).
		// Populate via a field resolver or dataloader when the parent inspection is required.
		Inspection: nil,
		// Media is initialized to an empty slice; populate via a field resolver or
		// dataloader when attached media is required.
		Media:     []*model.Media{},
		CreatedAt: timestampToTime(o.CreatedAt),
	}
	if o.RawVoiceUrl.Valid {
		m.RawVoiceURL = &o.RawVoiceUrl.String
	}
	if o.Transcription.Valid {
		m.Transcription = &o.Transcription.String
	}
	if o.TranscriptionConfidence.Valid {
		m.TranscriptionConfidence = &o.TranscriptionConfidence.Float64
	}
	return m
}

// uuidToStringR is an alias for uuidToString used by resolver files that import convert.go.
func uuidToStringR(u pgtype.UUID) string {
	return uuidToString(u)
}

// timePtrVal with explicit valid flag for non-Timestamptz types.
func timePtrVal(t time.Time, valid bool) *time.Time {
	if !valid {
		return nil
	}
	return &t
}

func taskToModel(t repository.Task) *model.Task {
	m := &model.Task{
		ID:              uuidToStringR(t.ID),
		Title:           t.Title,
		Priority:        model.TaskPriority(strings.ToUpper(t.Priority)),
		Status:          model.TaskStatus(strings.ToUpper(t.Status)),
		DueDate:         timePtrVal(t.DueDate.Time, t.DueDate.Valid),
		CompletedAt:     timePtrVal(t.CompletedAt.Time, t.CompletedAt.Valid),
		IsOverdue:       service.IsOverdue(t),
		CatchUpGuidance: service.CatchUpGuidance(t),
		CreatedAt:       timestampToTime(t.CreatedAt),
	}
	if t.DeferredReason.Valid {
		m.DeferredReason = &t.DeferredReason.String
	}
	return m
}
