# Story 1.4: Terraform Baseline for GCP Dev Environment

Status: ready-for-dev

## Story

As a developer,
I want Terraform provisioning a dev GCP project with Cloud SQL, Cloud Run placeholder, Cloud Storage bucket, and Pub/Sub topics,
so that backend stories have infrastructure ready.

## Acceptance Criteria (BDD)

1. GIVEN the `infra/terraform/environments/dev/` configuration WHEN I run `terraform validate` THEN all `.tf` files pass validation with no errors.
2. GIVEN a clean Terraform state WHEN I run `terraform plan` THEN it produces a valid execution plan with no errors and lists all expected resources.
3. GIVEN the Terraform plan WHEN I inspect the Cloud SQL resource THEN it provisions PostgreSQL 16 on `db-f1-micro` tier with `pgvector` extension enabled.
4. GIVEN the Terraform plan WHEN I inspect the Cloud Storage resource THEN it creates a bucket named `broodly-media-dev` with lifecycle rules (Nearline after 90 days, Archive after 1 year).
5. GIVEN the Terraform plan WHEN I inspect the Pub/Sub resources THEN it creates five topics: `inspection-events`, `media-uploaded`, `telemetry-ingested`, `notification-dispatch`, `embedding-requests`, each with a dead-letter topic.
6. GIVEN the Terraform plan WHEN I inspect Secret Manager resources THEN entries exist for Firebase service account credentials and database credentials.
7. GIVEN the Terraform plan WHEN I inspect IAM resources THEN separate service accounts exist for Cloud Run API service and Cloud Run worker service with least-privilege roles.
8. GIVEN the Terraform configuration WHEN I inspect the backend block THEN state is stored remotely in a GCS bucket with a per-environment state file path.

## Tasks / Subtasks

