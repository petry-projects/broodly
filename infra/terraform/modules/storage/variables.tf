variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for the storage bucket"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "bucket_name" {
  description = "Name of the GCS bucket for media storage"
  type        = string
}

variable "cors_origins" {
  description = "List of allowed CORS origins for signed URL uploads. Must be explicitly set per environment."
  type        = list(string)
  default     = []
}
