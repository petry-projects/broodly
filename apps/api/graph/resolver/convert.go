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
	// Simple hex parse, strip dashes
	clean := strings.ReplaceAll(s, "-", "")
	if len(clean) != 32 {
		return u
	}
	for i := 0; i < 16; i++ {
		hi := hexVal(clean[i*2])
		lo := hexVal(clean[i*2+1])
		u.Bytes[i] = hi<<4 | lo
	}
	u.Valid = true
	return u
}

func hexVal(c byte) byte {
	switch {
	case c >= '0' && c <= '9':
		return c - '0'
	case c >= 'a' && c <= 'f':
		return c - 'a' + 10
	case c >= 'A' && c <= 'F':
		return c - 'A' + 10
	default:
		return 0
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
		CreatedAt:       timestampToTime(a.CreatedAt),
		UpdatedAt:       timestampToTime(a.UpdatedAt),
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
		ID:        uuidToString(h.ID),
		Name:      h.Name,
		Type:      model.HiveType(strings.ToUpper(h.Type)),
		Status:    model.HiveStatus(strings.ToUpper(h.Status)),
		Notes:     h.Notes,
		CreatedAt: timestampToTime(h.CreatedAt),
		UpdatedAt: timestampToTime(h.UpdatedAt),
	}
}

func inspectionToModel(i repository.Inspection) *model.Inspection {
	m := &model.Inspection{
		ID:        uuidToString(i.ID),
		Type:      model.InspectionType(strings.ToUpper(i.Type)),
		Status:    model.InspectionStatus(strings.ToUpper(i.Status)),
		StartedAt: timestampToTime(i.StartedAt),
		Notes:     i.Notes,
		CreatedAt: timestampToTime(i.CreatedAt),
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
		CreatedAt:       timestampToTime(o.CreatedAt),
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
