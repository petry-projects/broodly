output "web_app_id" {
  description = "Firebase web app ID"
  value       = google_firebase_web_app.default.app_id
}

output "api_key" {
  description = "Firebase web app API key (for EXPO_PUBLIC_FIREBASE_API_KEY)"
  value       = data.google_firebase_web_app_config.default.api_key
  sensitive   = true
}

output "auth_domain" {
  description = "Firebase auth domain (for EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN)"
  value       = data.google_firebase_web_app_config.default.auth_domain
}

output "storage_bucket" {
  description = "Firebase storage bucket (for EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET)"
  value       = data.google_firebase_web_app_config.default.storage_bucket
}

output "messaging_sender_id" {
  description = "Firebase messaging sender ID (for EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)"
  value       = data.google_firebase_web_app_config.default.messaging_sender_id
}

output "app_id" {
  description = "Firebase app ID (for EXPO_PUBLIC_FIREBASE_APP_ID)"
  value       = google_firebase_web_app.default.app_id
}

output "project_id" {
  description = "Firebase project ID (for EXPO_PUBLIC_FIREBASE_PROJECT_ID)"
  value       = var.project_id
}
