module github.com/broodly/api

go 1.24

// Force toolchain to a Go version that includes the fixes for multiple
// standard library vulnerabilities (GO-2026-6090, GO-2026-6089, GO-2026-5972,
// GO-2026-5856, GO-2026-5039), all of which are fixed in go1.26.6. The `go`
// directive stays at 1.24 because no language features above that are used and
// govulncheck's bundled analyzer cannot parse a higher directive.
toolchain go1.26.6

require github.com/go-chi/chi/v5 v5.3.0
