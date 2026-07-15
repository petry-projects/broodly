#!/usr/bin/env bats
# Regression guard for the dependency-audit caller stub (issue #398).
#
# .github/workflows/dependency-audit.yml is a THIN CALLER STUB that must be
# adopted verbatim from the canonical source of truth
# (petry-projects/.github/standards/workflows/dependency-audit.yml). The stub
# had drifted to the non-canonical `@dependency-audit/v2-stable` channel; the
# vetted canonical channel is `@dependency-audit/stable`. These tests fail if
# the stub drifts off the canonical channel again.

setup() {
  REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../.." && pwd)"
  STUB="$REPO_ROOT/.github/workflows/dependency-audit.yml"
}

@test "dependency-audit stub file exists" {
  [ -f "$STUB" ]
}

@test "stub pins the reusable at the canonical @dependency-audit/stable channel" {
  grep -qE 'uses:[[:space:]]*petry-projects/\.github/\.github/workflows/dependency-audit-reusable\.yml@dependency-audit/stable([[:space:]]|#|$)' "$STUB"
}

@test "stub does not pin any drifted v2-stable / pre-release channel" {
  ! grep -qE '@dependency-audit/v2-stable' "$STUB"
}
