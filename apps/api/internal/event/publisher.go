package event

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// EventPublisher publishes domain events.
type EventPublisher interface {
	Publish(ctx context.Context, topic string, event Event) error
}

// Event is the standard envelope for all domain events.
type Event struct {
	EventID        string         `json:"eventId"`
	EventType      string         `json:"eventType"`
	OccurredAt     time.Time      `json:"occurredAt"`
	TenantID       string         `json:"tenantId"`
	PayloadVersion int            `json:"payloadVersion"`
	Payload        map[string]any `json:"payload"`
}

// NewEvent creates a new event with a generated ID and current timestamp.
func NewEvent(eventType, tenantID string, payload map[string]any) Event {
	return Event{
		EventID:        uuid.New().String(),
		EventType:      eventType,
		OccurredAt:     time.Now().UTC(),
		TenantID:       tenantID,
		PayloadVersion: 1,
		Payload:        payload,
	}
}

// JSON returns the event serialized as JSON bytes.
func (e Event) JSON() ([]byte, error) {
	return json.Marshal(e)
}

// NoOpPublisher is a publisher that does nothing (for use before Pub/Sub is configured).
type NoOpPublisher struct{}

func (n *NoOpPublisher) Publish(ctx context.Context, topic string, event Event) error {
	return nil
}
