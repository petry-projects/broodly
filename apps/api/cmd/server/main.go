package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/broodly/api/graph"
	"github.com/broodly/api/graph/resolver"
	"github.com/broodly/api/internal/adapter"
	"github.com/broodly/api/internal/auth"
	"github.com/broodly/api/internal/event"
	"github.com/broodly/api/internal/repository"
	"github.com/broodly/api/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		projectID = "broodly-dev"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://broodly:broodly@localhost:5432/broodly?sslmode=disable"
	}

	// Connect to PostgreSQL
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("unable to connect to database: %v", err)
	}
	defer pool.Close()

	// Verify connectivity
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}
	log.Println("Connected to database")

	// Build dependency graph
	queries := repository.New(pool)
	storage := &adapter.NoOpStorageClient{}
	publisher := &event.NoOpPublisher{}

	apiaryService := service.NewApiaryService(queries)
	hiveService := service.NewHiveService(queries)
	inspectionService := service.NewInspectionService(queries, publisher)
	planningService := service.NewPlanningService(queries)
	exportService := service.NewExportService(queries, storage)

	res := &resolver.Resolver{
		ApiaryService:     apiaryService,
		HiveService:       hiveService,
		InspectionService: inspectionService,
		PlanningService:   planningService,
		ExportService:     exportService,
		Queries:           queries,
	}

	keyCache := auth.NewKeyCache("", nil)
	r := newRouter(projectID, keyCache, res)

	addr := ":8080"
	log.Printf("Broodly API server starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func newRouter(projectID string, keyCache *auth.KeyCache, res *resolver.Resolver) *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	// Health check — no auth required
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok"}`)
	})

	// GraphQL — protected by Firebase auth middleware
	schema := graph.NewExecutableSchema(graph.Config{Resolvers: res})
	srv := handler.NewDefaultServer(schema)

	r.Group(func(r chi.Router) {
		r.Use(auth.Middleware(projectID, keyCache))
		r.Handle("/graphql", srv)
	})

	return r
}

func corsMiddleware(next http.Handler) http.Handler {
	origin := os.Getenv("CORS_ORIGIN")
	if origin == "" {
		origin = "http://localhost:8081"
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
