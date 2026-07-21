#!/usr/bin/env bash
# Test: scripts/apply-rulesets.sh codifies the pr-quality ruleset standard,
# in particular require_last_push_approval: true.
#
# This guards against codified drift of the pr-quality review parameters that
# are audited by the org compliance workflow
# (ruleset-drift-pr-quality-require_last_push_approval). The codified payload in
# apply-rulesets.sh is this repo's mirror of the org source of truth
# (standards/rulesets/pr-quality.json); this test locks the expected values so
# the mirror cannot silently regress to `false`.
#
# Runs the script in --dry-run --force mode with a stubbed `gh` so no real
# GitHub API calls are made and the repo-identity safety check is skipped.
# Asserts the dry-run output shows every required pr-quality review parameter.
#
# Run: bash tests/scripts/apply-rulesets.test.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="${REPO_ROOT}/scripts/apply-rulesets.sh"

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

if [[ ! -f "$SCRIPT" ]]; then
  echo "not ok - script not found at ${SCRIPT}"
  exit 1
fi

# Stub `gh` on PATH: apply-rulesets.sh fetches existing rulesets via `gh api`
# before the dry-run branch, so it must run offline. Return an empty ruleset
# list and drain any piped stdin. Record calls so we can assert no mutation.
BIN_DIR="$(mktemp -d)" || { echo "not ok - failed to create temporary directory"; exit 1; }
CALL_LOG="${BIN_DIR}/gh-calls.log"
trap 'rm -rf "$BIN_DIR"' EXIT

cat > "${BIN_DIR}/gh" <<MOCK
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "${CALL_LOG}"
if [ "\$1" = "repo" ] && [ "\$2" = "view" ]; then
  echo "petry-projects/broodly"
  exit 0
fi
if [ "\$1" = "api" ]; then
  # Drain stdin for any --input - call so the pipe does not break.
  [ ! -t 0 ] && cat > /dev/null 2>&1 || true
  # The existing-rulesets fetch expects a JSON array.
  echo "[]"
  exit 0
fi
exit 0
MOCK
chmod +x "${BIN_DIR}/gh"

export PATH="${BIN_DIR}:${PATH}"

# Dummy token satisfies the GH_TOKEN guard; --force skips the repo-identity
# check; --dry-run prevents any real mutating API call.
output="$(GH_TOKEN=dummy-token bash "$SCRIPT" --dry-run --force 2>&1)"
exit_code=$?

if [[ "$exit_code" -ne 0 ]]; then
  echo "not ok - script exited non-zero (${exit_code}) in --dry-run --force mode"
  echo "--- output ---"
  printf '%s\n' "$output"
  fail=1
fi

# The compliance finding this test guards: pr-quality must require last-push approval.
assert_contains '"require_last_push_approval": true' "pr-quality codifies require_last_push_approval: true"

# The rest of the required pr-quality pull_request review parameters.
assert_contains '"required_approving_review_count": 1' "pr-quality codifies required_approving_review_count: 1"
assert_contains '"dismiss_stale_reviews_on_push": true' "pr-quality codifies dismiss_stale_reviews_on_push: true"
assert_contains '"require_code_owner_review": true' "pr-quality codifies require_code_owner_review: true"
assert_contains '"required_review_thread_resolution": true' "pr-quality codifies required_review_thread_resolution: true"

# Dry-run must never mutate: no POST/PUT ruleset write.
if grep -qE 'api -X (POST|PUT)' "$CALL_LOG" 2>/dev/null; then
  echo "not ok - dry-run made a mutating API call (POST/PUT)"
  fail=1
else
  echo "ok - dry-run made no mutating API call"
  pass_count=$((pass_count + 1))
fi

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
