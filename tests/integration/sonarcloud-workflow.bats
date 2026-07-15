#!/usr/bin/env bats
# Integration tests for .github/workflows/sonarcloud.yml
#
# The SonarCloud workflow re-runs the mobile jest suite solely to produce a
# coverage report for analysis. When that suite fails or flakes, the whole
# analysis job used to go red — even though ci.yml already runs and gates the
# same tests. These tests assert the coverage step is non-blocking so a test
# failure no longer sinks SonarCloud analysis, while confirming the scan step
# and its retry/backoff logic remain intact.

setup() {
  REPO_ROOT="$(cd "$BATS_TEST_DIRNAME/../.." && pwd)"
  WORKFLOW="$REPO_ROOT/.github/workflows/sonarcloud.yml"
}

@test "coverage generation step is non-blocking (continue-on-error)" {
  run yq '.jobs.sonarcloud.steps[] | select(.name == "Generate JS/TS coverage report") | .["continue-on-error"]' "$WORKFLOW"
  [ "$status" -eq 0 ]
  [ "$output" = "true" ]
}

@test "SonarCloud scan runs and is guarded by the SONAR_TOKEN secret" {
  run yq '[.jobs.sonarcloud.steps[] | select(.uses | test("SonarSource/sonarqube-scan-action"))] | length' "$WORKFLOW"
  [ "$status" -eq 0 ]
  [ "$output" -ge 1 ]

  run yq '[.jobs.sonarcloud.steps[] | select(.uses | test("SonarSource/sonarqube-scan-action")) | select((.if // "") | contains("SONAR_TOKEN") | not)] | length' "$WORKFLOW"
  [ "$status" -eq 0 ]
  [ "$output" -eq 0 ]
}

@test "SonarCloud scan retry/backoff attempts remain intact" {
  run yq '[.jobs.sonarcloud.steps[] | select(.uses | test("SonarSource/sonarqube-scan-action"))] | length' "$WORKFLOW"
  [ "$status" -eq 0 ]
  [ "$output" -eq 3 ]
}
