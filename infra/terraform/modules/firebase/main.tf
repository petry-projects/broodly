# -----------------------------------------------------------------------------
# Firebase Project & Web App + Identity Platform Auth
# -----------------------------------------------------------------------------
# Provisions Firebase on an existing GCP project, creates a web app, and
# configures Identity Platform for authentication (Google Sign-In).
#
# Apple Sign-In requires credentials from Apple Developer Console — enable it
# manually in Firebase Console → Authentication → Sign-in method after the
# initial apply.
# -----------------------------------------------------------------------------

# Enable required APIs
resource "google_project_service" "identity_toolkit" {
  provider = google-beta
  project  = var.project_id
  service  = "identitytoolkit.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "firebase" {
  provider = google-beta
  project  = var.project_id
  service  = "firebase.googleapis.com"

  disable_on_destroy = false
}

# Firebase project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id

  depends_on = [google_project_service.firebase]
}

# Firebase web app
resource "google_firebase_web_app" "default" {
  provider     = google-beta
  project      = var.project_id
  display_name = "${var.display_name} (${var.environment})"

  depends_on = [google_firebase_project.default]
}

# Web app config (provides apiKey, authDomain, etc.)
data "google_firebase_web_app_config" "default" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.default.app_id

  depends_on = [google_firebase_web_app.default]
}

# -----------------------------------------------------------------------------
# Identity Platform — Auth Configuration
# -----------------------------------------------------------------------------
# Configures authorized domains and sign-in settings. Google Sign-In provider
# is conditionally enabled when client_id is provided.
#
# Two-phase setup:
#   1. First apply: Creates Firebase project + Identity Platform config.
#      Firebase auto-creates an OAuth client for Google Sign-In.
#   2. Retrieve the auto-created OAuth client ID from GCP Console →
#      APIs & Services → Credentials, then re-apply with the client ID.
# -----------------------------------------------------------------------------

resource "google_identity_platform_config" "default" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false
  }

  authorized_domains = distinct(concat(
    [
      "${var.project_id}.firebaseapp.com",
      "${var.project_id}.web.app",
    ],
    var.environment == "dev" ? ["localhost"] : [],
    var.authorized_domains,
  ))

  depends_on = [
    google_project_service.identity_toolkit,
    google_firebase_project.default,
  ]
}

# Google Sign-In provider (conditional — requires OAuth client ID)
resource "google_identity_platform_default_supported_idp_config" "google" {
  count = var.google_sign_in_client_id != "" ? 1 : 0

  provider      = google-beta
  project       = var.project_id
  idp_id        = "google.com"
  client_id     = var.google_sign_in_client_id
  client_secret = var.google_sign_in_client_secret
  enabled       = true

  depends_on = [google_identity_platform_config.default]

  lifecycle {
    precondition {
      condition     = var.google_sign_in_client_secret != ""
      error_message = "google_sign_in_client_secret must be set when google_sign_in_client_id is non-empty."
    }
  }
}
