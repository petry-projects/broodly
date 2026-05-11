import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ConfidenceDowngradeNotice } from './index';

describe('ConfidenceDowngradeNotice', () => {
  it('renders nothing when no stale sources', () => {
    render(<ConfidenceDowngradeNotice staleSources={[]} />);
    expect(screen.queryByText(/outdated/)).toBeNull();
  });

  it('renders downgrade notice for single stale source', () => {
    render(
      <ConfidenceDowngradeNotice
        staleSources={[
          { source: 'weather', dataUpdatedAt: new Date() },
        ]}
      />
    );
    expect(screen.getByText(/weather data is outdated/)).toBeTruthy();
  });

  it('renders downgrade notice for multiple stale sources', () => {
    render(
      <ConfidenceDowngradeNotice
        staleSources={[
          { source: 'weather', dataUpdatedAt: new Date() },
          { source: 'flora', dataUpdatedAt: new Date() },
        ]}
      />
    );
    expect(
      screen.getByText(/weather data and flora data are outdated/)
    ).toBeTruthy();
  });

  it('has accessibility label', () => {
    render(
      <ConfidenceDowngradeNotice
        staleSources={[
          { source: 'weather', dataUpdatedAt: new Date() },
        ]}
      />
    );
    expect(
      screen.getByLabelText(/Recommendation confidence is reduced/)
    ).toBeTruthy();
  });
});
