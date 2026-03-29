package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/broodly/api/internal/adapter"
	"github.com/broodly/api/internal/domain"
	"github.com/broodly/api/internal/repository"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ExportService handles data export operations.
type ExportService struct {
	queries repository.Querier
	storage adapter.StorageClient
	bucket  string
}

// NewExportService creates an ExportService.
func NewExportService(q repository.Querier, storage adapter.StorageClient) *ExportService {
	bucket := os.Getenv("EXPORT_BUCKET")
	if bucket == "" {
		bucket = "broodly-media-dev"
	}
	return &ExportService{queries: q, storage: storage, bucket: bucket}
}

// Export generates an export file and returns an ExportJob with a signed download URL.
func (s *ExportService) Export(ctx context.Context, userID pgtype.UUID, format domain.ExportFormat) (*domain.ExportJob, error) {
	jobID := uuid.New().String()
	userIDStr := uuidToString(userID)

	// Assemble data
	data, err := s.assembleData(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Serialize
	var content []byte
	var contentType string
	var ext string

	switch format {
	case domain.ExportFormatJSON:
		content, err = s.serializeJSON(data)
		contentType = "application/json"
		ext = "json"
	case domain.ExportFormatCSV:
		content, err = s.serializeCSV(data)
		contentType = "text/csv"
		ext = "csv"
	default:
		return nil, &domain.DomainError{Code: domain.ErrCodeValidation, Message: "unsupported export format"}
	}
	if err != nil {
		return nil, err
	}

	// Upload
	path := fmt.Sprintf("exports/%s/%s.%s", userIDStr, jobID, ext)
	if err := s.storage.Upload(ctx, s.bucket, path, content, contentType); err != nil {
		return nil, err
	}

	// Generate signed URL
	downloadURL, err := s.storage.SignedURL(ctx, s.bucket, path, adapter.SignedURLExpiry)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	return &domain.ExportJob{
		ID:          jobID,
		UserID:      userIDStr,
		Format:      format,
		Status:      domain.ExportStatusCompleted,
		DownloadURL: downloadURL,
		CreatedAt:   now,
		CompletedAt: &now,
	}, nil
}

type exportData struct {
	Apiaries        []repository.Apiary        `json:"apiaries"`
	Hives           []repository.Hive          `json:"hives"`
	Inspections     []repository.Inspection    `json:"inspections"`
	Observations    []repository.Observation   `json:"observations"`
	Recommendations []repository.Recommendation `json:"recommendations"`
	Tasks           []repository.Task          `json:"tasks"`
}

func (s *ExportService) assembleData(ctx context.Context, userID pgtype.UUID) (*exportData, error) {
	apiaries, err := s.queries.ListApiariesByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	var allHives []repository.Hive
	for _, a := range apiaries {
		hives, err := s.queries.ListHivesByApiary(ctx, a.ID)
		if err != nil {
			return nil, err
		}
		allHives = append(allHives, hives...)
	}

	inspections, err := s.queries.ListInspectionsByUser(ctx, repository.ListInspectionsByUserParams{
		UserID: userID, Limit: 10000, Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	var allObs []repository.Observation
	for _, insp := range inspections {
		obs, err := s.queries.ListObservationsByInspection(ctx, insp.ID)
		if err != nil {
			return nil, err
		}
		allObs = append(allObs, obs...)
	}

	recs, err := s.queries.ListActiveRecommendationsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	tasks, err := s.queries.ListTasksByUser(ctx, repository.ListTasksByUserParams{
		UserID: userID, Limit: 10000, Offset: 0,
	})
	if err != nil {
		return nil, err
	}

	return &exportData{
		Apiaries:        apiaries,
		Hives:           allHives,
		Inspections:     inspections,
		Observations:    allObs,
		Recommendations: recs,
		Tasks:           tasks,
	}, nil
}

func (s *ExportService) serializeJSON(data *exportData) ([]byte, error) {
	export := map[string]any{
		"disclaimer":      domain.DisclaimerText,
		"exportedAt":      time.Now().UTC().Format(time.RFC3339),
		"apiaries":        data.Apiaries,
		"hives":           data.Hives,
		"inspections":     data.Inspections,
		"observations":    data.Observations,
		"recommendations": data.Recommendations,
		"tasks":           data.Tasks,
	}
	return json.MarshalIndent(export, "", "  ")
}

func (s *ExportService) serializeCSV(data *exportData) ([]byte, error) {
	var buf bytes.Buffer

	// BOM for Excel compatibility
	buf.Write([]byte{0xEF, 0xBB, 0xBF})

	w := csv.NewWriter(&buf)

	// Disclaimer row
	_ = w.Write([]string{domain.DisclaimerText})
	_ = w.Write([]string{""})

	// Apiaries section
	_ = w.Write([]string{"--- APIARIES ---"})
	_ = w.Write([]string{"ID", "Name", "Region", "Latitude", "Longitude"})
	for _, a := range data.Apiaries {
		lat := ""
		if a.Latitude.Valid {
			lat = fmt.Sprintf("%.6f", a.Latitude.Float64)
		}
		lon := ""
		if a.Longitude.Valid {
			lon = fmt.Sprintf("%.6f", a.Longitude.Float64)
		}
		_ = w.Write([]string{uuidToString(a.ID), a.Name, a.Region, lat, lon})
	}
	_ = w.Write([]string{""})

	// Hives section
	_ = w.Write([]string{"--- HIVES ---"})
	_ = w.Write([]string{"ID", "ApiaryID", "Name", "Type", "Status"})
	for _, h := range data.Hives {
		_ = w.Write([]string{uuidToString(h.ID), uuidToString(h.ApiaryID), h.Name, h.Type, h.Status})
	}
	_ = w.Write([]string{""})

	// Inspections section
	_ = w.Write([]string{"--- INSPECTIONS ---"})
	_ = w.Write([]string{"ID", "HiveID", "Type", "Status", "StartedAt"})
	for _, i := range data.Inspections {
		_ = w.Write([]string{uuidToString(i.ID), uuidToString(i.HiveID), i.Type, i.Status, i.StartedAt.Time.Format(time.RFC3339)})
	}

	w.Flush()
	return buf.Bytes(), w.Error()
}
