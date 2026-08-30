module github.com/broodly/api

go 1.26

// Pin toolchain to go1.26.2 to include fixes for GO-2026-4866, GO-2026-4870,
// GO-2026-4946, GO-2026-4947 (crypto/tls and crypto/x509 stdlib security fixes).
toolchain go1.26.2

require github.com/go-chi/chi/v5 v5.2.4
