variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
}

variable "image" {
  description = "Container image to deploy (e.g., us-central1-docker.pkg.dev/project/repo/api:tag)"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for the Cloud Run service"
  type        = string
}

variable "env_vars" {
  description = "Environment variables to set on the Cloud Run service"
  type        = map(string)
  default     = {}
}

variable "min_instances" {
  description = "Minimum number of instances (0 allows scale-to-zero)"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 2
}

variable "cpu" {
  description = "CPU allocation (e.g., 1, 2)"
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory allocation (e.g., 256Mi, 512Mi)"
  type        = string
  default     = "256Mi"
}

variable "port" {
  description = "Container port"
  type        = number
  default     = 8080
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated access. Defaults to false — set to true only when app-layer auth is enforced."
  type        = bool
  default     = false
}
