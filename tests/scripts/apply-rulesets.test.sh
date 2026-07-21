#!/usr/bin/env bash
# Test: scripts/apply-rulesets.sh codifies the required pr-quality ruleset
# parameters from the petry-projects github-settings standard.
#
# The compliance audit flags drift when the live pr-quality ruleset parameter
# require_code_owner_review is not true. This test guards the *codified* source
# of that parameter so the convergence script itself can never silently drift
# from the standard (its sibling apply-repo-settings.sh already has a guard;
# apply-rulesets.sh did not).
#
# A stub `gh` on PATH lets the script run in --dry-run --force mode with no
# network access or real credentials: the rulesets fetch returns an empty list
# and no PUT/POST is ever made. The dry-run pretty-prints the payloads it would
# apply, which is what we assert against.
#
# Run: bash tests/scripts/apply-rulesets.test.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="${REPO_ROOT}/scripts/apply-rulesets.sh"

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

if [[ ! -f "$SCRIPT" ]]; then
  echo "not ok - script not found at ${SCRIPT}"
  exit 1
fi

# Stub `gh`: return an empty ruleset list for the GET fetch (so the script
# treats every ruleset as new), and succeed silently on any PUT/POST without a
# network call. `--force` skips the repo-identity check so `gh repo view` is
# never invoked, but it is handled defensively anyway.
BIN_DIR="$(mktemp -d)"
trap 'rm -rf "$BIN_DIR"' EXIT
cat > "${BIN_DIR}/gh" <<'MOCK'
#!/usr/bin/env bash
if [ "$1" = "api" ]; then
  case "$*" in
    *"-X PUT"*|*"-X POST"*) cat >/dev/null 2>&1 || true; exit 0 ;;
    *rulesets*) echo "[]"; exit 0 ;;
  esac
  cat >/dev/null 2>&1 || true
  exit 0
fi
if [ "$1" = "repo" ] && [ "$2" = "view" ]; then
  echo "petry-projects/broodly"
  exit 0
fi
exit 0
MOCK
chmod +x "${BIN_DIR}/gh"

# Dummy token satisfies the GH_TOKEN guard; --force skips the repo-identity
# check; --dry-run prevents any real mutation.
output="$(PATH="${BIN_DIR}:${PATH}" GH_TOKEN=dummy-token bash "$SCRIPT" --dry-run --force 2>&1)"
exit_code=$?

if [[ "$exit_code" -ne 0 ]]; then
  echo "not ok - script exited non-zero (${exit_code}) in --dry-run --force mode"
  echo "--- output ---"
  printf '%s\n' "$output"
  fail=1
fi

# Core compliance guard for issue #407: pr-quality must require code owner review.
assert_contains '"require_code_owner_review": true' "pr-quality requires code owner review"

# Sibling pull_request parameters that must remain enabled alongside it, so the
# guard catches a payload that is partially reverted.
assert_contains '"name": "pr-quality"' "emits the pr-quality ruleset"
assert_contains '"required_approving_review_count": 1' "pr-quality requires one approving review"
assert_contains '"require_last_push_approval": true' "pr-quality requires last push approval"
assert_contains '"required_review_thread_resolution": true' "pr-quality requires review thread resolution"

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "PASS — ${pass_count} assertion(s) passed"
else
  echo "FAIL — see assertions above"
fi
exit "$fail"
