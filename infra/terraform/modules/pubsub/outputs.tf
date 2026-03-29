output "topic_names" {
  description = "Map of base topic name to full topic name"
  value       = { for k, v in google_pubsub_topic.main : k => v.name }
}

output "topic_ids" {
  description = "Map of base topic name to full topic ID"
  value       = { for k, v in google_pubsub_topic.main : k => v.id }
}

output "subscription_names" {
  description = "Map of base topic name to subscription name"
  value       = { for k, v in google_pubsub_subscription.main : k => v.name }
}

output "dlq_topic_names" {
  description = "Map of base topic name to DLQ topic name"
  value       = { for k, v in google_pubsub_topic.dlq : k => v.name }
}
