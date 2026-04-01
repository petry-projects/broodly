# -----------------------------------------------------------------------------
# Cloud Run Service
# -----------------------------------------------------------------------------
# Deploys the API container to Cloud Run. CI pushes new revisions via
# `gcloud run deploy`; Terraform manages the service definition, scaling,
# IAM, and environment configuration.
# -----------------------------------------------------------------------------

resource "google_project_service" "run" {
  project = var.project_id
  service = "run.googleapis.com"

  disable_on_destroy = false
}

resource "google_cloud_run_v2_service" "api" {
  provider = google-beta
  project  = var.project_id
  name     = var.service_name
  location = var.region

  labels = {
    environment = var.environment
    managed-by  = "terraform"
  }

  template {
    service_account = var.service_account_email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      ports {
        container_port = var.port
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  depends_on = [google_project_service.run]

  lifecycle {
    # CI deploys new images via gcloud; don't revert to the Terraform-specified tag
    ignore_changes = [template[0].containers[0].image]
  }
}

# Allow unauthenticated access (public API endpoint).
# Security note: This makes the service publicly reachable without GCP
# credentials. Only enable for APIs where authentication is enforced at the
# application layer (e.g., Firebase Auth bearer tokens) or for public endpoints.
resource "google_cloud_run_v2_service_iam_member" "public" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
