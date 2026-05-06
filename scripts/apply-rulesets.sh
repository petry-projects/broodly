#!/usr/bin/env bash
# apply-rulesets.sh — Apply standard repository rulesets to petry-projects/broodly
#
# Applies the rulesets defined in:
#   https://github.com/petry-projects/.github/blob/main/standards/github-settings.md#repository-rulesets
#
# Rulesets managed:
#   pr-quality    — pull request review requirements and merge policy
#   code-quality  — required status checks (CI, SonarCloud, CodeQL, agent-shield, dependency-audit)
#
# NOTE: claude-code / claude is intentionally NOT a required check.
# claude-code-action's GitHub App refuses to mint a token for any PR that
# touches workflow files, which would deadlock every workflow-modifying PR.
# The check still runs on normal PRs for review feedback but is not a merge gate.
# See: https://github.com/petry-projects/.github/blob/main/standards/ci-standards.md#centralization-tiers
#
# Usage:
#   GH_TOKEN=<admin-token> ./scripts/apply-rulesets.sh [--dry-run]
#
# Requirements:
#   - GH_TOKEN must have administration:write scope on this repo
#   - gh CLI must be installed
#   - jq must be installed

set -euo pipefail

ORG="petry-projects"
REPO="broodly"
DRY_RUN=false

info()  { echo "[INFO]  $*"; }
ok()    { echo "[OK]    $*"; }
err()   { echo "[ERROR] $*" >&2; }
skip()  { echo "[SKIP]  $*"; }

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    -h|--help)
      echo "Usage: $0 [--dry-run]"
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

# ---------------------------------------------------------------------------
# pr-quality ruleset
# ---------------------------------------------------------------------------
PR_QUALITY_PAYLOAD=$(cat <<'PAYLOAD'
{
  "name": "pr-quality",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true,
        "required_review_thread_resolution": true
      }
    },
    { "type": "required_linear_history" },
    { "type": "non_fast_forward" },
    { "type": "deletion" }
  ],
  "bypass_actors": [
    {
      "actor_id": 0,
      "actor_type": "OrganizationAdmin",
      "bypass_mode": "always"
    },
    {
      "actor_id": 3167543,
      "actor_type": "Integration",
      "bypass_mode": "pull_request"
    }
  ]
}
PAYLOAD
)

# ---------------------------------------------------------------------------
# code-quality ruleset
#
# Required checks for this repo (derived by apply-rulesets.sh logic in
# petry-projects/.github):
#   - SonarCloud               (sonarcloud.yml present)
#   - CodeQL                   (GitHub-managed default setup configured)
#   - agent-shield / AgentShield        (agent-shield.yml present)
#   - dependency-audit / Detect ecosystems (dependency-audit.yml present)
#   - CI / TypeScript          (ci.yml present; first job = TypeScript)
#   - CI / Go                  (ci.yml present; go job)
# ---------------------------------------------------------------------------
CODE_QUALITY_PAYLOAD=$(cat <<'PAYLOAD'
{
  "name": "code-quality",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {"context": "SonarCloud"},
          {"context": "CodeQL"},
          {"context": "agent-shield / AgentShield"},
          {"context": "dependency-audit / Detect ecosystems"},
          {"context": "CI / TypeScript"},
          {"context": "CI / Go"}
        ]
      }
    }
  ],
  "bypass_actors": []
}
PAYLOAD
)

# ---------------------------------------------------------------------------
# Apply
# ---------------------------------------------------------------------------
info "Fetching existing rulesets for $ORG/$REPO ..."
gh_err_file=$(mktemp)
if ! existing=$(gh api "repos/$ORG/$REPO/rulesets" 2>"$gh_err_file"); then
  gh_err=$(cat "$gh_err_file")
  rm -f "$gh_err_file"
  err "Failed to fetch existing rulesets for $ORG/$REPO"
  if [ -n "$gh_err" ]; then
    err "$gh_err"
  fi
  exit 1
fi
rm -f "$gh_err_file"

apply_ruleset() {
  local name="$1"
  local payload="$2"
  local existing_id
  existing_id=$(echo "$existing" | jq -r --arg n "$name" '.[] | select(.name == $n) | .id' 2>/dev/null || echo "")

  if [ "$DRY_RUN" = true ]; then
    if [ -n "$existing_id" ]; then
      skip "DRY_RUN — would UPDATE $name ruleset (id=$existing_id)"
    else
      skip "DRY_RUN — would CREATE $name ruleset"
    fi
    echo "$payload" | jq '.'
    return 0
  fi

  if [ -n "$existing_id" ]; then
    info "Updating existing $name ruleset (id=$existing_id) ..."
    echo "$payload" | gh api -X PUT "repos/$ORG/$REPO/rulesets/$existing_id" --input - > /dev/null
    ok "$name ruleset updated"
  else
    info "Creating $name ruleset ..."
    echo "$payload" | gh api -X POST "repos/$ORG/$REPO/rulesets" --input - > /dev/null
    ok "$name ruleset created"
  fi
}

apply_ruleset "pr-quality"   "$PR_QUALITY_PAYLOAD"
apply_ruleset "code-quality" "$CODE_QUALITY_PAYLOAD"

ok "Done — rulesets applied to $ORG/$REPO"
