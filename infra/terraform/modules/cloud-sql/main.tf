resource "google_sql_database_instance" "main" {
  name                = "broodly-${var.environment}"
  project             = var.project_id
  region              = var.region
  database_version    = "POSTGRES_16"
  deletion_protection = var.deletion_protection

  settings {
    tier              = var.tier
    availability_type = var.availability_type

    database_flags {
      name  = "cloudsql.enable_pgvector"
      value = "on"
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled = true

      dynamic "authorized_networks" {
        for_each = var.authorized_networks
        content {
          name  = authorized_networks.value.name
          value = authorized_networks.value.value
        }
      }
    }

    insights_config {
      query_insights_enabled = true
    }
  }
}

resource "google_sql_database" "broodly" {
  name     = var.database_name
  instance = google_sql_database_instance.main.name
  project  = var.project_id
}

data "google_secret_manager_secret_version" "db_password" {
  secret  = var.db_password_secret_id
  project = var.project_id
}

resource "google_sql_user" "app" {
  name     = "broodly-app"
  instance = google_sql_database_instance.main.name
  project  = var.project_id
  password = data.google_secret_manager_secret_version.db_password.secret_data
}
