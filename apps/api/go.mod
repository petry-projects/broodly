module github.com/broodly/api

go 1.26

// Force toolchain to a Go version that includes the fixes for multiple
// standard library vulnerabilities (GO-2026-6090, GO-2026-6089, GO-2026-5972,
// GO-2026-5856, GO-2026-5039). The `go` directive is set to 1.26 to match the
// minimum version required by the toolchain.
toolchain go1.26.6

require github.com/go-chi/chi/v5 v5.2.4
