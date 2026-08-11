#!/usr/bin/env bash
# validate-workflows.sh — reject structurally-invalid GitHub Actions workflows.
#
# Every file under .github/workflows/ must be a runnable workflow: it needs a
# top-level trigger (`on:`) and a top-level `jobs:` block. A file that has
# neither — e.g. a thin-caller stub whose body was accidentally truncated,
# leaving only its comment header — is treated by GitHub as an *invalid*
# workflow and recorded as a `startup_failure` run on every push. Those runs
# count against the workflow's health metric.
#
# This guard catches that class of breakage in CI before it lands on a branch.
# See Fleet Monitor issue #466 (auto-rebase.yml was truncated to comments-only
# on a feature branch, driving its failure rate to 50%).
#
# Pure static check — no network, no YAML dependency. It inspects only the
# top-level keys (column 0) so keys nested inside jobs cannot produce a false
# pass.
#
# Usage:
#   ./scripts/validate-workflows.sh [workflows_dir]
# Defaults to .github/workflows relative to the repo root.
#
# Exit codes: 0 = all workflow files valid (or none present); 1 = one or more
# invalid files (each reported to stderr).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOWS_DIR="${1:-${REPO_ROOT}/.github/workflows}"

if [[ ! -d "$WORKFLOWS_DIR" ]]; then
  echo "::error::workflows directory not found: ${WORKFLOWS_DIR}" >&2
  exit 1
fi

# A top-level trigger key: `on:`, quoted "on":/'on':. Anchored at column 0.
TRIGGER_RE='^(on|"on"|'\''on'\'')[[:space:]]*:'
# A top-level jobs key at column 0.
JOBS_RE='^jobs[[:space:]]*:'

invalid=0
checked=0

# Nullglob so an empty directory yields no iterations instead of a literal glob.
shopt -s nullglob
for wf in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
  [[ -f "$wf" ]] || continue
  checked=$((checked + 1))
  name="$(basename "$wf")"

  missing=()
  grep -Eq "$TRIGGER_RE" "$wf" || missing+=("on: trigger")
  grep -Eq "$JOBS_RE" "$wf" || missing+=("jobs:")
  # If jobs: exists, verify it contains at least one indented line (job definition).
  if grep -Eq "$JOBS_RE" "$wf" && ! awk '/^jobs/{found=1; next} found && /^  /{has_jobs=1} found && /^[^ ]/{exit} END{exit !has_jobs}' "$wf"; then
    missing+=("job definitions under jobs:")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    missing_list="$(IFS='|'; echo "${missing[*]}")"
    missing_list="${missing_list//|/ and }"
    echo "::error file=${wf}::invalid workflow — missing top-level ${missing_list} (${name})" >&2
    invalid=$((invalid + 1))
  fi
done
shopt -u nullglob

if [[ "$invalid" -gt 0 ]]; then
  echo "validate-workflows: ${invalid} invalid workflow file(s) in ${WORKFLOWS_DIR}" >&2
  exit 1
fi

echo "validate-workflows: ${checked} workflow file(s) valid in ${WORKFLOWS_DIR}"
exit 0