- [ ] Create Terraform module structure (AC: #1, #2)
  - [ ] Create `infra/terraform/modules/cloud-sql/main.tf`, `variables.tf`, `outputs.tf`
  - [ ] Create `infra/terraform/modules/storage/main.tf`, `variables.tf`, `outputs.tf`
  - [ ] Create `infra/terraform/modules/pubsub/main.tf`, `variables.tf`, `outputs.tf`
  - [ ] Create `infra/terraform/modules/cloud-run/main.tf`, `variables.tf`, `outputs.tf` (placeholder for future)
  - [ ] Create `infra/terraform/modules/firebase/main.tf`, `variables.tf`, `outputs.tf` (placeholder for future)
  - [ ] Create `infra/terraform/modules/vertex-ai/main.tf`, `variables.tf`, `outputs.tf` (placeholder for future)
- [ ] Configure Cloud SQL module (AC: #3)
  - [ ] Resource: `google_sql_database_instance` — PostgreSQL 16, `db-f1-micro` tier for dev
  - [ ] Set `database_version = "POSTGRES_16"`
  - [ ] Enable automated backups with point-in-time recovery
  - [ ] Resource: `google_sql_database` — create `broodly` database
  - [ ] Resource: `google_sql_user` — create application user (password from Secret Manager)
  - [ ] Enable `pgvector` extension via `google_sql_database` flags or post-provisioning script
  - [ ] Set `deletion_protection = false` for dev environment only
  - [ ] Configure private IP or authorized networks for dev access
  - [ ] Output: connection name, IP address, database name
- [ ] Configure Cloud Storage module (AC: #4)
  - [ ] Resource: `google_storage_bucket` — name `broodly-media-dev`
  - [ ] Set `location` to match project region
  - [ ] Set `uniform_bucket_level_access = true`
  - [ ] Lifecycle rule: transition to `NEARLINE` after 90 days
  - [ ] Lifecycle rule: transition to `ARCHIVE` after 365 days
  - [ ] Enable versioning for media protection
  - [ ] CORS configuration for signed URL uploads from web client
  - [ ] Output: bucket name, bucket URL
- [ ] Configure Pub/Sub module (AC: #5)
  - [ ] Resource: `google_pubsub_topic` for each of the five topics:
    - `inspection-events`
    - `media-uploaded`
    - `telemetry-ingested`
    - `notification-dispatch`
    - `embedding-requests`
  - [ ] Resource: `google_pubsub_topic` for dead-letter topics: `<topic-name>-dlq` for each
  - [ ] Resource: `google_pubsub_subscription` placeholder for each topic (push to Cloud Run worker, configured later)
  - [ ] Set message retention duration: 7 days
  - [ ] Configure dead-letter policy: max delivery attempts = 5, then route to DLQ topic
  - [ ] Output: topic names, subscription names
- [ ] Configure Secret Manager entries (AC: #6)
  - [ ] Resource: `google_secret_manager_secret` — `firebase-service-account`
  - [ ] Resource: `google_secret_manager_secret` — `db-password`
  - [ ] Resource: `google_secret_manager_secret` — `db-connection-string`
  - [ ] Note: secret VALUES are not stored in Terraform — only the secret containers are created. Values are set manually or via CI.
  - [ ] IAM binding: grant Cloud Run service accounts `roles/secretmanager.secretAccessor`
- [ ] Configure IAM service accounts (AC: #7)
  - [ ] Resource: `google_service_account` — `broodly-api-dev` for Cloud Run API service
  - [ ] Resource: `google_service_account` — `broodly-worker-dev` for Cloud Run worker service
  - [ ] IAM roles for API service account:
    - `roles/cloudsql.client` (Cloud SQL access)
    - `roles/pubsub.publisher` (publish events)
    - `roles/storage.objectAdmin` (signed URL generation)
    - `roles/secretmanager.secretAccessor` (read secrets)
  - [ ] IAM roles for worker service account:
    - `roles/cloudsql.client` (Cloud SQL access)
    - `roles/pubsub.subscriber` (consume events)
    - `roles/storage.objectViewer` (read media)
    - `roles/aiplatform.user` (Vertex AI access)
    - `roles/secretmanager.secretAccessor` (read secrets)
  - [ ] Output: service account emails
- [ ] Configure dev environment entry point (AC: #1, #2, #8)
  - [ ] Create `infra/terraform/environments/dev/main.tf` — calls all modules with dev-specific variables
  - [ ] Create `infra/terraform/environments/dev/variables.tf` — project ID, region, environment name
  - [ ] Create `infra/terraform/environments/dev/outputs.tf` — aggregate module outputs
  - [ ] Create `infra/terraform/environments/dev/terraform.tfvars` (gitignored template) or `terraform.tfvars.example`
  - [ ] Create `infra/terraform/environments/dev/backend.tf` — GCS backend with `prefix = "dev"` for state isolation
  - [ ] Set `provider "google"` and `provider "google-beta"` with project and region variables
  - [ ] Require Terraform >= 1.5 and `google` provider >= 5.0
- [ ] Configure remote state backend (AC: #8)
  - [ ] Backend: `gcs` bucket for Terraform state (e.g., `broodly-terraform-state`)
  - [ ] State path prefix: `dev/` for dev environment
  - [ ] Document: state bucket must be created manually before first `terraform init`
  - [ ] Enable state locking
- [ ] Add Cloud Run placeholder (AC: #2)
  - [ ] Create Cloud Run module with placeholder resources (commented out or minimal)
  - [ ] Document: Cloud Run services will be deployed in later stories when Docker images are ready
  - [ ] Define placeholder variables: service name, image, memory, CPU, min/max instances
- [ ] Add `.gitignore` for Terraform (AC: #1)
  - [ ] Ignore `*.tfstate`, `*.tfstate.backup`, `.terraform/`, `*.tfvars` (except `.example`)
  - [ ] Ignore `.terraform.lock.hcl` if using provider version constraints in code
- [ ] Validate configuration (AC: #1, #2)
  - [ ] Run `terraform init` in `infra/terraform/environments/dev/`
  - [ ] Run `terraform validate` — assert no errors
  - [ ] Run `terraform plan` — assert valid plan output
  - [ ] Document all provisioned resources in completion notes

## Dev Notes

### Architecture Compliance
- All infrastructure is on GCP exclusively per architecture.md
- Use `google` and `google-beta` Terraform providers
- Separate state files per environment (dev/staging/prod) with GCS backend
- Modules in `infra/terraform/modules/` are reusable across environments
- Environment-specific configs in `infra/terraform/environments/<env>/`
- IAM follows least-privilege principle with separate service accounts per Cloud Run service
- Secret values are NEVER stored in Terraform code — only secret containers are created

### TDD Requirements (Tests First!)
- Test 1: **terraform validate** — Run `terraform validate` in `infra/terraform/environments/dev/` and assert exit code 0. This validates HCL syntax and configuration references.
- Test 2: **terraform plan** — Run `terraform plan -out=plan.tfplan` and assert exit code 0 with no errors. Inspect the plan output for expected resource counts.
- Test 3: **Module validation** — For each module in `infra/terraform/modules/`, run `terraform validate` in isolation (with mock variables) to ensure module-level correctness.
- Test 4: **Naming convention test** — Write a script that parses all `.tf` files and asserts resource names follow the pattern `broodly-<resource>-<env>` (e.g., `broodly-media-dev`, `broodly-api-dev`).

### Technical Specifications
- **Terraform:** >= 1.5
- **Google provider:** >= 5.0 (`hashicorp/google` and `hashicorp/google-beta`)
- **Cloud SQL:** PostgreSQL 16, `db-f1-micro` tier (dev), pgvector extension
- **Cloud Storage:** `broodly-media-dev`, lifecycle rules (Nearline 90d, Archive 365d)
- **Pub/Sub topics:** `inspection-events`, `media-uploaded`, `telemetry-ingested`, `notification-dispatch`, `embedding-requests`
- **Dead-letter topics:** `<topic>-dlq` for each, max 5 delivery attempts
- **Pub/Sub message retention:** 7 days
- **Secret Manager secrets:** `firebase-service-account`, `db-password`, `db-connection-string`
- **Service accounts:** `broodly-api-dev@<project>.iam.gserviceaccount.com`, `broodly-worker-dev@<project>.iam.gserviceaccount.com`
- **GCS signed URL expiry:** 15 minutes (configured in application code, not Terraform)
- **Cloud Run (placeholder):** min 0 instances for dev, 512 MiB memory, 1 vCPU

### Anti-Patterns to Avoid
- DO NOT store secret values in Terraform code or `.tfvars` files committed to git — use Secret Manager and set values via CLI or CI
- DO NOT use a single state file for all environments — each environment gets its own state prefix
- DO NOT enable `deletion_protection` in dev — it makes teardown difficult; DO enable it in staging/prod
- DO NOT use `default_table_expiration` on Cloud SQL — not applicable to PostgreSQL
- DO NOT create Cloud Run services yet — only the service accounts and IAM bindings; actual services deploy when Docker images exist
- DO NOT use `google_project_iam_member` with overly broad roles like `roles/editor` — use specific roles
- DO NOT hardcode the GCP project ID — use variables
- DO NOT skip dead-letter topics on Pub/Sub — they are required for operational visibility
- DO NOT commit `terraform.tfvars` with real values — commit only `.tfvars.example` with placeholder values
- DO NOT use local state backend — always use GCS remote backend for team collaboration
- DO NOT provision resources in multiple regions for dev — use a single region to minimize cost

### Project Structure Notes
- `infra/terraform/main.tf` — Root placeholder (environments are the actual entry points)
- `infra/terraform/modules/cloud-sql/` — PostgreSQL instance, database, user, extensions
- `infra/terraform/modules/storage/` — GCS bucket with lifecycle rules
- `infra/terraform/modules/pubsub/` — Topics, subscriptions, dead-letter configuration
- `infra/terraform/modules/cloud-run/` — Placeholder for Cloud Run service definitions
- `infra/terraform/modules/firebase/` — Placeholder for Firebase project configuration
- `infra/terraform/modules/vertex-ai/` — Placeholder for Vertex AI resource configuration
- `infra/terraform/environments/dev/` — Dev environment entry point with module calls
- `infra/terraform/environments/dev/backend.tf` — GCS remote state configuration
- `infra/terraform/environments/dev/terraform.tfvars.example` — Template for required variables
- `infra/monitoring/dashboards/` — Cloud Monitoring dashboard definitions (future)
- `infra/monitoring/alerts/` — Cloud Monitoring alert policies (future)

### References
- [Source: architecture.md#Infrastructure & Deployment]
- [Source: architecture.md#Data Architecture — Primary store, Object storage]
- [Source: architecture.md#API & Communication Patterns — Service communication]
- [Source: architecture.md#Authentication & Security — Auditability]
- [Source: architecture.md#Infrastructure & Deployment — Event infrastructure]
- [Source: architecture.md#Complete Project Directory Structure — infra/ section]
- [Source: architecture.md#Verified Current Versions — Google Cloud SDK: latest]

## Dev Agent Record

### Agent Model Used
### Completion Notes List
### File List
