# Dead-letter topics
resource "google_pubsub_topic" "dlq" {
  for_each = toset(var.topic_names)

  name    = "${each.value}-${var.environment}-dlq"
  project = var.project_id

  message_retention_duration = var.message_retention_duration
}

# Dead-letter subscriptions (to retain DLQ messages)
resource "google_pubsub_subscription" "dlq" {
  for_each = toset(var.topic_names)

  name    = "${each.value}-${var.environment}-dlq-sub"
  topic   = google_pubsub_topic.dlq[each.value].id
  project = var.project_id

  message_retention_duration = var.message_retention_duration

  expiration_policy {
    ttl = "" # never expires
  }
}

# Main topics
resource "google_pubsub_topic" "main" {
  for_each = toset(var.topic_names)

  name    = "${each.value}-${var.environment}"
  project = var.project_id

  message_retention_duration = var.message_retention_duration
}

# Main subscriptions with dead-letter policy
resource "google_pubsub_subscription" "main" {
  for_each = toset(var.topic_names)

  name    = "${each.value}-${var.environment}-sub"
  topic   = google_pubsub_topic.main[each.value].id
  project = var.project_id

  message_retention_duration = var.message_retention_duration
  ack_deadline_seconds       = 20

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dlq[each.value].id
    max_delivery_attempts = var.max_delivery_attempts
  }

  expiration_policy {
    ttl = "" # never expires
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}
