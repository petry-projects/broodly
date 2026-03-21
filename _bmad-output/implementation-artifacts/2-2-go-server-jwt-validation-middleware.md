# Story 2.2: Go Server JWT Validation Middleware

Status: ready-for-dev

## Story

As a backend service,
I want every GraphQL request validated against Firebase ID tokens,
so that only authenticated users can access the API.

## Acceptance Criteria (BDD)

1. GIVEN a request with no `Authorization` header WHEN it reaches the auth middleware THEN the middleware returns a 401 HTTP response with a structured GraphQL error containing code `UNAUTHENTICATED` and message "Missing authorization token".
2. GIVEN a request with an `Authorization: Bearer <expired-token>` header WHEN it reaches the auth middleware THEN the middleware returns a 401 response with code `UNAUTHENTICATED` and message "Token expired".
3. GIVEN a request with a malformed or tampered JWT WHEN it reaches the auth middleware THEN the middleware returns a 401 response with code `UNAUTHENTICATED` and message "Invalid token".
4. GIVEN a request with a valid Firebase ID token WHEN it reaches the auth middleware THEN the middleware extracts `uid`, `email`, and custom claims (including `role`) from the token, injects them into the Go request context, and passes the request to the next handler.
5. GIVEN the middleware needs to verify JWT signatures WHEN Google rotates their public keys THEN the middleware uses cached keys and refreshes them based on the `Cache-Control` header TTL from the Google public key endpoint.
6. GIVEN a valid request that passes auth middleware WHEN any downstream resolver accesses the context THEN `uid`, `email`, and `role` are retrievable via typed context accessor functions.
7. GIVEN an auth middleware failure WHEN the error is returned THEN it follows the GraphQL error extensions format with `code`, `message`, and `retryable` fields.

## Tasks / Subtasks

