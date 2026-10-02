# Cloud SQL outputs
output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = module.cloud_sql.connection_name
}

output "cloud_sql_ip_address" {
  description = "Cloud SQL instance IP address"
  value       = module.cloud_sql.ip_address
}

output "cloud_sql_database_name" {
  description = "Cloud SQL database name"
  value       = module.cloud_sql.database_name
}

# Storage outputs
output "media_bucket_name" {
  description = "Media storage bucket name"
  value       = module.storage.bucket_name
}

output "media_bucket_url" {
  description = "Media storage bucket URL"
  value       = module.storage.bucket_url
}

# Pub/Sub outputs
output "pubsub_topic_names" {
  description = "Map of Pub/Sub topic names"
  value       = module.pubsub.topic_names
}

output "pubsub_subscription_names" {
  description = "Map of Pub/Sub subscription names"
  value       = module.pubsub.subscription_names
}

# Service account outputs
output "api_service_account_email" {
  description = "API service account email"
  value       = google_service_account.api.email
}

output "worker_service_account_email" {
  description = "Worker service account email"
  value       = google_service_account.worker.email
}

# Firebase outputs
output "firebase_api_key" {
  description = "Firebase API key for web app"
  value       = module.firebase.api_key
  sensitive   = true
}

output "firebase_auth_domain" {
  description = "Firebase auth domain"
  value       = module.firebase.auth_domain
}

output "firebase_project_id" {
  description = "Firebase project ID"
  value       = module.firebase.project_id
}

output "firebase_storage_bucket" {
  description = "Firebase storage bucket"
  value       = module.firebase.storage_bucket
}

output "firebase_messaging_sender_id" {
  description = "Firebase messaging sender ID"
  value       = module.firebase.messaging_sender_id
}

output "firebase_app_id" {
  description = "Firebase app ID"
  value       = module.firebase.app_id
}

# Cloud Run outputs
output "cloud_run_service_url" {
  description = "Cloud Run API service URL"
  value       = module.cloud_run.service_url
}

output "cloud_run_service_name" {
  description = "Cloud Run API service name"
  value       = module.cloud_run.service_name
}
