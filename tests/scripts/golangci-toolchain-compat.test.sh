#!/usr/bin/env bash
# Test: the golangci-lint release pinned in .github/workflows/ci.yml was built
# with a Go version >= the toolchain targeted by apps/api/go.mod.
#
# Why this exists: Fleet Monitor issue #545 flagged ci.yml with a high failure
# rate. Both failures in the monitored window were the Go job's golangci-lint
# step aborting with:
#
#   can't load config: the Go language version (go1.26) used to build
#   golangci-lint is lower than the targeted Go version (1.27.2)
#
# golangci-lint refuses to run when the Go version it was *built with* is older
# than the version targeted by go.mod (the `toolchain` directive, or the `go`
# directive when no toolchain is pinned). The workflow pins golangci-lint to an
# explicit release for reproducibility; that release is built with a fixed Go
# version. Bumping apps/api/go.mod's toolchain for stdlib security fixes — a
# routine change that leaves the `go` language directive untouched — silently
# outdates the pinned golangci-lint, and the Go job fails with the confusing
# error above only after the expensive build/test steps have run.
#
# This guard fails fast in the cheap shell-tests job when the pin and the
# toolchain drift out of compatibility, with a message that names the exact
# remediation: bump golangci-lint to a release built with a new enough Go and
# update the `golangci-build-go` marker beside the `version:` pin in ci.yml.
#
# The marker is a machine-readable comment on the golangci-lint pin, e.g.:
#   # golangci-build-go: 1.26
#   version: v2.11.4
# It records the Go minor version the pinned release was built with. Whoever
# bumps the golangci-lint `version:` must update the marker to match the new
# release's build Go (printed by `golangci-lint version` as "built with goX.Y").
#
# Run: bash tests/scripts/golangci-toolchain-compat.test.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CI_WORKFLOW="${REPO_ROOT}/.github/workflows/ci.yml"
GO_MOD="${REPO_ROOT}/apps/api/go.mod"

fail=0
pass_count=0

# compat_check <build_go_major_minor> <target_go_major_minor>
# Returns 0 when the golangci-lint build Go version is >= the targeted Go
# version (compared by major.minor, matching golangci-lint's own check), and
# prints a remediation message and returns 1 otherwise.
compat_check() {
  local build_go="$1" target_go="$2"
  local build_major build_minor target_major target_minor
  # Robust parsing: handles both "1.26" and "1.26.2" formats
  IFS=. read -r build_major build_minor _ <<<"$build_go"
  IFS=. read -r target_major target_minor _ <<<"$target_go"

  if (( target_major > build_major )) \
    || { (( target_major == build_major )) && (( target_minor > build_minor )); }; then
    echo "golangci-lint is built with Go ${build_go} but apps/api/go.mod targets Go ${target_go};" \
         "golangci-lint will abort with 'the Go language version used to build golangci-lint is" \
         "lower than the targeted Go version'. Bump the golangci-lint 'version:' pin in" \
         ".github/workflows/ci.yml to a release built with Go >= ${target_go} and update the" \
         "'golangci-build-go' marker beside it to match."
    return 1
  fi
  return 0
}

# extract_build_go <ci_workflow_path>
# Prints the major.minor Go version recorded by the golangci-build-go marker.
extract_build_go() {
  local path="$1" value
  value="$(grep -oE '#[[:space:]]*golangci-build-go:[[:space:]]*[0-9]+\.[0-9]+' "$path" \
    | head -n1 | grep -oE '[0-9]+\.[0-9]+' || true)"
  printf '%s' "$value"
}

# extract_target_go <go_mod_path>
# Prints the major.minor Go version go.mod targets: the `toolchain` directive
# when present (golangci-lint honours it), else the `go` language directive.
extract_target_go() {
  local path="$1" value
  value="$(grep -oE '^toolchain[[:space:]]+go[0-9]+\.[0-9]+' "$path" \
    | head -n1 | grep -oE '[0-9]+\.[0-9]+' || true)"
  if [[ -z "$value" ]]; then
    value="$(grep -oE '^go[[:space:]]+[0-9]+\.[0-9]+' "$path" \
      | head -n1 | grep -oE '[0-9]+\.[0-9]+' || true)"
  fi
  printf '%s' "$value"
}

# --- Negative assertion: an outdated golangci-lint build Go is rejected. --------
# This mirrors the exact drift behind issue #545 (build 1.26 vs target 1.27) and
# proves the guard does not pass trivially.
! compat_check "1.26" "1.27" >/dev/null 2>&1 \
  && { echo "ok - guard rejects build-go 1.26 against target 1.27"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - guard accepted an outdated golangci-lint build Go"; fail=1; }

# --- Positive assertions: compatible pairings are accepted. ---------------------
compat_check "1.26" "1.26" >/dev/null 2>&1 \
  && { echo "ok - guard accepts equal build-go and target (1.26 / 1.26)"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - guard rejected an equal build-go/target pairing"; fail=1; }

compat_check "1.27" "1.26" >/dev/null 2>&1 \
  && { echo "ok - guard accepts newer build-go than target (1.27 / 1.26)"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - guard rejected a newer build-go than target"; fail=1; }

# --- Real-file assertions: the committed ci.yml pin matches go.mod. -------------
[[ -f "$CI_WORKFLOW" ]] \
  && { echo "ok - ${CI_WORKFLOW#"${REPO_ROOT}/"} exists"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - ${CI_WORKFLOW#"${REPO_ROOT}/"} not found"; fail=1; }

[[ -f "$GO_MOD" ]] \
  && { echo "ok - ${GO_MOD#"${REPO_ROOT}/"} exists"; pass_count=$((pass_count + 1)); } \
  || { echo "not ok - ${GO_MOD#"${REPO_ROOT}/"} not found"; fail=1; }

if [[ "$fail" -eq 0 ]]; then
  build_go="$(extract_build_go "$CI_WORKFLOW")"
  target_go="$(extract_target_go "$GO_MOD")"

  [[ -n "$build_go" ]] \
    && { echo "ok - ci.yml declares a golangci-build-go marker (${build_go})"; pass_count=$((pass_count + 1)); } \
    || { echo "not ok - ci.yml is missing a 'golangci-build-go: X.Y' marker beside the golangci-lint version pin"; fail=1; }

  [[ -n "$target_go" ]] \
    && { echo "ok - go.mod declares a target Go version (${target_go})"; pass_count=$((pass_count + 1)); } \
    || { echo "not ok - could not read a toolchain/go version from apps/api/go.mod"; fail=1; }

  if [[ -n "$build_go" && -n "$target_go" ]]; then
    if reason="$(compat_check "$build_go" "$target_go")"; then
      echo "ok - pinned golangci-lint (build Go ${build_go}) is compatible with go.mod target (${target_go})"
      pass_count=$((pass_count + 1))
    else
      echo "not ok - ${reason}"
      fail=1
    fi
  fi
fi

echo "---"
[[ "$fail" -eq 0 ]] \
  && echo "PASS — ${pass_count} assertion(s) passed" \
  || echo "FAIL — see assertions above"
exit "$fail"
