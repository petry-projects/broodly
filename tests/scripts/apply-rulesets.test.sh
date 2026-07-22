#!/usr/bin/env bash
# Test: scripts/apply-rulesets.sh codifies the pr-quality and code-quality
# rulesets required by the org github-settings standard.
#
# Focus: the pr-quality `pull_request` rule must set
# dismiss_stale_reviews_on_push = true (compliance check
# ruleset-drift-pr-quality-dismiss_stale_reviews_on_push).
#
# Runs the script in --dry-run --force mode so no real GitHub API calls are
# made and the repo-identity safety check is skipped. Asserts the dry-run
# output contains the codified ruleset payloads.
#
# Run: bash tests/scripts/apply-rulesets.test.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="${REPO_ROOT}/scripts/apply-rulesets.sh"

fail=0
pass_count=0

assert_contains() {
  local needle="$1" desc="$2"
  if grep -qF -- "$needle" <<< "$output"; then
    echo "ok - ${desc}"
    pass_count=$((pass_count + 1))
  else
    echo "not ok - ${desc} (output missing: ${needle})"
    fail=1
  fi
  return 0
}

if [[ ! -f "$SCRIPT" ]]; then
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

# pr-quality ruleset is codified and named.
assert_contains '"name": "pr-quality"' "emits pr-quality ruleset"

# The compliance-critical parameter: stale reviews must be dismissed on push.
assert_contains '"dismiss_stale_reviews_on_push": true' \
  "pr-quality sets dismiss_stale_reviews_on_push = true"

# Remaining standard pr-quality pull_request parameters.
assert_contains '"required_approving_review_count": 1' \
  "pr-quality requires 1 approving review"
assert_contains '"require_code_owner_review": true' \
  "pr-quality requires code owner review"
assert_contains '"require_last_push_approval": true' \
  "pr-quality requires last push approval"
assert_contains '"required_review_thread_resolution": true' \
  "pr-quality requires review thread resolution"

# code-quality ruleset is also codified.
assert_contains '"name": "code-quality"' "emits code-quality ruleset"

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
