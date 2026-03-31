import { renderHook } from '@testing-library/react-native';
import { useStaleness } from './use-staleness';

const now = new Date('2026-03-29T12:00:00Z');

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(now);
});
afterAll(() => {
  jest.useRealTimers();
});

function msAgo(ms: number): number {
  return now.getTime() - ms;
}

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

describe('useStaleness', () => {
  it('returns fresh for recently updated data (< 5 min)', () => {
    const { result } = renderHook(() => useStaleness(msAgo(2 * ONE_MINUTE)));
    expect(result.current.level).toBe('fresh');
    expect(result.current.isStale).toBe(false);
    expect(result.current.label).toBe('Just now');
  });

  it('returns subtle for data under 24 hours old', () => {
    const { result } = renderHook(() => useStaleness(msAgo(6 * ONE_HOUR)));
    expect(result.current.level).toBe('subtle');
    expect(result.current.isStale).toBe(true);
    expect(result.current.label).toBe('6h ago');
  });

  it('returns warning for 24-72h old data', () => {
    const { result } = renderHook(() => useStaleness(msAgo(36 * ONE_HOUR)));
    expect(result.current.level).toBe('warning');
    expect(result.current.isStale).toBe(true);
    expect(result.current.label).toBe('1 day ago');
  });

  it('returns critical for > 72h old data', () => {
    const { result } = renderHook(() => useStaleness(msAgo(80 * ONE_HOUR)));
    expect(result.current.level).toBe('critical');
    expect(result.current.isStale).toBe(true);
    expect(result.current.label).toBe('3 days ago');
  });

  it('returns correct label for minutes-old data', () => {
    const { result } = renderHook(() => useStaleness(msAgo(30 * ONE_MINUTE)));
    expect(result.current.label).toBe('30m ago');
  });

  it('handles undefined dataUpdatedAt gracefully', () => {
    const { result } = renderHook(() => useStaleness(undefined));
    expect(result.current.level).toBe('fresh');
    expect(result.current.isStale).toBe(false);
    expect(result.current.label).toBe('');
  });

  it('handles 0 dataUpdatedAt as falsy', () => {
    const { result } = renderHook(() => useStaleness(0));
    expect(result.current.level).toBe('fresh');
    expect(result.current.isStale).toBe(false);
    expect(result.current.label).toBe('');
  });
});
