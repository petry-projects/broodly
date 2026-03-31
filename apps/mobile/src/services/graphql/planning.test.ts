import {
  WEEKLY_QUEUE_QUERY,
  HOMEPAGE_CONTEXT_QUERY,
  COMPLETE_TASK_MUTATION,
  DEFER_TASK_MUTATION,
  DISMISS_TASK_MUTATION,
  SEASONAL_CALENDAR_QUERY,
} from './planning';

function queryString(doc: { loc?: { source?: { body?: string } } }): string {
  return doc.loc?.source?.body ?? '';
}

describe('GraphQL planning operations', () => {
  describe('WEEKLY_QUEUE_QUERY', () => {
    it('is a query operation', () => {
      expect(queryString(WEEKLY_QUEUE_QUERY)).toMatch(/query\s+WeeklyQueue/);
    });

    it('requests task fields', () => {
      const q = queryString(WEEKLY_QUEUE_QUERY);
      expect(q).toContain('apiaryId');
      expect(q).toContain('apiaryName');
      expect(q).toContain('tasks');
      expect(q).toContain('title');
      expect(q).toContain('priority');
      expect(q).toContain('dueDate');
      expect(q).toContain('isOverdue');
    });
  });

  describe('HOMEPAGE_CONTEXT_QUERY', () => {
    it('is a query', () => {
      expect(queryString(HOMEPAGE_CONTEXT_QUERY)).toMatch(/query\s+HomepageContext/);
    });

    it('requests weather, bloom, and seasonal data', () => {
      const q = queryString(HOMEPAGE_CONTEXT_QUERY);
      expect(q).toContain('weather');
      expect(q).toContain('bloomStatus');
      expect(q).toContain('seasonalPhase');
    });
  });

  describe('COMPLETE_TASK_MUTATION', () => {
    it('is a mutation accepting id', () => {
      const q = queryString(COMPLETE_TASK_MUTATION);
      expect(q).toMatch(/mutation\s+CompleteTask/);
      expect(q).toContain('$id: UUID!');
    });
  });

  describe('DEFER_TASK_MUTATION', () => {
    it('is a mutation accepting id, reason, and newDueDate', () => {
      const q = queryString(DEFER_TASK_MUTATION);
      expect(q).toMatch(/mutation\s+DeferTask/);
      expect(q).toContain('$id: UUID!');
      expect(q).toContain('$reason: String');
      expect(q).toContain('$newDueDate: DateTime!');
    });
  });

  describe('DISMISS_TASK_MUTATION', () => {
    it('is a mutation accepting id and optional reason', () => {
      const q = queryString(DISMISS_TASK_MUTATION);
      expect(q).toMatch(/mutation\s+DismissTask/);
      expect(q).toContain('$id: UUID!');
      expect(q).toContain('$reason: String');
    });
  });

  describe('SEASONAL_CALENDAR_QUERY', () => {
    it('is a query accepting region', () => {
      const q = queryString(SEASONAL_CALENDAR_QUERY);
      expect(q).toMatch(/query\s+SeasonalCalendar/);
      expect(q).toContain('$region: String!');
    });

    it('requests month and activity data', () => {
      const q = queryString(SEASONAL_CALENDAR_QUERY);
      expect(q).toContain('months');
      expect(q).toContain('activities');
      expect(q).toContain('riskWindows');
    });
  });
});
