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

set -euo pipefail

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
    echo "not ok - ${desc} (expected: ${expected}, got: ${actual})"
    fail=1
  fi
  return 0
}

if [[ ! -f "$SCRIPT" ]]; then
  echo "not ok - script not found at ${SCRIPT}"
  exit 1
fi

# Dummy token satisfies the GH_TOKEN guard; --force skips the repo-identity
# check; --dry-run prevents any real API call. A mock gh is placed first on
# PATH and fails on any `gh api` subcommand so a dry-run regression cannot
# silently make a live API call.
_mock_bin="$(mktemp -d)"
trap 'rm -rf "$_mock_bin"' EXIT
cat > "${_mock_bin}/gh" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == "api" ]]; then
  echo "unexpected gh api invocation" >&2
  exit 1
fi
exit 0
EOF
chmod +x "${_mock_bin}/gh"

output="$(PATH="${_mock_bin}:${PATH}" GH_TOKEN=dummy-token bash "$SCRIPT" --dry-run --force 2>&1)"
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
# Assert specifically within the pr-quality ruleset's pull_request rule so the
# check cannot be satisfied by the setting appearing in the wrong ruleset.
_pr_q_json=$(printf '%s\n' "$output" | grep -v '^\[' | jq -s 'map(select(.name == "pr-quality")) | first // empty')
_dismiss=$(printf '%s\n' "$_pr_q_json" | jq -r '
  .rules[]
  | select(.type == "pull_request")
  | (.parameters.dismiss_stale_reviews_on_push // false)
  | (type == "boolean" and . == true)
')
if [[ "$_dismiss" = "true" ]]; then
  echo "ok - pr-quality pull_request rule sets dismiss_stale_reviews_on_push = true"
  pass_count=$((pass_count + 1))
else
  echo "not ok - pr-quality pull_request rule: dismiss_stale_reviews_on_push not true (got: ${_dismiss:-missing})"
  fail=1
fi

# Remaining standard pr-quality pull_request parameters — checked within the
# pr-quality ruleset object so a matching field in any other ruleset cannot
# produce a false pass.
_pr_q_params=$(printf '%s\n' "$_pr_q_json" | jq -c '.rules[] | select(.type == "pull_request") | .parameters')

_jq_check() {
  local expr="$1" expected="$2" desc="$3"
  local actual
  actual=$(printf '%s\n' "$_pr_q_params" | jq -r "$expr // empty")
  if [[ "$actual" = "$expected" ]]; then
    echo "ok - ${desc}"
    pass_count=$((pass_count + 1))
  else
    echo "not ok - ${desc} (expected: ${expected}, got: ${actual:-missing})"
    fail=1
  fi
  return 0
}

_jq_check '.required_approving_review_count' '1' 'pr-quality requires 1 approving review'
_jq_check '.require_code_owner_review' 'true' 'pr-quality requires code owner review'
_jq_check '.require_last_push_approval' 'true' 'pr-quality requires last push approval'
_jq_check '.required_review_thread_resolution' 'true' 'pr-quality requires review thread resolution'

# code-quality ruleset is also codified.
assert_contains '"name": "code-quality"' "emits code-quality ruleset"

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
