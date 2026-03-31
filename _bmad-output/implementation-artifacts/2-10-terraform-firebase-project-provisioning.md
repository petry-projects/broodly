# Story 2.10: Terraform Firebase Project Provisioning

## Status: review

## Tasks
- [x] main.tf with google_firebase_project, google_firebase_web_app, and data source for web app config
- [x] variables.tf with project_id, environment, and display_name variables
- [x] outputs.tf with all web app config values (api_key, auth_domain, project_id, storage_bucket, messaging_sender_id, app_id, web_app_id)
- [x] api_key output marked as sensitive
- [x] Output descriptions reference corresponding EXPO_PUBLIC_ env var names
- [x] Auth provider configuration documented as manual steps in main.tf comments
- [x] Validation tests for Terraform module structure (14 test cases)

## Dev Agent Record
### Implementation Notes
- Firebase module provisions Firebase on an existing GCP project and creates a web app
- outputs.tf maps all web app config values needed for EXPO_PUBLIC_ env vars
- api_key is marked sensitive to prevent accidental exposure in terraform output
- Auth provider enablement (Google, Apple, Facebook) requires manual Firebase Console steps, documented in main.tf
- New terraform-firebase-outputs.test.ts validates module file existence, output names, sensitivity, and env var documentation
- All 14 tests pass

### File List
- infra/terraform/modules/firebase/main.tf
- infra/terraform/modules/firebase/variables.tf
- infra/terraform/modules/firebase/outputs.tf
- apps/mobile/__tests__/terraform-firebase-outputs.test.ts

### Change Log
- 2026-03-30: Created Terraform module validation tests
