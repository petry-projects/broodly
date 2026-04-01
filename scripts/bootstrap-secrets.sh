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

REPO=""
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

# Derive repo from git remote if not specified
if [ -z "${REPO}" ]; then
  REPO="${GITHUB_REPOSITORY:-}"
  if [ -z "${REPO}" ]; then
    REMOTE_URL=$(git -C "${REPO_ROOT}" remote get-url origin 2>/dev/null) || REMOTE_URL=""
    # Extract owner/repo from SSH or HTTPS URL
    REPO=$(echo "${REMOTE_URL}" | sed -E 's#.*[:/]([^/]+/[^/]+?)(\.git)?$#\1#')
    if [ -z "${REPO}" ]; then
      echo "ERROR: Could not determine repository. Use --repo owner/repo"
      exit 1
    fi
  fi
fi

if [ ! -d "${TF_DIR}/.terraform" ]; then
  echo "ERROR: Terraform not initialized in ${TF_DIR}"
  echo "Run: cd ${TF_DIR} && terraform init"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "ERROR: GitHub CLI not authenticated"
  echo "Run: gh auth login"
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

  # Capture both stdout and stderr to distinguish missing outputs from real errors
  tf_stderr=""
  if value=$(cd "${TF_DIR}" && terraform output -raw "${tf_output}" 2>/tmp/tf_stderr.$$.txt); then
    tf_stderr=$(cat /tmp/tf_stderr.$$.txt 2>/dev/null) || true
  else
    tf_stderr=$(cat /tmp/tf_stderr.$$.txt 2>/dev/null) || true
    # Distinguish "output not found" from real failures
    if echo "${tf_stderr}" | grep -qiE "not found|no outputs"; then
      value=""
    else
      echo "  ERROR ${secret_name} — terraform output failed: ${tf_stderr}"
      errors=$((errors + 1))
      continue
    fi
  fi
  rm -f /tmp/tf_stderr.$$.txt

  if [ -z "${value}" ]; then
    echo "  SKIP  ${secret_name} — terraform output '${tf_output}' is empty"
    continue
  fi

  if [ "${DRY_RUN}" = true ]; then
    echo "  [dry-run] Would set ${secret_name}"
  else
    if gh secret set "${secret_name}" --repo "${REPO}" --body "${value}" 2>/dev/null; then
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
