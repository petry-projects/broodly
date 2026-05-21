#!/usr/bin/env bash
# apply-repo-settings.sh — Apply standard repository settings to petry-projects/broodly
#
# Applies settings defined in:
#   https://github.com/petry-projects/.github/blob/main/standards/github-settings.md
#
# Settings managed:
#   check-suite auto-trigger — disables auto-trigger for apps that create
#     permanently-queued check suites, which block GitHub auto-merge
#
# App IDs with auto-trigger disabled:
#   347564  CodeRabbit — creates queued check suites that never complete
#
# Usage:
#   GH_TOKEN=<admin-token> ./scripts/apply-repo-settings.sh [--dry-run] [--force]
#
# Requirements:
#   - GH_TOKEN must have administration:write scope on this repo
#   - gh CLI must be installed
#   - jq must be installed

set -euo pipefail

ORG="petry-projects"
REPO="broodly"
DRY_RUN=false
FORCE=false

info()  { echo "[INFO]  $*"; }
ok()    { echo "[OK]    $*"; }
err()   { echo "[ERROR] $*" >&2; }
skip()  { echo "[SKIP]  $*"; }

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --force)   FORCE=true ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--force]"
      echo "  --force  Skip repo-identity safety check (use when running from a fork or CI)"
      exit 0
      ;;
    *) err "Unknown flag: $arg"; exit 1 ;;
  esac
done

if [ -z "${GH_TOKEN:-}" ]; then
  err "GH_TOKEN is required — provide a token with administration:write scope"
  exit 1
fi

export GH_TOKEN

# Safety guard: verify the current git remote matches ORG/REPO.
if [ "$FORCE" = false ]; then
  actual_repo=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || true)
  if [ -z "$actual_repo" ]; then
    err "Unable to determine current repo (gh repo view failed)."
    err "Run with --force to skip this safety check, or ensure GH_TOKEN has repo read access."
    exit 1
  fi
  if [ "$actual_repo" != "$ORG/$REPO" ]; then
    err "Current repo ($actual_repo) does not match target ($ORG/$REPO)."
    err "Run with --force to override this safety check."
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# check-suite auto-trigger preferences
#
# CodeRabbit (347564) creates check suites in "queued" state that never reach
# a terminal state. GitHub auto-merge waits for all check suites to complete,
# so these orphaned suites permanently block automatic merges.
# Setting auto_trigger_checks=false prevents the app from pre-creating check
# suites on push while still allowing it to run checks when it has real work.
# ---------------------------------------------------------------------------
CHECK_SUITE_PREFS_PAYLOAD=$(cat <<'PAYLOAD'
{
  "auto_trigger_checks": [
    {"app_id": 347564, "setting": false}
  ]
}
PAYLOAD
)

if [ "$DRY_RUN" = true ]; then
  skip "DRY_RUN — would PATCH check-suite preferences for $ORG/$REPO"
  echo "$CHECK_SUITE_PREFS_PAYLOAD" | jq '.'
else
  info "Patching check-suite auto-trigger preferences for $ORG/$REPO ..."
  echo "$CHECK_SUITE_PREFS_PAYLOAD" | gh api -X PATCH "repos/$ORG/$REPO/check-suites/preferences" --input - > /dev/null
  ok "check-suite auto-trigger preferences updated"
fi

ok "Done — repository settings applied to $ORG/$REPO"
