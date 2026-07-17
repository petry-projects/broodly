#!/usr/bin/env bash
# Test: scripts/apply-rulesets.sh codifies the required pr-quality ruleset
# parameters from the org github-settings standard.
#
# Guards against drift of the codified pr-quality pull_request parameters —
# in particular require_last_push_approval, which the compliance audit
# (ruleset-drift-pr-quality-require_last_push_approval) flags when it diverges
# from the standard's expected value of true.
#
# Runs the script in --dry-run --force mode with a stubbed `gh` CLI so no real
# GitHub API calls are made and the repo-identity safety check is skipped. The
# dry-run prints the ruleset payloads, which this test asserts against.
#
# Run: bash tests/scripts/apply-rulesets.test.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="${REPO_ROOT}/scripts/apply-rulesets.sh"

# Codified pr-quality pull_request parameters expected in the payload. Each
# entry is the exact "key": value pair the dry-run JSON must contain.
REQUIRED_PR_QUALITY_PARAMS=(
  '"require_last_push_approval": true'
  '"required_approving_review_count": 1'
  '"dismiss_stale_reviews_on_push": true'
  '"require_code_owner_review": true'
  '"required_review_thread_resolution": true'
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

if [[ ! -f "$SCRIPT" ]]; then
  echo "not ok - script not found at ${SCRIPT}"
  exit 1
fi

# Stub `gh` on PATH so the unconditional "fetch existing rulesets" call returns
# an empty list (no existing ruleset → dry-run prints CREATE payloads) without
# touching the network or requiring real credentials.
STUB_DIR="$(mktemp -d)"
trap 'rm -rf "$STUB_DIR"' EXIT
cat > "$STUB_DIR/gh" <<'STUB'
#!/usr/bin/env bash
# Only the GET of existing rulesets is reached in --dry-run mode. Any other
# `api` call (PUT/POST) drains stdin and succeeds so a broken pipe can't occur.
if [[ "$1" == "api" ]]; then
  for arg in "$@"; do
    if [[ "$arg" == "-X" ]]; then
      cat > /dev/null 2>&1 || true
      exit 0
    fi
  done
  echo "[]"
  exit 0
fi
exit 0
STUB
chmod +x "$STUB_DIR/gh"

# Dummy token satisfies the GH_TOKEN guard; --force skips the repo-identity
# check; --dry-run prevents any real mutation.
output="$(PATH="$STUB_DIR:$PATH" GH_TOKEN=dummy-token bash "$SCRIPT" --dry-run --force 2>&1)"
exit_code=$?

if [[ "$exit_code" -ne 0 ]]; then
  echo "not ok - script exited non-zero (${exit_code}) in --dry-run --force mode"
  echo "--- output ---"
  printf '%s\n' "$output"
  fail=1
fi

assert_contains '"name": "pr-quality"' "emits the pr-quality ruleset"
for param in "${REQUIRED_PR_QUALITY_PARAMS[@]}"; do
  assert_contains "$param" "codifies pr-quality param ${param}"
done

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
