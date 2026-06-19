# digest pinned for supply-chain security; encodes golang 1.24-alpine
FROM golang@sha256:8bee1901f1e530bfb4a7850aa7a479d17ae3a18beb6e09064ed54cfd245b7191 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/server ./cmd/server

FROM gcr.io/distroless/static-debian12@sha256:9c346e4be81b5ca7ff31a0d89eaeade58b0f95cfd3baed1f36083ddb47ca3160

COPY --from=builder /bin/server /server

# 65532 is the standard distroless nonroot UID; avoids resolving "nonroot" username absent in base static image
USER 65532:65532

EXPOSE 8080

ENTRYPOINT ["/server"]
