#!/usr/bin/env bash
# Test: scripts/apply-rulesets.sh codifies the pr-quality ruleset with
# dismiss_stale_reviews_on_push = true, per the petry-projects standard
# (standards/github-settings.md#pr-quality--standard-ruleset-all-repositories).
#
# This guards against the drift reported in issue #408, where the live
# pr-quality ruleset had dismiss_stale_reviews_on_push = false while the
# standard (and the codified payload in apply-rulesets.sh) require true.
#
# Runs the script in --dry-run --force mode so no real GitHub API calls are
# made and the repo-identity safety check is skipped. `gh` is stubbed so the
# existing-rulesets fetch returns an empty array; `jq` is used for real to
# pretty-print the payload exactly as the script would.
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

assert_not_contains() {
  local needle="$1" desc="$2"
  if printf '%s' "$output" | grep -qF -- "$needle"; then
    echo "not ok - ${desc} (output unexpectedly contains: ${needle})"
    fail=1
  else
    echo "ok - ${desc}"
    pass_count=$((pass_count + 1))
  fi
  return 0
}

if [[ ! -f "$SCRIPT" ]]; then
  echo "not ok - script not found at ${SCRIPT}"
  exit 1
fi

# Stub `gh` on PATH: satisfy the (skipped-by-force) identity check and return
# an empty ruleset list for the existing-rulesets fetch so the dry-run reports
# a CREATE and pretty-prints the codified payload.
BIN_DIR="$(mktemp -d)"
trap 'rm -rf "$BIN_DIR"' EXIT
cat > "$BIN_DIR/gh" <<'MOCK'
#!/usr/bin/env bash
if [ "$1" = "repo" ] && [ "$2" = "view" ]; then
  echo "petry-projects/broodly"
  exit 0
fi
if [ "$1" = "api" ]; then
  # GET of the rulesets collection (no -X flag) → empty array.
  case "$*" in
    *"-X"*) cat > /dev/null 2>&1 || true ;;
    *rulesets) echo "[]" ;;
    *) cat > /dev/null 2>&1 || true ;;
  esac
  exit 0
fi
exit 0
MOCK
chmod +x "$BIN_DIR/gh"

# Dummy token satisfies the GH_TOKEN guard; --force skips the repo-identity
# check; --dry-run prevents any real API call.
output="$(PATH="$BIN_DIR:$PATH" GH_TOKEN=dummy-token bash "$SCRIPT" --dry-run --force 2>&1)"
exit_code=$?

if [[ "$exit_code" -ne 0 ]]; then
  echo "not ok - script exited non-zero (${exit_code}) in --dry-run --force mode"
  echo "--- output ---"
  printf '%s\n' "$output"
  fail=1
fi

assert_contains '"name": "pr-quality"' "codifies the pr-quality ruleset"
assert_contains '"dismiss_stale_reviews_on_push": true' \
  "pr-quality sets dismiss_stale_reviews_on_push to true (issue #408)"
assert_not_contains '"dismiss_stale_reviews_on_push": false' \
  "pr-quality never sets dismiss_stale_reviews_on_push to false"

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
