#!/usr/bin/env bash
# Test: every .github/workflows/*.yml file is structurally valid.
#
# Why this exists: Fleet Monitor issue #469 flagged dependabot-automerge.yml with
# a high failure rate. Every failure was a GitHub "startup failure" caused by a
# commit in which the workflow file had been truncated to its comment header —
# no `on:` trigger and no `jobs:` block — which GitHub cannot parse. GitHub still
# records such a broken file as a failed run of the workflow path, inflating the
# monitored failure rate. This guard fails CI fast if any workflow file is
# structurally invalid, so a truncated/corrupted stub can never merge to main or
# accumulate startup-failure runs.
#
# A workflow is considered valid when it: parses as a YAML mapping, declares an
# `on:` trigger (YAML 1.1 parses the bare key `on` as boolean true), and has a
# non-empty `jobs:` mapping.
#
# Run: bash tests/scripts/workflow-integrity.test.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKFLOW_DIR="${REPO_ROOT}/.github/workflows"

fail=0
pass_count=0

# _has_pyyaml: 0 when python3 + PyYAML are available, 1 otherwise.
_has_pyyaml() {
  python3 -c 'import yaml' >/dev/null 2>&1
}

# validate_workflow_file <path>
# Prints a human-readable reason and returns non-zero when the file is not a
# structurally valid GitHub Actions workflow.
validate_workflow_file() {
  local path="$1"
  if _has_pyyaml; then
    python3 - "$path" <<'PY'
import sys
import re
import yaml

path = sys.argv[1]
try:
    with open(path, encoding="utf-8") as handle:
        raw = handle.read()
    doc = yaml.safe_load(raw)
except (yaml.YAMLError, OSError) as err:
    print(f"unparseable YAML: {err}")
    sys.exit(1)

if not isinstance(doc, dict):
    print("no top-level mapping (file is empty, comment-only, or truncated)")
    sys.exit(1)

# Require the literal 'on' key via raw-text match; PyYAML (YAML 1.1) parses
# on/true/yes all as boolean True, so a key-lookup alone would accept aliases.
if not re.search(r'^["\']?on["\']?\s*:', raw, re.MULTILINE):
    print("missing 'on:' trigger block")
    sys.exit(1)

jobs = doc.get("jobs")
if not isinstance(jobs, dict) or not jobs:
    print("missing or empty 'jobs:' mapping")
    sys.exit(1)

sys.exit(0)
PY
  else
    # Fallback structural check when PyYAML is unavailable: require a top-level
    # `on:` trigger key and a top-level `jobs:` key. Both are absent from a
    # comment-only / truncated workflow file, which is the failure this guards.
    # Full semantic validation (non-empty jobs, parseability) is delegated to the
    # PyYAML branch; ensure PyYAML is installed in CI to use the strict path.
    local reason=""
    grep -Eq "^[[:space:]]*[\"']?on[\"']?[[:space:]]*:" "$path" \
      || reason="missing 'on:' trigger block"
    { [[ -n "$reason" ]] || grep -Eq "^[[:space:]]*[\"']?jobs[\"']?[[:space:]]*:" "$path"; } \
      || reason="missing 'jobs:' block"
    [[ -z "$reason" ]] || { echo "$reason"; return 1; }
  fi
}

# --- Negative assertion: a truncated (comment-only) workflow is rejected. ------
# This mirrors the exact corruption behind issue #469 and proves the validator
# does not pass trivially.
_fixture_dir="$(mktemp -d)"
trap '[[ -n "${_fixture_dir:-}" ]] && rm -rf "$_fixture_dir"' EXIT
_bad_fixture="${_fixture_dir}/truncated.yml"
cat > "$_bad_fixture" <<'EOF'
# ─────────────────────────────────────────────────────────────────────────────
# Dependabot auto-merge — thin caller for the org-level reusable.
# (Body truncated — no name/on/jobs. This is the corruption from issue #469.)
# ─────────────────────────────────────────────────────────────────────────────
EOF

! validate_workflow_file "$_bad_fixture" >/dev/null 2>&1 \
  && { echo "ok - validator rejects a truncated comment-only workflow"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - validator accepted a truncated comment-only workflow"; fail=1; }

# --- Positive assertion: every real workflow file is structurally valid. -------
shopt -s nullglob
workflow_files=("${WORKFLOW_DIR}"/*.yml "${WORKFLOW_DIR}"/*.yaml)
shopt -u nullglob

[[ ${#workflow_files[@]} -gt 0 ]] \
  || { echo "not ok - no workflow files found under ${WORKFLOW_DIR}"; fail=1; }

for wf in "${workflow_files[@]}"; do
  rel="${wf#"${REPO_ROOT}/"}"
  reason="$(validate_workflow_file "$wf")" \
    && { echo "ok - ${rel} is structurally valid"; pass_count=$((pass_count + 1)); } \
    || { echo "not ok - ${rel} is structurally invalid: ${reason}"; fail=1; }
done

echo "---"
[[ "$fail" -eq 0 ]] \
  && echo "PASS — ${pass_count} assertion(s) passed" \
  || echo "FAIL — see assertions above"
exit "$fail"
