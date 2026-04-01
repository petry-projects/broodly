# GCP Bootstrap — One-Time Setup

This runbook covers the preparation steps and the automated bootstrap workflow that provisions all GCP infrastructure.

## Overview

The bootstrap workflow (`bootstrap.yml`) creates all GCP resources automatically:
- Terraform state bucket (GCS)
- Artifact Registry (Docker images)
- Workload Identity Federation (keyless CI/CD auth)
- CI service account with scoped IAM roles
- All Terraform-managed resources (Cloud SQL, Firebase, Cloud Run, Pub/Sub, Storage)
- GitHub Actions secrets populated from Terraform outputs

**Two preparation steps** are required before running the workflow. After the workflow completes, a cleanup step removes the temporary credentials.

**Prerequisites:** A GCP service account key stored as GitHub secret `GCP_SERVICE_ACCOUNT`. If you already have this, skip to [Run the Bootstrap Workflow](#run-the-bootstrap-workflow).

---

## Preparation Step 1: Create a GCP Service Account Key (if not already done)

This service account key lets the bootstrap workflow authenticate to GCP. After bootstrap, it is automatically replaced with a Workload Identity Federation service account email — the JSON key is no longer used.

### 1. Create a GCP project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name it (e.g., `broodly-dev`) and note the **Project ID**
4. Ensure billing is enabled: **Billing** → **Link a billing account**

### 2. Create the bootstrap service account

1. Go to **IAM & Admin** → **[Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)**
2. Click **+ Create Service Account**
   - **Name:** `bootstrap`
   - **ID:** `bootstrap`
3. Click **Create and Continue**
4. Under **Grant this service account access to project**, add the role:
   - **Basic** → **Owner**
   > Owner is needed because bootstrap creates IAM bindings, enables APIs, and provisions multiple resource types.
5. Click **Done**

### 3. Create and download a JSON key

1. Click on the `bootstrap` service account
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** → **Create**
5. A `.json` file downloads

### Preparation Step 2: Add the key as a GitHub secret

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. **Name:** `GCP_SERVICE_ACCOUNT`
4. **Value:** Paste the **entire contents** of the downloaded JSON key file
5. Click **Add secret**

---

## Run the Bootstrap Workflow

1. Go to your GitHub repo → **Actions** → **Bootstrap GCP Infrastructure**
2. Click **Run workflow**
3. Fill in:
   - **GCP project ID:** Your project ID (e.g., `broodly-dev`)
   - **GCP region:** `us-central1` (default)
4. Click **Run workflow**

The workflow takes ~10-15 minutes and will:
- Enable all required GCP APIs
- Create the Terraform state bucket with versioning
- Create the Artifact Registry for Docker images
- Set up Workload Identity Federation (keyless auth for all future CI/CD)
- Create and configure the CI service account with scoped roles
- Run `terraform apply` to create all infrastructure
- Populate all GitHub Actions secrets from Terraform outputs
- **Overwrite `GCP_SERVICE_ACCOUNT`** with the WIF service account email (replacing the JSON key)

### Monitor progress

Watch the workflow run in the **Actions** tab. Each step logs what it creates. On success, you'll see a summary of all resources and secrets.

---

## Post-Bootstrap Cleanup

After the workflow succeeds, the bootstrap service account is no longer needed — `GCP_SERVICE_ACCOUNT` now contains the WIF service account email, and all CI/CD uses Workload Identity Federation.

1. **Delete the bootstrap service account in GCP:**
   - GCP Console → **IAM & Admin** → **Service Accounts**
   - Find `bootstrap@<project-id>.iam.gserviceaccount.com`
   - Click **⋮** → **Delete**

2. **Delete the downloaded JSON file** from your computer

> **Why delete?** The bootstrap SA has Owner permissions. Leaving it around is a security risk. WIF generates short-lived tokens scoped to each workflow run.

---

## What Gets Created

### GCP Resources

| Resource | Name | Purpose |
|----------|------|---------|
| GCS Bucket | `broodly-terraform-state` | Terraform remote state (versioned) |
| Artifact Registry | `broodly` | Docker container images |
| WIF Pool | `github-actions` | OIDC identity pool for GitHub |
| WIF Provider | `github` | Maps GitHub OIDC tokens to GCP |
| Service Account | `github-actions-ci` | CI/CD identity with scoped roles |
| Cloud SQL | `broodly-db-dev` | PostgreSQL 16 database |
| Cloud Run | `broodly-api-dev` | API server (scale-to-zero) |
| Firebase | `Broodly Web (dev)` | Auth, web app config |
| Pub/Sub | Topics + subscriptions | Async event processing |
| Cloud Storage | `broodly-media-dev` | Media uploads |
| Secret Manager | 3 secrets | DB password, connection string, Firebase SA |

### GitHub Secrets (auto-populated)

| Secret | Source | Notes |
|--------|--------|-------|
| `GCP_PROJECT_ID` | Workflow input | |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Created WIF provider | |
| `GCP_SERVICE_ACCOUNT` | Created CI service account | Overwrites the JSON key with WIF SA email |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Terraform output | |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Terraform output | |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Terraform output | |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Terraform output | |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Terraform output | |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Terraform output | |
| `EXPO_PUBLIC_API_URL` | Cloud Run service URL | |

---

## After Bootstrap: What's Automated

Once bootstrap completes, these workflows run automatically:

| Trigger | Workflow | What it does |
|---------|----------|-------------|
| PR to `main` with `infra/terraform/**` changes | `terraform.yml` | Runs `terraform plan`, comments on PR |
| Merge to `main` with `infra/terraform/**` changes | `terraform.yml` | Runs `terraform apply` |
| Merge to `main` | `ci.yml` → `deploy-api` | Builds API image, deploys to Cloud Run |
| Merge to `main` | `ci.yml` → `mobile-build` | Exports Expo web build with real Firebase config |

---

## Troubleshooting

### "Permission denied" during bootstrap

The service account in `GCP_SERVICE_ACCOUNT` needs Owner role. Verify in GCP Console → **IAM & Admin** → **IAM** that the service account has the Owner role.

### "Billing account not linked"

Some APIs (Cloud SQL, Cloud Run) require billing. Go to GCP Console → **Billing** and link a billing account to your project.

### Bootstrap succeeded but secrets are empty

Check the Terraform outputs:
```bash
cd infra/terraform/environments/dev
terraform output
```

If Firebase outputs are empty, the Firebase web app may not have been created yet. Re-run the bootstrap workflow.

### Re-running bootstrap

The workflow is idempotent — it checks for existing resources before creating them. Safe to re-run if something failed partway through. Note that `GCP_SERVICE_ACCOUNT` is overwritten on each run (JSON key → WIF email), so the workflow only works with the JSON key on the first run. Subsequent runs use WIF.
