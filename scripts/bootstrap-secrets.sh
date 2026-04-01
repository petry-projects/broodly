#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# bootstrap-secrets.sh — Populate GitHub Actions secrets from Terraform outputs
# -----------------------------------------------------------------------------
# Reads Firebase and infrastructure outputs from Terraform and sets them as
# GitHub Actions secrets so CI/CD can build and deploy with real credentials.
#
# Prerequisites:
#   - terraform CLI (initialized in the target environment)
#   - gh CLI (authenticated with repo admin access)
#
# Usage:
#   ./scripts/bootstrap-secrets.sh              # Set secrets
#   ./scripts/bootstrap-secrets.sh --dry-run    # Preview without setting
#   ./scripts/bootstrap-secrets.sh --env prod   # Target a different environment
# -----------------------------------------------------------------------------
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-petry-projects/broodly}"
ENVIRONMENT="dev"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --env) ENVIRONMENT="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel)"
TF_DIR="${REPO_ROOT}/infra/terraform/environments/${ENVIRONMENT}"

if [ ! -d "${TF_DIR}/.terraform" ]; then
  echo "ERROR: Terraform not initialized in ${TF_DIR}"
  echo "Run: cd ${TF_DIR} && terraform init"
  exit 1
fi

# Map Terraform output names to GitHub Actions secret names
declare -A SECRET_MAP=(
  ["firebase_api_key"]="EXPO_PUBLIC_FIREBASE_API_KEY"
  ["firebase_auth_domain"]="EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
  ["firebase_project_id"]="EXPO_PUBLIC_FIREBASE_PROJECT_ID"
  ["firebase_storage_bucket"]="EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
  ["firebase_messaging_sender_id"]="EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  ["firebase_app_id"]="EXPO_PUBLIC_FIREBASE_APP_ID"
  ["cloud_run_url"]="EXPO_PUBLIC_API_URL"
)

echo "Setting GitHub secrets for ${REPO} from ${ENVIRONMENT} Terraform outputs..."
echo ""

errors=0
set_count=0

for tf_output in "${!SECRET_MAP[@]}"; do
  secret_name="${SECRET_MAP[$tf_output]}"

  value=$(cd "${TF_DIR}" && terraform output -raw "${tf_output}" 2>/dev/null) || value=""

  if [ -z "${value}" ]; then
    echo "  SKIP  ${secret_name} — terraform output '${tf_output}' is empty"
    continue
  fi

  if [ "${DRY_RUN}" = true ]; then
    echo "  [dry-run] Would set ${secret_name}"
  else
    if echo "${value}" | gh secret set "${secret_name}" --repo "${REPO}" 2>/dev/null; then
      echo "  SET   ${secret_name}"
      set_count=$((set_count + 1))
    else
      echo "  ERROR ${secret_name} — failed to set secret"
      errors=$((errors + 1))
    fi
  fi
done

echo ""
if [ "${DRY_RUN}" = true ]; then
  echo "Dry run complete. No secrets were modified."
else
  echo "Done. ${set_count} secret(s) set, ${errors} error(s)."
fi

if [ "${errors}" -gt 0 ]; then
  exit 1
fi

echo ""
echo "Note: The following secrets must be set manually (not from Terraform):"
echo "  GCP_PROJECT_ID                — Your GCP project ID"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER — WIF provider resource name"
echo "  GCP_SERVICE_ACCOUNT           — CI/CD service account email"
