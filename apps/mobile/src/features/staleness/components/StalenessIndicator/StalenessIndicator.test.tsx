import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StalenessIndicator } from './index';

const now = new Date('2026-03-29T12:00:00Z');

function hoursAgo(hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

// Override Date.now for consistent tests
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(now);
});
afterAll(() => {
  jest.useRealTimers();
});

describe('StalenessIndicator', () => {
  it('renders nothing for fresh data', () => {
    render(<StalenessIndicator dataUpdatedAt={now} />);
    expect(screen.queryByText(/Updated/)).toBeNull();
    expect(screen.queryByText(/outdated/)).toBeNull();
  });

  it('renders subtle text for data 2 hours old', () => {
    render(<StalenessIndicator dataUpdatedAt={hoursAgo(2)} />);
    expect(screen.getByText(/Updated 2h ago/)).toBeTruthy();
  });

  it('renders warning badge for data 36 hours old', () => {
    render(<StalenessIndicator dataUpdatedAt={hoursAgo(36)} />);
    expect(screen.getByText(/Data is 1 day ago old/)).toBeTruthy();
  });

  it('renders critical alert for data 80 hours old', () => {
    render(<StalenessIndicator dataUpdatedAt={hoursAgo(80)} />);
    expect(screen.getByText(/Data may be significantly outdated/)).toBeTruthy();
  });

  it('has accessibility label for subtle tier', () => {
    render(<StalenessIndicator dataUpdatedAt={hoursAgo(2)} />);
    expect(screen.getByLabelText(/Data last updated 2h ago/)).toBeTruthy();
  });

  it('has accessibility label for warning tier', () => {
    render(<StalenessIndicator dataUpdatedAt={hoursAgo(36)} />);
    expect(screen.getByLabelText(/Warning: data is/)).toBeTruthy();
  });

  it('has accessibility label for critical tier', () => {
    render(<StalenessIndicator dataUpdatedAt={hoursAgo(80)} />);
    expect(screen.getByLabelText(/Data may be significantly outdated/)).toBeTruthy();
  });
});
