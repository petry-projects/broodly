#!/usr/bin/env bash
# Test: .github/workflows/dependabot-automerge.yml keeps its locked contract.
#
# Why this exists: Fleet Monitor issues #469 and #472 flagged this workflow with
# a high failure rate. The failures were GitHub "startup failures" caused by the
# stub being truncated to its comment header on a sibling branch. Two generic
# guards (tests/scripts/workflow-integrity.test.sh and scripts/validate-workflows.sh)
# already reject a *structurally* broken workflow (missing on:/jobs:). They do
# NOT verify this file's *contract* — the exact invariants its own header marks
# "MUST NOT change":
#   - trigger must be `pull_request_target` (not `pull_request` or `push`)
#   - it must call the org reusable via `uses: petry-projects/.github/.github/
#     workflows/dependabot-automerge-reusable.yml@...`
#   - it must forward org secrets via `secrets: inherit`
#   - it must declare a job-level `permissions:` block (the reusable's gh API
#     calls fail without it)
# A drift in any of those would silently break auto-merge without tripping the
# structural guards. This test locks the contract for this one file.
#
# Run: bash tests/scripts/dependabot-automerge-contract.test.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STUB="${REPO_ROOT}/.github/workflows/dependabot-automerge.yml"

fail=0
pass_count=0

# check_contract <path>
# Returns non-zero and prints the first missing invariant when the file at
# <path> does not satisfy the locked dependabot-automerge contract.
check_contract() {
  local path="$1"

  [[ -f "$path" ]] || { echo "file not found: ${path}"; return 1; }

  # Trigger must be pull_request_target (as a top-level key under on:).
  grep -Eq "^[[:space:]]+pull_request_target[[:space:]]*:" "$path" \
    || { echo "missing 'pull_request_target' trigger"; return 1; }

  # Must call the org reusable dependabot-automerge workflow.
  grep -Eq "^[[:space:]]*uses:[[:space:]]*petry-projects/\.github/\.github/workflows/dependabot-automerge-reusable\.yml@" "$path" \
    || { echo "missing org reusable 'uses:' reference"; return 1; }

  # Must forward secrets to the reusable.
  grep -Eq "^[[:space:]]*secrets:[[:space:]]*inherit\b" "$path" \
    || { echo "missing 'secrets: inherit'"; return 1; }

  # Must declare a *job-level* permissions: block (the reusable is granted no
  # more than the calling job has). Require leading indentation so the top-level
  # `permissions: {}` at column 0 does not satisfy this on its own.
  grep -Eq "^[[:space:]]+permissions:" "$path" \
    || { echo "missing job-level 'permissions:' block"; return 1; }

  return 0
}

# --- Positive assertion: the real stub satisfies the contract. -----------------
if reason="$(check_contract "$STUB")"; then
  echo "ok - dependabot-automerge.yml satisfies its locked contract"
  pass_count=$((pass_count + 1))
else
  echo "not ok - dependabot-automerge.yml violates its contract: ${reason}"
  fail=1
fi

# --- Negative assertions: each invariant, removed/changed, is rejected. --------
# Proves the test does not pass trivially by mutating a valid copy of the stub.
_fixture_dir="$(mktemp -d)"
trap '[[ -n "${_fixture_dir:-}" ]] && rm -rf "$_fixture_dir"' EXIT

# 1) Trigger changed pull_request_target -> pull_request.
_f1="${_fixture_dir}/wrong-trigger.yml"
sed 's/pull_request_target/pull_request/' "$STUB" > "$_f1"
if ! check_contract "$_f1" >/dev/null 2>&1; then
  echo "ok - rejects a stub whose trigger is not pull_request_target"
  pass_count=$((pass_count + 1))
else
  echo "not ok - accepted a stub with the wrong trigger"
  fail=1
fi

# 2) secrets: inherit removed.
_f2="${_fixture_dir}/no-secrets.yml"
grep -v 'secrets:' "$STUB" > "$_f2"
if ! check_contract "$_f2" >/dev/null 2>&1; then
  echo "ok - rejects a stub with 'secrets: inherit' removed"
  pass_count=$((pass_count + 1))
else
  echo "not ok - accepted a stub without 'secrets: inherit'"
  fail=1
fi

# 3) Job-level permissions: block removed (only the top-level `permissions: {}`
#    at column 0 remains) — must still be rejected.
_f_perms="${_fixture_dir}/no-job-permissions.yml"
grep -Ev "^[[:space:]]+permissions:" "$STUB" > "$_f_perms"
if ! check_contract "$_f_perms" >/dev/null 2>&1; then
  echo "ok - rejects a stub with the job-level 'permissions:' block removed"
  pass_count=$((pass_count + 1))
else
  echo "not ok - accepted a stub without a job-level 'permissions:' block"
  fail=1
fi

# 4) Truncated to comments only (the exact corruption behind the failures).
_f4="${_fixture_dir}/truncated.yml"
grep -E '^#' "$STUB" > "$_f4"
if ! check_contract "$_f4" >/dev/null 2>&1; then
  echo "ok - rejects a stub truncated to its comment header"
  pass_count=$((pass_count + 1))
else
  echo "not ok - accepted a comment-only truncated stub"
  fail=1
fi

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
