import {
  NOTIFICATIONS_QUERY,
  MARK_NOTIFICATION_READ_MUTATION,
  UNREAD_COUNT_QUERY,
  UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
} from './notification';

function queryString(doc: { loc?: { source?: { body?: string } } }): string {
  return doc.loc?.source?.body ?? '';
}

describe('GraphQL notification operations', () => {
  describe('NOTIFICATIONS_QUERY', () => {
    it('is a query operation', () => {
      expect(queryString(NOTIFICATIONS_QUERY)).toMatch(/query\s+Notifications/);
    });

    it('accepts optional limit', () => {
      expect(queryString(NOTIFICATIONS_QUERY)).toContain('$limit: Int');
    });

    it('requests required fields', () => {
      const q = queryString(NOTIFICATIONS_QUERY);
      expect(q).toContain('id');
      expect(q).toContain('title');
      expect(q).toContain('body');
      expect(q).toContain('priority');
      expect(q).toContain('isRead');
    });
  });

  describe('MARK_NOTIFICATION_READ_MUTATION', () => {
    it('is a mutation accepting id', () => {
      const q = queryString(MARK_NOTIFICATION_READ_MUTATION);
      expect(q).toMatch(/mutation\s+MarkNotificationRead/);
      expect(q).toContain('$id: UUID!');
    });
  });

  describe('UNREAD_COUNT_QUERY', () => {
    it('is a query', () => {
      expect(queryString(UNREAD_COUNT_QUERY)).toMatch(/query\s+UnreadNotificationCount/);
    });
  });

  describe('UPDATE_NOTIFICATION_PREFERENCES_MUTATION', () => {
    it('is a mutation accepting input', () => {
      const q = queryString(UPDATE_NOTIFICATION_PREFERENCES_MUTATION);
      expect(q).toMatch(/mutation\s+UpdateNotificationPreferences/);
      expect(q).toContain('$input: NotificationPreferencesInput!');
    });

    it('returns preference fields', () => {
      const q = queryString(UPDATE_NOTIFICATION_PREFERENCES_MUTATION);
      expect(q).toContain('enabled');
      expect(q).toContain('quietHoursStart');
      expect(q).toContain('escalationEnabled');
    });
  });
});
