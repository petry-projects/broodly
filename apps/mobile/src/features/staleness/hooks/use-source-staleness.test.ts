import { renderHook } from '@testing-library/react-native';
import { useSourceStaleness } from './use-source-staleness';

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

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

describe('useSourceStaleness', () => {
  describe('weather source (24h threshold)', () => {
    it('returns fresh for data under 24h old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('weather', msAgo(12 * ONE_HOUR))
      );
      expect(result.current.level).toBe('fresh');
      expect(result.current.isStale).toBe(false);
    });

    it('returns warning for data 24-48h old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('weather', msAgo(30 * ONE_HOUR))
      );
      expect(result.current.level).toBe('warning');
      expect(result.current.isStale).toBe(true);
    });

    it('returns critical for data over 48h old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('weather', msAgo(50 * ONE_HOUR))
      );
      expect(result.current.level).toBe('critical');
      expect(result.current.isStale).toBe(true);
    });
  });

  describe('flora source (7d threshold)', () => {
    it('returns fresh for data under 7 days old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('flora', msAgo(5 * ONE_DAY))
      );
      expect(result.current.level).toBe('fresh');
      expect(result.current.isStale).toBe(false);
    });

    it('returns warning for data 7-14 days old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('flora', msAgo(10 * ONE_DAY))
      );
      expect(result.current.level).toBe('warning');
      expect(result.current.isStale).toBe(true);
    });

    it('returns critical for data over 14 days old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('flora', msAgo(15 * ONE_DAY))
      );
      expect(result.current.level).toBe('critical');
      expect(result.current.isStale).toBe(true);
    });
  });

  describe('telemetry source (1h threshold)', () => {
    it('returns fresh for data under 1 hour old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('telemetry', msAgo(30 * 60 * 1000))
      );
      expect(result.current.level).toBe('fresh');
      expect(result.current.isStale).toBe(false);
    });

    it('returns warning for data 1-2h old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('telemetry', msAgo(90 * 60 * 1000))
      );
      expect(result.current.level).toBe('warning');
      expect(result.current.isStale).toBe(true);
    });

    it('returns critical for data over 2h old', () => {
      const { result } = renderHook(() =>
        useSourceStaleness('telemetry', msAgo(3 * ONE_HOUR))
      );
      expect(result.current.level).toBe('critical');
      expect(result.current.isStale).toBe(true);
    });
  });

  describe('undefined dataUpdatedAt', () => {
    it('returns fresh for undefined across all sources', () => {
      for (const source of ['weather', 'flora', 'telemetry'] as const) {
        const { result } = renderHook(() =>
          useSourceStaleness(source, undefined)
        );
        expect(result.current.level).toBe('fresh');
        expect(result.current.isStale).toBe(false);
      }
    });
  });
});
