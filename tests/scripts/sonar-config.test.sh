#!/usr/bin/env bash
# Test: sonar-project.properties never uses wildcards in sonar.sources / sonar.tests.
#
# Why this exists: Fleet Monitor issue #533 flagged .github/workflows/sonarcloud.yml
# with a high failure rate. The failing run's SonarCloud scan failed deterministically
# on every retry attempt with:
#   ERROR Invalid value of sonar.tests for petry-projects_broodly
#   ERROR Wildcards ** and * are not supported in "sonar.sources" and "sonar.tests"
#         properties.
# SonarCloud forbids '*' / '**' wildcards in sonar.sources and sonar.tests (they are a
# comma-separated list of directories). Wildcards belong only in the *.exclusions,
# *.inclusions, and *.test.* filter properties. A wildcard in either sonar.sources or
# sonar.tests makes the scanner exit 3 on every run, and the sonarcloud.yml retry loop
# cannot recover a deterministic config error — it just fails the job (and inflates
# duration). This guard fails CI fast so such a config can never merge to main.
#
# Run: bash tests/scripts/sonar-config.test.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROPERTIES_FILE="${REPO_ROOT}/sonar-project.properties"

fail=0
pass_count=0

# validate_sonar_properties <path>
# Prints a human-readable reason and returns non-zero when the file sets a
# sonar.sources or sonar.tests value containing a '*' wildcard.
validate_sonar_properties() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "file not found: ${path}"
    return 1
  fi

  local reason=""
  local key
  for key in "sonar.sources" "sonar.tests"; do
    # Extract the raw value for the key (last assignment wins, matching the
    # java.util.Properties semantics the scanner uses). Ignore commented lines.
    local value
    value="$(grep -E "^[[:space:]]*${key//./\\.}[[:space:]]*=" "$path" 2>/dev/null \
      | grep -vE "^[[:space:]]*#" \
      | tail -n1 \
      | sed -E "s/^[[:space:]]*${key//./\\.}[[:space:]]*=[[:space:]]*//")" || true
    if [[ "$value" == *"*"* ]]; then
      reason="${key} contains an unsupported wildcard: '${value}'"
      break
    fi
  done

  [[ -z "$reason" ]] || { echo "$reason"; return 1; }
}

# --- Negative assertions: wildcard sonar.sources / sonar.tests are rejected. ---
# These mirror the exact corruption behind issue #533 and prove the validator
# does not pass trivially.
_fixture_dir="$(mktemp -d)"
trap '[[ -n "${_fixture_dir:-}" ]] && rm -rf "$_fixture_dir"' EXIT

_bad_tests="${_fixture_dir}/bad-tests.properties"
cat > "$_bad_tests" <<'EOF'
sonar.projectKey=petry-projects_broodly
sonar.sources=.
sonar.tests=apps/**/__tests__
EOF

! validate_sonar_properties "$_bad_tests" >/dev/null 2>&1 \
  && { echo "ok - validator rejects a wildcard sonar.tests"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - validator accepted a wildcard sonar.tests"; fail=1; }

_bad_sources="${_fixture_dir}/bad-sources.properties"
cat > "$_bad_sources" <<'EOF'
sonar.projectKey=petry-projects_broodly
sonar.sources=apps/*
EOF

! validate_sonar_properties "$_bad_sources" >/dev/null 2>&1 \
  && { echo "ok - validator rejects a wildcard sonar.sources"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - validator accepted a wildcard sonar.sources"; fail=1; }

# --- Negative control: wildcards in sonar.exclusions are allowed. --------------
# SonarCloud permits wildcards in the filter properties; the guard must not flag
# them, or it would reject the repo's own valid config.
_ok_exclusions="${_fixture_dir}/ok-exclusions.properties"
cat > "$_ok_exclusions" <<'EOF'
sonar.projectKey=petry-projects_broodly
sonar.sources=.
sonar.exclusions=_bmad/**,.github/**
EOF

validate_sonar_properties "$_ok_exclusions" >/dev/null 2>&1 \
  && { echo "ok - validator allows wildcards in sonar.exclusions"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - validator wrongly rejected wildcards in sonar.exclusions"; fail=1; }

# --- Positive assertion: the repo's real properties file is valid. -------------
reason="$(validate_sonar_properties "$PROPERTIES_FILE")" \
  && { echo "ok - sonar-project.properties has no wildcard sonar.sources/sonar.tests"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - sonar-project.properties is invalid: ${reason}"; fail=1; }

echo "---"
[[ "$fail" -eq 0 ]] \
  && echo "PASS — ${pass_count} assertion(s) passed" \
  || echo "FAIL — see assertions above"
exit "$fail"
