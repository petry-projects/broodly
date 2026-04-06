output "code_quality_ruleset_id" {
  description = "The ID of the code-quality repository ruleset"
  value       = github_repository_ruleset.code_quality.ruleset_id
}
