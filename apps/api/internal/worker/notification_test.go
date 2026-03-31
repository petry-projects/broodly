package worker

import (
	"context"
	"testing"
	"time"
)

func TestNotificationDispatcher(t *testing.T) {
	d := NewNotificationDispatcher()

	t.Run("dispatches valid notification", func(t *testing.T) {
		event := NotificationEvent{
			UserID: "user-1",
			Title:  "Check Hive 3",
			Body:   "Varroa treatment due",
			Priority: NotificationPriorityHigh,
		}
		err := d.Dispatch(context.Background(), event)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})

	t.Run("rejects missing userID", func(t *testing.T) {
		event := NotificationEvent{Title: "Test"}
		err := d.Dispatch(context.Background(), event)
		if err == nil {
			t.Error("expected error for missing userID")
		}
	})

	t.Run("rejects missing title", func(t *testing.T) {
		event := NotificationEvent{UserID: "user-1"}
		err := d.Dispatch(context.Background(), event)
		if err == nil {
			t.Error("expected error for missing title")
		}
	})
}

func TestShouldSuppress(t *testing.T) {
	d := NewNotificationDispatcher()

	t.Run("suppresses when notifications disabled", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityNormal}
		prefs := NotificationPreferences{Enabled: false}
		if !d.ShouldSuppress(event, prefs, time.Now()) {
			t.Error("expected suppression when disabled")
		}
	})

	t.Run("does not suppress high priority even when disabled", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityHigh}
		prefs := NotificationPreferences{Enabled: false}
		if d.ShouldSuppress(event, prefs, time.Now()) {
			t.Error("high priority should never be suppressed")
		}
	})

	t.Run("suppresses during quiet hours", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityNormal}
		prefs := NotificationPreferences{
			Enabled:         true,
			QuietHoursStart: "22",
			QuietHoursEnd:   "7",
		}
		midnight := time.Date(2026, 3, 29, 0, 0, 0, 0, time.UTC)
		if !d.ShouldSuppress(event, prefs, midnight) {
			t.Error("expected suppression at midnight during quiet hours 22-7")
		}
	})

	t.Run("does not suppress outside quiet hours", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityNormal}
		prefs := NotificationPreferences{
			Enabled:         true,
			QuietHoursStart: "22",
			QuietHoursEnd:   "7",
		}
		noon := time.Date(2026, 3, 29, 12, 0, 0, 0, time.UTC)
		if d.ShouldSuppress(event, prefs, noon) {
			t.Error("should not suppress at noon")
		}
	})

	t.Run("high priority bypasses quiet hours", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityHigh}
		prefs := NotificationPreferences{
			Enabled:         true,
			QuietHoursStart: "22",
			QuietHoursEnd:   "7",
		}
		midnight := time.Date(2026, 3, 29, 0, 0, 0, 0, time.UTC)
		if d.ShouldSuppress(event, prefs, midnight) {
			t.Error("high priority should bypass quiet hours")
		}
	})
}

func TestShouldEscalate(t *testing.T) {
	d := NewNotificationDispatcher()

	t.Run("escalates high priority after 2 hours", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityHigh}
		prefs := NotificationPreferences{EscalationEnabled: true}
		if !d.ShouldEscalate(event, prefs, 3*time.Hour) {
			t.Error("expected escalation after 3 hours for high priority")
		}
	})

	t.Run("does not escalate high priority within 2 hours", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityHigh}
		prefs := NotificationPreferences{EscalationEnabled: true}
		if d.ShouldEscalate(event, prefs, 1*time.Hour) {
			t.Error("should not escalate within 2 hours")
		}
	})

	t.Run("does not escalate when disabled", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityHigh}
		prefs := NotificationPreferences{EscalationEnabled: false}
		if d.ShouldEscalate(event, prefs, 5*time.Hour) {
			t.Error("should not escalate when disabled")
		}
	})

	t.Run("escalates normal priority after 24 hours", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityNormal}
		prefs := NotificationPreferences{EscalationEnabled: true}
		if !d.ShouldEscalate(event, prefs, 25*time.Hour) {
			t.Error("expected escalation after 25 hours for normal priority")
		}
	})

	t.Run("never escalates low priority", func(t *testing.T) {
		event := NotificationEvent{Priority: NotificationPriorityLow}
		prefs := NotificationPreferences{EscalationEnabled: true}
		if d.ShouldEscalate(event, prefs, 72*time.Hour) {
			t.Error("low priority should never escalate")
		}
	})
}
