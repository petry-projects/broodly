module github.com/broodly/api

go 1.24

// Force toolchain to a Go version that includes the fixes for
// GO-2026-4866, GO-2026-4870, GO-2026-4946, GO-2026-4947 (all crypto/tls
// and crypto/x509 stdlib fixes shipped in 1.26.2). The `go` directive
// stays at 1.24 because no language features above that are used.
toolchain go1.26.2

require github.com/go-chi/chi/v5 v5.2.2
