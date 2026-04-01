output "service_url" {
  description = "URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.api.uri
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.api.name
}

output "service_id" {
  description = "Fully qualified ID of the Cloud Run service"
  value       = google_cloud_run_v2_service.api.id
}
