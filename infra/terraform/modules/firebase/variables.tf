variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "display_name" {
  description = "Display name for the Firebase web app"
  type        = string
  default     = "Broodly Web"
}
