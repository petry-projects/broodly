variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "google_sign_in_client_id" {
  description = "OAuth 2.0 client ID for Google Sign-In (from GCP Console). Leave empty on first apply."
  type        = string
  default     = ""
}

variable "google_sign_in_client_secret" {
  description = "OAuth 2.0 client secret for Google Sign-In"
  type        = string
  default     = ""
  sensitive   = true
}
