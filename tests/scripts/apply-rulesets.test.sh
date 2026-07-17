#!/usr/bin/env bash
# Test: scripts/apply-rulesets.sh codifies the required pr-quality ruleset
# review parameters from the standard ruleset.
#
# The compliance standard requires the pr-quality ruleset to enforce
# require_code_owner_review=true (among other review requirements). This guards
# the codified payload against silent drift in the repo. Live GitHub-state
# convergence is a separate operation that requires an admin token.
#
# Runs the script in --dry-run --force mode so no real GitHub API calls are
# made and the repo-identity safety check is skipped. Asserts the dry-run
# output codifies each required pr-quality review parameter.
#
# Run: bash tests/scripts/apply-rulesets.test.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="${REPO_ROOT}/scripts/apply-rulesets.sh"

# Required pr-quality review parameters (needle → description).
REQUIRED_PR_QUALITY_PARAMS=(
  '"require_code_owner_review": true|enforces require_code_owner_review=true'
  '"required_approving_review_count": 1|enforces required_approving_review_count=1'
  '"require_last_push_approval": true|enforces require_last_push_approval=true'
  '"dismiss_stale_reviews_on_push": true|enforces dismiss_stale_reviews_on_push=true'
  '"required_review_thread_resolution": true|enforces required_review_thread_resolution=true'
)

fail=0
pass_count=0

assert_contains() {
  local needle="$1" desc="$2"
  if printf '%s' "$output" | grep -qF -- "$needle"; then
    echo "ok - ${desc}"
    pass_count=$((pass_count + 1))
  else
    echo "not ok - ${desc} (output missing: ${needle})"
    fail=1
  fi
  return 0
}

if [[ ! -x "$SCRIPT" && ! -f "$SCRIPT" ]]; then
  echo "not ok - script not found at ${SCRIPT}"
  exit 1
fi

# Dummy token satisfies the GH_TOKEN guard; --force skips the repo-identity
# check; --dry-run prevents any real API call.
output="$(GH_TOKEN=dummy-token bash "$SCRIPT" --dry-run --force 2>&1)"
exit_code=$?

if [[ "$exit_code" -ne 0 ]]; then
  echo "not ok - script exited non-zero (${exit_code}) in --dry-run --force mode"
  echo "--- output ---"
  printf '%s\n' "$output"
  fail=1
fi

assert_contains '"name": "pr-quality"' "codifies the pr-quality ruleset"

for entry in "${REQUIRED_PR_QUALITY_PARAMS[@]}"; do
  needle="${entry%%|*}"
  desc="${entry##*|}"
  assert_contains "$needle" "$desc"
done

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