- [ ] Write unit tests for JWT validation logic (AC: #1, #2, #3, #4)
  - [ ] Test: request with missing Authorization header returns 401 with `UNAUTHENTICATED` code
  - [ ] Test: request with `Authorization: Bearer` but empty token returns 401
  - [ ] Test: request with expired JWT returns 401 with "Token expired" message
  - [ ] Test: request with malformed JWT (not valid base64/JSON) returns 401
  - [ ] Test: request with JWT signed by wrong key returns 401
  - [ ] Test: request with valid JWT extracts uid, email, and custom claims into context
  - [ ] Test: request with valid JWT but missing `email` claim still succeeds (email optional in some Firebase flows)
- [ ] Write unit tests for public key caching (AC: #5)
  - [ ] Test: first call fetches keys from Google endpoint, second call uses cache
  - [ ] Test: cache expires after TTL, next call re-fetches keys
  - [ ] Test: concurrent requests during key fetch do not cause duplicate fetches (sync.Once or mutex)
  - [ ] Test: graceful fallback if Google key endpoint is unreachable and cached keys exist
- [ ] Write unit tests for context accessor functions (AC: #6)
  - [ ] Test: `UserIDFromContext(ctx)` returns uid when set, returns error when missing
  - [ ] Test: `EmailFromContext(ctx)` returns email when set, returns empty string when missing
  - [ ] Test: `RoleFromContext(ctx)` returns role when set, returns default "owner" when missing
- [ ] Write unit tests for error response format (AC: #7)
  - [ ] Test: auth error response body contains `errors` array with `extensions.code`, `message`, and `extensions.retryable`
  - [ ] Test: `retryable` is false for invalid/malformed tokens, true for temporary failures
- [ ] Write integration test for middleware chain (AC: #1, #4)
  - [ ] Test: full chi middleware chain with mock handler — unauthenticated request blocked, authenticated request reaches handler
- [ ] Implement Google public key fetcher with caching in `apps/api/internal/auth/keys.go` (AC: #5)
  - [ ] Fetch RS256 public keys from `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`
  - [ ] Parse `Cache-Control: max-age=N` header to determine TTL
  - [ ] Store parsed `*rsa.PublicKey` map keyed by `kid`
  - [ ] Use `sync.RWMutex` for concurrent-safe reads and TTL-based refresh
  - [ ] Log key refresh events via `slog`
- [ ] Implement JWT validation function in `apps/api/internal/auth/jwt.go` (AC: #2, #3, #4)
  - [ ] Use `golang-jwt/jwt` v5 to parse and validate token
  - [ ] Validate: `iss` equals `https://securetoken.google.com/<firebase-project-id>`
  - [ ] Validate: `aud` equals Firebase project ID
  - [ ] Validate: `exp` is not past, `iat` is not future
  - [ ] Validate: `sub` (uid) is non-empty
  - [ ] Extract: `sub` as uid, `email`, custom `role` claim
  - [ ] Key function selects signing key by `kid` from cached public keys
- [ ] Implement chi auth middleware in `apps/api/internal/auth/middleware.go` (AC: #1, #4, #6)
  - [ ] Extract `Authorization: Bearer <token>` from request header
  - [ ] Call JWT validation function
  - [ ] On success: inject uid, email, role into `context.Context` via typed context keys
  - [ ] On failure: write structured GraphQL error response and short-circuit (do not call next handler)
- [ ] Implement typed context accessors in `apps/api/internal/auth/context.go` (AC: #6)
  - [ ] `UserIDFromContext(ctx context.Context) (string, error)`
  - [ ] `EmailFromContext(ctx context.Context) (string, error)`
  - [ ] `RoleFromContext(ctx context.Context) (string, error)`
  - [ ] Use unexported context key types to prevent key collisions
- [ ] Implement structured error response in `apps/api/internal/auth/errors.go` (AC: #7)
  - [ ] `AuthError` type with `Code`, `Message`, `Retryable` fields
  - [ ] JSON serialization matching GraphQL error extensions format
  - [ ] Predefined errors: `ErrMissingToken`, `ErrExpiredToken`, `ErrInvalidToken`, `ErrKeyFetchFailed`
- [ ] Register auth middleware in chi router in `apps/api/cmd/server/main.go` (AC: #1)
  - [ ] Apply auth middleware to all `/graphql` routes
  - [ ] Exclude health check endpoint (`/healthz`) from auth middleware

## Dev Notes

### Architecture Compliance
- JWT validation uses `golang-jwt/jwt` v5 per architecture.md key Go package recommendations
- Middleware is implemented as chi middleware per architecture.md — chi v5 composable middleware pattern
- Server ONLY validates tokens; it never issues or refreshes them — client manages refresh exclusively
- Context accessors follow Go idiom with unexported key types per standard library patterns
- Error responses follow the GraphQL error extensions contract from architecture.md: `code`, `message`, `retryable`
- Auth middleware lives in `apps/api/internal/auth/` per project directory structure

### TDD Requirements (Tests First!)
- **Test 1:** `TestMiddleware_MissingHeader` — create `httptest.NewRequest` with no Authorization header, pass through middleware, assert response status 401 and body contains `"code":"UNAUTHENTICATED"`.
- **Test 2:** `TestMiddleware_ExpiredToken` — generate a JWT with `exp` in the past, sign with test RSA key, pass through middleware, assert 401 and body contains "Token expired".
- **Test 3:** `TestMiddleware_MalformedToken` — pass `Authorization: Bearer not-a-jwt`, assert 401 and body contains "Invalid token".
- **Test 4:** `TestMiddleware_WrongSigningKey` — generate JWT signed with a different RSA key than the one in the mock key store, assert 401.
- **Test 5:** `TestMiddleware_ValidToken` — generate a valid JWT with `sub`, `email`, `role` claims signed with the test RSA key. Pass through middleware. Assert next handler is called. Assert `UserIDFromContext` returns correct uid, `EmailFromContext` returns correct email, `RoleFromContext` returns correct role.
- **Test 6:** `TestKeyCache_FetchAndCache` — mock HTTP server returning Google-format public keys with `Cache-Control: max-age=3600`. First call fetches, second call returns from cache. Third call after TTL re-fetches.
- **Test 7:** `TestKeyCache_ConcurrentAccess` — launch 100 goroutines requesting keys simultaneously, assert only 1 HTTP fetch occurs (sync protection).
- **Test 8:** `TestContextAccessors_Missing` — call `UserIDFromContext` on an empty context, assert error returned. Call on a context with user set, assert correct value.
- **Test 9:** `TestErrorFormat` — serialize `AuthError{Code: "UNAUTHENTICATED", Message: "Missing authorization token", Retryable: false}`, assert JSON matches `{"errors":[{"message":"...","extensions":{"code":"...","retryable":false}}]}`.
- **Test 10:** Integration test — spin up chi router with auth middleware and a test handler, make HTTP requests with valid/invalid tokens via `httptest.Server`, assert full request/response cycle.

### Technical Specifications
- **Package:** `github.com/golang-jwt/jwt/v5` for JWT parsing and validation
- **Google public key endpoint:** `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`
- **Token issuer:** `https://securetoken.google.com/<FIREBASE_PROJECT_ID>`
- **Token audience:** `<FIREBASE_PROJECT_ID>`
- **Signing algorithm:** RS256 (RSA PKCS1 v1.5 with SHA-256)
- **Firebase project ID:** loaded from environment variable `FIREBASE_PROJECT_ID`
- **Key cache TTL:** parsed from Google response `Cache-Control: max-age` header (typically 6 hours)
- **Custom claims path:** `role` field in JWT custom claims (set via Firebase Admin SDK)
- **Logging:** `log/slog` structured JSON logging for all auth events (key refresh, auth failures)

### Anti-Patterns to Avoid
- DO NOT use Firebase Admin SDK for token validation in Go — use `golang-jwt/jwt` with Google public keys directly (architecture.md specifies this approach)
- DO NOT hardcode the Firebase project ID — load from environment variable
- DO NOT skip JWT `exp`, `iat`, `iss`, `aud` validation — all four must be checked
- DO NOT use exported context key types — use unexported types to prevent external key collisions
- DO NOT fetch Google public keys on every request — implement caching with TTL
- DO NOT return bare HTTP errors — always return structured GraphQL error format
- DO NOT log JWT token values — log only uid and error types for security
- DO NOT apply auth middleware to health check endpoints — `/healthz` must remain unauthenticated
- DO NOT assume `email` claim always exists — some Firebase auth flows may not include it
- DO NOT use `HS256` (symmetric) validation — Firebase uses `RS256` (asymmetric) exclusively

### Project Structure Notes
- `apps/api/internal/auth/middleware.go` — chi auth middleware
- `apps/api/internal/auth/middleware_test.go` — middleware unit tests
- `apps/api/internal/auth/jwt.go` — JWT parsing and validation logic
- `apps/api/internal/auth/jwt_test.go` — JWT validation unit tests
- `apps/api/internal/auth/keys.go` — Google public key fetcher with caching
- `apps/api/internal/auth/keys_test.go` — key cache unit tests
- `apps/api/internal/auth/context.go` — typed context accessors
- `apps/api/internal/auth/context_test.go` — context accessor tests
- `apps/api/internal/auth/errors.go` — structured auth error types
- `apps/api/internal/auth/errors_test.go` — error format tests

### References
- [Source: architecture.md#Authentication & Security — Firebase Admin SDK validates ID tokens server-side via Go JWT validation against Google public keys]
- [Source: architecture.md#Key Go Package Recommendations — golang-jwt/jwt v5]
- [Source: architecture.md#Authentication & Security — Token strategy: Firebase ID tokens (short-lived, 1 hour)]
- [Source: architecture.md#API & Communication Patterns — Error handling: typed domain errors via GraphQL error extensions]
- [Source: epics.md#Story 2.2 — FR1a, FR55]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
