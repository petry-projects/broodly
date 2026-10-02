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

variable "authorized_domains" {
  description = "Additional authorized domains for Firebase Auth (e.g., localhost for dev)"
  type        = list(string)
  default     = []
}

variable "google_sign_in_client_id" {
  description = "OAuth 2.0 client ID for Google Sign-In. Leave empty to skip provider setup."
  type        = string
  default     = ""
}

variable "google_sign_in_client_secret" {
  description = "OAuth 2.0 client secret for Google Sign-In. Required when google_sign_in_client_id is set."
  type        = string
  default     = ""
  sensitive   = true
}
