package resolver

import (
	"github.com/broodly/api/internal/service"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct {
	ApiaryService     *service.ApiaryService
	HiveService       *service.HiveService
	InspectionService *service.InspectionService
	PlanningService   *service.PlanningService
	ExportService     *service.ExportService
}
