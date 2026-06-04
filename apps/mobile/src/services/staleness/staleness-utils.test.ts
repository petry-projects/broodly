import { getStalenessLevel, getRelativeTimeLabel } from './staleness-utils';

const now = new Date('2026-03-29T12:00:00Z');

function hoursAgo(hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

function minutesAgo(minutes: number): Date {
  return new Date(now.getTime() - minutes * 60 * 1000);
}

describe('getStalenessLevel', () => {
  it('returns fresh for data less than 5 minutes old', () => {
    expect(getStalenessLevel(minutesAgo(2), now)).toBe('fresh');
  });

  it('returns subtle for data 2 hours old', () => {
    expect(getStalenessLevel(hoursAgo(2), now)).toBe('subtle');
  });

  it('returns subtle for data 23 hours old', () => {
    expect(getStalenessLevel(hoursAgo(23), now)).toBe('subtle');
  });

  it('returns warning for data 36 hours old', () => {
    expect(getStalenessLevel(hoursAgo(36), now)).toBe('warning');
  });

  it('returns warning for data 71 hours old', () => {
    expect(getStalenessLevel(hoursAgo(71), now)).toBe('warning');
  });

  it('returns critical for data 80 hours old', () => {
    expect(getStalenessLevel(hoursAgo(80), now)).toBe('critical');
  });

  it('returns critical for data 7 days old', () => {
    expect(getStalenessLevel(hoursAgo(168), now)).toBe('critical');
  });

  it('returns fresh for data just now', () => {
    expect(getStalenessLevel(now, now)).toBe('fresh');
  });
});

describe('getRelativeTimeLabel', () => {
  it('returns "Just now" for recent data', () => {
    expect(getRelativeTimeLabel(minutesAgo(2), now)).toBe('Just now');
  });

  it('returns minutes for data under an hour', () => {
    expect(getRelativeTimeLabel(minutesAgo(30), now)).toBe('30m ago');
  });

  it('returns hours for data under a day', () => {
    expect(getRelativeTimeLabel(hoursAgo(2), now)).toBe('2h ago');
  });

  it('returns "1 day ago" for 24+ hours', () => {
    expect(getRelativeTimeLabel(hoursAgo(30), now)).toBe('1 day ago');
  });

  it('returns days for older data', () => {
    expect(getRelativeTimeLabel(hoursAgo(72), now)).toBe('3 days ago');
  });
});
