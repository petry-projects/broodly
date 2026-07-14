#!/usr/bin/env bash
# Test: scripts/apply-repo-settings.sh enforces the required
# security_and_analysis settings from the push-protection standard.
#
# Runs the script in --dry-run --force mode so no real GitHub API calls are
# made and the repo-identity safety check is skipped. Asserts the dry-run
# output shows every required setting being set to "enabled".
#
# Run: bash tests/scripts/apply-repo-settings.test.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="${REPO_ROOT}/scripts/apply-repo-settings.sh"

REQUIRED_SA_SETTINGS=(
  secret_scanning
  secret_scanning_push_protection
  secret_scanning_ai_detection
  secret_scanning_non_provider_patterns
)

fail=0
pass_count=0

assert_contains() {
  local needle="$1" desc="$2"
  if printf '%s' "$output" | grep -q -- "$needle"; then
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

for setting in "${REQUIRED_SA_SETTINGS[@]}"; do
  assert_contains "$setting" "enforces ${setting}"
done

assert_contains "enabled" "sets security_and_analysis status to enabled"
assert_contains "vulnerability-alerts" "enforces vulnerability-alerts"
assert_contains "automated-security-fixes" "enforces automated-security-fixes"

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
