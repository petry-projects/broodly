resource "google_cloud_run_v2_service" "api" {
  name     = var.service_name
  location = var.region

  template {
    service_account = var.service_account_email

    containers {
      image = var.image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      env {
        name  = "FIREBASE_PROJECT_ID"
        value = var.project_id
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = var.db_connection_secret
            version = "latest"
          }
        }
      }

      env {
        name  = "CORS_ORIGIN"
        value = var.cors_origin
      }
    }

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Allow unauthenticated access (API handles its own auth via Firebase)
resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.allow_unauthenticated ? 1 : 0
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
