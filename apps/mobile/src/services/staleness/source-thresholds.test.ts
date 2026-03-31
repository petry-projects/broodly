import { getSourceStalenessLevel, getSourceThreshold } from './source-thresholds';

const now = new Date('2026-03-29T12:00:00Z');

function hoursAgo(hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

describe('getSourceStalenessLevel', () => {
  describe('weather (24h threshold)', () => {
    it('returns fresh for weather 23h old', () => {
      expect(getSourceStalenessLevel('weather', hoursAgo(23), now)).toBe('fresh');
    });

    it('returns warning for weather 25h old', () => {
      expect(getSourceStalenessLevel('weather', hoursAgo(25), now)).toBe('warning');
    });

    it('returns critical for weather 49h old', () => {
      expect(getSourceStalenessLevel('weather', hoursAgo(49), now)).toBe('critical');
    });
  });

  describe('flora (7 day threshold)', () => {
    it('returns fresh for flora 6 days old', () => {
      expect(getSourceStalenessLevel('flora', daysAgo(6), now)).toBe('fresh');
    });

    it('returns warning for flora 8 days old', () => {
      expect(getSourceStalenessLevel('flora', daysAgo(8), now)).toBe('warning');
    });

    it('returns critical for flora 15 days old', () => {
      expect(getSourceStalenessLevel('flora', daysAgo(15), now)).toBe('critical');
    });
  });

  describe('telemetry (1h threshold)', () => {
    it('returns fresh for telemetry 30min old', () => {
      const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
      expect(getSourceStalenessLevel('telemetry', thirtyMinAgo, now)).toBe('fresh');
    });

    it('returns warning for telemetry 90min old', () => {
      const ninetyMinAgo = new Date(now.getTime() - 90 * 60 * 1000);
      expect(getSourceStalenessLevel('telemetry', ninetyMinAgo, now)).toBe('warning');
    });

    it('returns critical for telemetry 3h old', () => {
      expect(getSourceStalenessLevel('telemetry', hoursAgo(3), now)).toBe('critical');
    });
  });
});

describe('getSourceThreshold', () => {
  it('returns 24h for weather', () => {
    expect(getSourceThreshold('weather')).toBe(24 * 60 * 60 * 1000);
  });

  it('returns 7d for flora', () => {
    expect(getSourceThreshold('flora')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('returns 1h for telemetry', () => {
    expect(getSourceThreshold('telemetry')).toBe(60 * 60 * 1000);
  });
});
