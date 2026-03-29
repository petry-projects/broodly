resource "google_storage_bucket" "media" {
  name     = var.bucket_name
  project  = var.project_id
  location = var.region

  uniform_bucket_level_access = true
  force_destroy               = var.environment == "dev" ? true : false

  versioning {
    enabled = true
  }

  cors {
    origin          = var.cors_origins
    method          = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    response_header = ["Content-Type", "Content-Disposition", "Content-Length"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }
}
