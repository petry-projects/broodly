# GCP Bootstrap — One-Time Setup

This runbook walks through the two manual steps required to bootstrap Broodly's GCP infrastructure. After these steps, everything else is automated via GitHub Actions.

## Overview

The bootstrap workflow (`bootstrap.yml`) creates all GCP resources automatically:
- Terraform state bucket (GCS)
- Artifact Registry (Docker images)
- Workload Identity Federation (keyless CI/CD auth)
- CI service account with scoped IAM roles
- All Terraform-managed resources (Cloud SQL, Firebase, Cloud Run, Pub/Sub, Storage)
- GitHub Actions secrets populated from Terraform outputs

**You only need to do two things manually:**

---

## Step 1: Create a GCP Service Account Key

This temporary key lets the bootstrap workflow authenticate to GCP. It is deleted after bootstrap completes.

### 1a. Create a GCP project (if you haven't already)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name it (e.g., `broodly-dev`) and note the **Project ID**
4. Ensure billing is enabled: **Billing** → **Link a billing account**

### 1b. Create the bootstrap service account

1. Go to **IAM & Admin** → **[Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)**
2. Click **+ Create Service Account**
   - **Name:** `bootstrap` (or any name — this is temporary)
   - **ID:** `bootstrap`
3. Click **Create and Continue**
4. Under **Grant this service account access to project**, add the role:
   - **Basic** → **Owner**
   > This broad role is needed because bootstrap creates IAM bindings, enables APIs, and provisions multiple resource types. It is deleted after bootstrap.
5. Click **Done**

### 1c. Create and download a JSON key

1. Click on the `bootstrap` service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** → **Create**
5. A `.json` file downloads — keep it safe, you'll need it in Step 2

---

## Step 2: Add the Key as a GitHub Secret

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. **Name:** `GCP_SA_KEY`
4. **Value:** Paste the **entire contents** of the downloaded JSON key file
   > Open the `.json` file in a text editor, select all, copy, and paste.
5. Click **Add secret**

---

## Step 3: Run the Bootstrap Workflow

1. Go to your GitHub repo → **Actions** → **Bootstrap GCP Infrastructure**
2. Click **Run workflow**
3. Fill in:
   - **GCP project ID:** Your project ID from Step 1a (e.g., `broodly-dev`)
   - **GCP region:** `us-central1` (default, or your preferred region)
4. Click **Run workflow**

The workflow takes ~10-15 minutes and will:
- Enable all required GCP APIs
- Create the Terraform state bucket with versioning
- Create the Artifact Registry for Docker images
- Set up Workload Identity Federation (keyless auth for future CI/CD)
- Create and configure the CI service account
- Run `terraform apply` to create all infrastructure
- Populate all GitHub Actions secrets from Terraform outputs

### Monitor progress

Watch the workflow run in the **Actions** tab. Each step logs what it creates. On success, you'll see a summary of all resources and secrets.

---

## Step 4: Clean Up the Bootstrap Key

After the workflow succeeds, the temporary service account key is no longer needed — all future CI/CD uses Workload Identity Federation (keyless).

1. **Delete the GitHub secret:**
   - Repo → **Settings** → **Secrets** → `GCP_SA_KEY` → **Delete**

2. **Delete the GCP service account:**
   - GCP Console → **IAM & Admin** → **Service Accounts**
   - Find `bootstrap@<project-id>.iam.gserviceaccount.com`
   - Click **⋮** → **Delete**

3. **Delete the downloaded JSON file** from your computer

> **Why delete?** The bootstrap SA has Owner permissions. Leaving the key around is a security risk. WIF is the long-term auth mechanism — it generates short-lived tokens scoped to each workflow run.

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

| Secret | Source |
|--------|--------|
| `GCP_PROJECT_ID` | Workflow input |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Created WIF provider |
| `GCP_SERVICE_ACCOUNT` | Created CI service account |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Terraform output |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Terraform output |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Terraform output |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Terraform output |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Terraform output |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Terraform output |
| `EXPO_PUBLIC_API_URL` | Cloud Run service URL |

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

The bootstrap service account needs Owner role. Verify:
```bash
gcloud projects get-iam-policy <PROJECT_ID> \
  --flatten="bindings[].members" \
  --filter="bindings.members:bootstrap@<PROJECT_ID>.iam.gserviceaccount.com"
```

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

The workflow is idempotent — it checks for existing resources before creating them. Safe to re-run if something failed partway through.
