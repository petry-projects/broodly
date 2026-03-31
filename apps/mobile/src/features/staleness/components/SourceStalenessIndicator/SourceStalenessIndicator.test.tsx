import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SourceStalenessIndicator } from './index';

const now = new Date('2026-03-29T12:00:00Z');

function hoursAgo(hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(now);
});
afterAll(() => {
  jest.useRealTimers();
});

describe('SourceStalenessIndicator', () => {
  describe('fresh data renders nothing', () => {
    it('renders nothing for fresh weather data (< 24h)', () => {
      render(
        <SourceStalenessIndicator source="weather" dataUpdatedAt={hoursAgo(12)} />
      );
      expect(screen.queryByText(/outdated/)).toBeNull();
    });

    it('renders nothing for fresh flora data (< 7d)', () => {
      render(
        <SourceStalenessIndicator source="flora" dataUpdatedAt={daysAgo(3)} />
      );
      expect(screen.queryByText(/outdated/)).toBeNull();
    });

    it('renders nothing for fresh telemetry data (< 1h)', () => {
      render(
        <SourceStalenessIndicator
          source="telemetry"
          dataUpdatedAt={hoursAgo(0.5)}
        />
      );
      expect(screen.queryByText(/outdated/)).toBeNull();
    });
  });

  describe('stale data (warning tier)', () => {
    it('shows warning text for stale weather data', () => {
      render(
        <SourceStalenessIndicator source="weather" dataUpdatedAt={hoursAgo(30)} />
      );
      expect(screen.getByText(/Weather data outdated/)).toBeTruthy();
    });

    it('shows warning text for stale flora data', () => {
      render(
        <SourceStalenessIndicator source="flora" dataUpdatedAt={daysAgo(10)} />
      );
      expect(screen.getByText(/Flora data outdated/)).toBeTruthy();
    });

    it('shows warning text for stale telemetry data', () => {
      render(
        <SourceStalenessIndicator
          source="telemetry"
          dataUpdatedAt={hoursAgo(1.5)}
        />
      );
      expect(screen.getByText(/Telemetry data outdated/)).toBeTruthy();
    });
  });

  describe('critical staleness', () => {
    it('shows critical indicator for very old weather data', () => {
      render(
        <SourceStalenessIndicator source="weather" dataUpdatedAt={hoursAgo(50)} />
      );
      expect(screen.getByText(/Weather data outdated/)).toBeTruthy();
    });

    it('shows critical indicator for very old telemetry data', () => {
      render(
        <SourceStalenessIndicator
          source="telemetry"
          dataUpdatedAt={hoursAgo(5)}
        />
      );
      expect(screen.getByText(/Telemetry data outdated/)).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('includes accessibility label with source name and time', () => {
      render(
        <SourceStalenessIndicator source="weather" dataUpdatedAt={hoursAgo(30)} />
      );
      expect(
        screen.getByLabelText(/Weather data is outdated/)
      ).toBeTruthy();
    });

    it('includes accessibility label for critical flora data', () => {
      render(
        <SourceStalenessIndicator source="flora" dataUpdatedAt={daysAgo(15)} />
      );
      expect(
        screen.getByLabelText(/Flora data is outdated/)
      ).toBeTruthy();
    });
  });
});
