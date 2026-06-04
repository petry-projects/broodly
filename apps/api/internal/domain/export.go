package domain

import "time"

// ExportFormat represents the file format for data export.
type ExportFormat string

const (
	ExportFormatJSON ExportFormat = "json"
	ExportFormatCSV  ExportFormat = "csv"
)

// ExportStatus represents the lifecycle status of an export job.
type ExportStatus string

const (
	ExportStatusPending    ExportStatus = "pending"
	ExportStatusProcessing ExportStatus = "processing"
	ExportStatusCompleted  ExportStatus = "completed"
	ExportStatusFailed     ExportStatus = "failed"
)

// ExportJob tracks the state of a data export request.
type ExportJob struct {
	ID          string
	UserID      string
	Format      ExportFormat
	Status      ExportStatus
	DownloadURL string
	CreatedAt   time.Time
	CompletedAt *time.Time
}

// DisclaimerText is the compliance disclaimer included in all exports.
const DisclaimerText = "DISCLAIMER: This data is exported from Broodly for personal use. " +
	"AI-generated recommendations are decision-support tools only and do not constitute " +
	"professional veterinary or agricultural advice. Always consult qualified professionals " +
	"for critical hive management decisions."
