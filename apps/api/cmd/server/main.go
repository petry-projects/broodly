package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/broodly/api/internal/auth"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		projectID = "broodly-dev"
	}

	keyCache := auth.NewKeyCache("", nil)

	r := newRouter(projectID, keyCache)

	addr := ":8080"
	log.Printf("Broodly API server starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func newRouter(projectID string, keyCache *auth.KeyCache) *chi.Mux {
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Health check — no auth required
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok"}`)
	})

	// GraphQL — protected by Firebase auth middleware
	r.Group(func(r chi.Router) {
		r.Use(auth.Middleware(projectID, keyCache))
		r.Post("/graphql", func(w http.ResponseWriter, r *http.Request) {
			// Placeholder — gqlgen handler will be registered here in Story 4.1
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprintf(w, `{"data":null}`)
		})
	})

	return r
}
