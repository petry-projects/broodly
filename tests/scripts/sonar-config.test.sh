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

# _sonar_property_value <path> <key>
# Extracts the logical value for <key> from a java.util.Properties file exactly
# as SonarScanner's parser would. Honors all java.util.Properties forms: '=',
# ':' and whitespace key/value separators, '#'/'!' comment lines, and backslash
# line-continuations (a physical line ending in an odd number of backslashes is
# joined with the next, whose leading whitespace is discarded). Last assignment
# wins. Prints the raw value ('' if the key is absent). Parsing the logical
# property first is what stops a wildcard hidden in a colon/whitespace/continued
# form from bypassing the guard.
_sonar_property_value() {
  local path="$1" key="$2"
  awk -v target="$key" '
    function trailing_bs(s,   i, c) {
      c = 0; i = length(s)
      while (i >= 1 && substr(s, i, 1) == "\\") { c++; i-- }
      return c
    }
    function is_ws(ch) { return (ch == " " || ch == "\t" || ch == "\f") }
    function process(line,   i, ch, k, v, n) {
      sub(/^[ \t\f]+/, "", line)
      if (line == "" || substr(line, 1, 1) == "#" || substr(line, 1, 1) == "!") return
      n = length(line); i = 1; k = ""
      while (i <= n) {
        ch = substr(line, i, 1)
        if (ch == "\\") { k = k substr(line, i + 1, 1); i += 2; continue }
        if (ch == "=" || ch == ":" || is_ws(ch)) break
        k = k ch; i++
      }
      while (i <= n && is_ws(substr(line, i, 1))) i++
      if (i <= n && (substr(line, i, 1) == "=" || substr(line, i, 1) == ":")) {
        i++
        while (i <= n && is_ws(substr(line, i, 1))) i++
      }
      v = substr(line, i)
      if (k == target) value = v
    }
    BEGIN { buf = ""; cont = 0; value = "" }
    {
      line = $0
      if (cont) sub(/^[ \t\f]+/, "", line)
      if (trailing_bs(line) % 2 == 1) {
        buf = buf substr(line, 1, length(line) - 1)
        cont = 1
        next
      }
      buf = buf line
      process(buf)
      buf = ""; cont = 0
    }
    END { if (buf != "") process(buf); printf "%s", value }
  ' "$path"
}

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
  local key value
  for key in "sonar.sources" "sonar.tests"; do
    # Resolve the logical property value (all java.util.Properties separator and
    # continuation forms, last-assignment-wins) before checking for a wildcard.
    value="$(_sonar_property_value "$path" "$key")"
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
_fixture_dir="$(mktemp -d)" || { echo "Failed to create temporary directory" >&2; exit 1; }
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

# --- Negative assertions: alternate java.util.Properties forms are covered. ----
# A wildcard must be caught regardless of the separator (':' or whitespace) or
# whether the value is spread across backslash-continuation lines — these are the
# forms a naive single-line '=' match would let slip past the guard.
_bad_colon="${_fixture_dir}/bad-colon.properties"
cat > "$_bad_colon" <<'EOF'
sonar.projectKey=petry-projects_broodly
sonar.tests:apps/**/__tests__
EOF

! validate_sonar_properties "$_bad_colon" >/dev/null 2>&1 \
  && { echo "ok - validator rejects a wildcard sonar.tests with ':' separator"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - validator accepted a wildcard sonar.tests with ':' separator"; fail=1; }

_bad_ws="${_fixture_dir}/bad-whitespace.properties"
cat > "$_bad_ws" <<'EOF'
sonar.projectKey=petry-projects_broodly
sonar.sources apps/*
EOF

! validate_sonar_properties "$_bad_ws" >/dev/null 2>&1 \
  && { echo "ok - validator rejects a wildcard sonar.sources with whitespace separator"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - validator accepted a wildcard sonar.sources with whitespace separator"; fail=1; }

_bad_cont="${_fixture_dir}/bad-continuation.properties"
cat > "$_bad_cont" <<'EOF'
sonar.projectKey=petry-projects_broodly
sonar.tests=\
  apps/**/__tests__
EOF

! validate_sonar_properties "$_bad_cont" >/dev/null 2>&1 \
  && { echo "ok - validator rejects a wildcard sonar.tests across a line continuation"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - validator accepted a wildcard sonar.tests across a line continuation"; fail=1; }

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
