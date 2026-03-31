# -----------------------------------------------------------------------------
# Firebase Project & Web App
# -----------------------------------------------------------------------------
# Provisions Firebase on an existing GCP project and creates a web app.
# Auth provider enablement (Google, Apple, Facebook) is a Firebase Console
# operation — Terraform cannot fully manage OAuth provider configuration
# including client IDs and secrets. See README for manual steps.
# -----------------------------------------------------------------------------

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.project_id
  display_name = "${var.display_name} (${var.environment})"

  depends_on = [google_firebase_project.default]
}

data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.default.app_id

  depends_on = [google_firebase_web_app.default]
}

# -----------------------------------------------------------------------------
# Auth Provider Configuration — Manual Steps Required
# -----------------------------------------------------------------------------
# The following auth providers must be enabled manually in the Firebase Console
# (https://console.firebase.google.com → Authentication → Sign-in method):
#
# 1. Google Sign-In
#    - Enable the Google provider
#    - Web client ID is auto-created by Firebase
#
# 2. Apple Sign-In
#    - Enable the Apple provider
#    - Configure Services ID, Team ID, Key ID, and private key from Apple Developer
#    - Required for iOS App Store compliance
#
# 3. Facebook Sign-In
#    - Enable the Facebook provider
#    - Configure App ID and App Secret from Facebook Developer Console
#
# After enabling providers, the Firebase web app config (apiKey, authDomain, etc.)
# is available via `terraform output firebase_web_app_config`.
# -----------------------------------------------------------------------------
