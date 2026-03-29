variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "topic_names" {
  description = "List of Pub/Sub topic base names to create"
  type        = list(string)
  default = [
    "inspection-events",
    "media-uploaded",
    "telemetry-ingested",
    "notification-dispatch",
    "embedding-requests",
  ]
}

variable "message_retention_duration" {
  description = "Message retention duration for subscriptions"
  type        = string
  default     = "604800s" # 7 days
}

variable "max_delivery_attempts" {
  description = "Maximum number of delivery attempts before sending to DLQ"
  type        = number
  default     = 5
}
