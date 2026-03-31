import {
  formatTimeSinceInspection,
  buildTransitionAnnouncement,
  buildHiveTransitionContext,
  summarizeHiveObservations,
} from './hive-transition';
import type { SessionHive } from '../../../store/multi-hive-session-store';
import type { Observation } from '../types';

function makeHive(overrides: Partial<SessionHive> = {}): SessionHive {
  return {
    hiveId: 'h1',
    hiveName: 'Hive Alpha',
    orderIndex: 0,
    status: 'in_progress',
    observations: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    ...overrides,
  };
}

function makeObservation(overrides: Partial<Observation> = {}): Observation {
  return {
    id: 'obs-1',
    promptId: 'entrance',
    observationType: 'entrance_assessment',
    value: 'normal',
    classification: 'normal',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('formatTimeSinceInspection', () => {
  it('returns null for undefined date', () => {
    expect(formatTimeSinceInspection(undefined)).toBeNull();
  });

  it('returns "Inspected today" for today', () => {
    const today = new Date().toISOString();
    expect(formatTimeSinceInspection(today)).toBe('Inspected today');
  });

  it('returns "Inspected yesterday" for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString();
    expect(formatTimeSinceInspection(yesterday)).toBe('Inspected yesterday');
  });

  it('returns days ago for 2-6 days', () => {
    const threeDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString();
    expect(formatTimeSinceInspection(threeDaysAgo)).toBe('Inspected 3 days ago');
  });

  it('returns "Inspected last week" for 7-13 days', () => {
    const tenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString();
    expect(formatTimeSinceInspection(tenDaysAgo)).toBe('Inspected last week');
  });

  it('returns weeks ago for 14-29 days', () => {
    const threeWeeksAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString();
    expect(formatTimeSinceInspection(threeWeeksAgo)).toBe('Inspected 3 weeks ago');
  });

  it('returns "Inspected last month" for 30-59 days', () => {
    const sixWeeksAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString();
    expect(formatTimeSinceInspection(sixWeeksAgo)).toBe('Inspected last month');
  });

  it('returns months ago for 60+ days', () => {
    const threeMonthsAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString();
    expect(formatTimeSinceInspection(threeMonthsAgo)).toBe('Inspected 3 months ago');
  });
});

describe('buildTransitionAnnouncement', () => {
  it('includes hive name and position', () => {
    const hive = makeHive({ hiveName: 'Hive Beta', orderIndex: 1 });
    const announcement = buildTransitionAnnouncement(hive, 5);
    expect(announcement).toContain('Now at Hive Beta, hive 2 of 5.');
  });

  it('includes health status when available', () => {
    const hive = makeHive({ lastHealthStatus: 'healthy' });
    const announcement = buildTransitionAnnouncement(hive, 3);
    expect(announcement).toContain('Last status: healthy.');
  });

  it('includes last inspection date when available', () => {
    const hive = makeHive({
      lastInspectionDate: new Date().toISOString(),
    });
    const announcement = buildTransitionAnnouncement(hive, 3);
    expect(announcement).toContain('Inspected today.');
  });

  it('includes observation count when observations exist', () => {
    const hive = makeHive({
      observations: [makeObservation(), makeObservation({ id: 'obs-2' })],
    });
    const announcement = buildTransitionAnnouncement(hive, 3);
    expect(announcement).toContain('2 observations already recorded.');
  });

  it('uses singular for one observation', () => {
    const hive = makeHive({
      observations: [makeObservation()],
    });
    const announcement = buildTransitionAnnouncement(hive, 3);
    expect(announcement).toContain('1 observation already recorded.');
  });
});

describe('buildHiveTransitionContext', () => {
  it('returns complete context object', () => {
    const hive = makeHive({
      hiveName: 'Hive Gamma',
      orderIndex: 2,
      lastHealthStatus: 'attention',
      observations: [makeObservation()],
    });

    const context = buildHiveTransitionContext(hive, 5);

    expect(context.hiveName).toBe('Hive Gamma');
    expect(context.positionLabel).toBe('3 of 5');
    expect(context.lastHealthStatus).toBe('attention');
    expect(context.existingObservationCount).toBe(1);
    expect(context.ttsAnnouncement).toBeTruthy();
  });

  it('returns null for missing optional fields', () => {
    const hive = makeHive();
    const context = buildHiveTransitionContext(hive, 1);

    expect(context.lastHealthStatus).toBeNull();
    expect(context.lastInspectionSummary).toBeNull();
  });
});

describe('summarizeHiveObservations', () => {
  it('returns message for no observations', () => {
    const hive = makeHive();
    expect(summarizeHiveObservations(hive)).toBe('No observations recorded yet.');
  });

  it('counts observations by classification', () => {
    const hive = makeHive({
      observations: [
        makeObservation({ id: '1', classification: 'normal' }),
        makeObservation({ id: '2', classification: 'normal' }),
        makeObservation({ id: '3', classification: 'cautionary' }),
        makeObservation({ id: '4', classification: 'urgent' }),
      ],
    });

    const summary = summarizeHiveObservations(hive);
    expect(summary).toContain('4 total observations.');
    expect(summary).toContain('1 urgent.');
    expect(summary).toContain('1 cautionary.');
    expect(summary).toContain('2 normal.');
  });
});
