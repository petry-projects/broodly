#!/usr/bin/env bats
# Integration tests for scripts/apply-repo-settings.sh
#
# These tests stub the `gh` and `jq` CLIs so the script can run without network
# access or real credentials, and assert that it targets the correct GitHub REST
# endpoint for check-suite preferences (`check-suites/preferences`, plural).

setup() {
  REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../.." && pwd)"
  SCRIPT="$REPO_ROOT/scripts/apply-repo-settings.sh"

  BIN_DIR="$BATS_TEST_TMPDIR/bin"
  mkdir -p "$BIN_DIR"
  CALL_LOG="$BATS_TEST_TMPDIR/gh-calls.log"

  # Mock `gh`: record every invocation, satisfy the repo-identity safety check,
  # and succeed on the PATCH without making a network call.
  cat > "$BIN_DIR/gh" <<MOCK
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$CALL_LOG"
if [ "\$1" = "repo" ] && [ "\$2" = "view" ]; then
  echo "petry-projects/broodly"
  exit 0
fi
# Drain stdin for the PATCH --input - call so the pipe does not break.
if [ "\$1" = "api" ]; then
  cat > /dev/null 2>&1 || true
  exit 0
fi
exit 0
MOCK
  chmod +x "$BIN_DIR/gh"

  export PATH="$BIN_DIR:$PATH"
  export GH_TOKEN="test-token"
}

@test "applies check-suite preferences via the plural check-suites/preferences endpoint" {
  run bash "$SCRIPT" broodly
  [ "$status" -eq 0 ]
  grep -q "api -X PATCH repos/petry-projects/broodly/check-suites/preferences" "$CALL_LOG"
}

@test "never targets the non-existent singular check-suite/preferences endpoint" {
  run bash "$SCRIPT" broodly
  [ "$status" -eq 0 ]
  ! grep -qE "repos/petry-projects/broodly/check-suite/preferences" "$CALL_LOG"
}

@test "dry-run makes no PATCH call" {
  run bash "$SCRIPT" broodly --dry-run
  [ "$status" -eq 0 ]
  ! grep -q "api -X PATCH" "$CALL_LOG"
}
