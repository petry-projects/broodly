module github.com/broodly/api

go 1.24

// Force toolchain to a Go version that includes the fixes for
// GO-2026-4866, GO-2026-4870, GO-2026-4946, GO-2026-4947, GO-2026-4971,
// GO-2026-5037, GO-2026-5039, GO-2026-5856, GO-2026-5972, GO-2026-6089,
// GO-2026-6090 (all crypto/tls, crypto/x509, net, net/textproto, and
// encoding/asn1 stdlib security fixes). The `go` directive stays at 1.24
// because no language features above that are used.
toolchain go1.26.6

require github.com/go-chi/chi/v5 v5.2.4
