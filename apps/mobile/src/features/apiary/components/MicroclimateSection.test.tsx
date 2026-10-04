import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MicroclimateSection } from './MicroclimateSection';

describe('MicroclimateSection', () => {
  const defaultProps = {
    elevationOffset: 0,
    onElevationChange: jest.fn(),
    bloomOffset: 0,
    onBloomChange: jest.fn(),
  };

  it('renders elevation and bloom offset fields', () => {
    render(<MicroclimateSection {...defaultProps} />);
    expect(screen.getByTestId('elevation-input')).toBeTruthy();
    expect(screen.getByTestId('bloom-input')).toBeTruthy();
  });

  it('shows season shift preview for +200m elevation', () => {
    render(<MicroclimateSection {...defaultProps} elevationOffset={200} />);
    expect(screen.getByText(/1 week later bloom/)).toBeTruthy();
  });

  it('shows no shift for 0 elevation', () => {
    render(<MicroclimateSection {...defaultProps} elevationOffset={0} />);
    expect(screen.getByText('No shift')).toBeTruthy();
  });

  it('shows region change info alert when isNewRegion is true', () => {
    render(<MicroclimateSection {...defaultProps} isNewRegion={true} />);
    expect(screen.getByText(/different region/)).toBeTruthy();
  });

  it('does not show region alert when isNewRegion is false', () => {
    render(<MicroclimateSection {...defaultProps} isNewRegion={false} />);
    expect(screen.queryByText(/different region/)).toBeNull();
  });

  it('has accessible labels on all fields', () => {
    render(<MicroclimateSection {...defaultProps} />);
    expect(screen.getByLabelText(/elevation offset/i)).toBeTruthy();
    expect(screen.getByLabelText(/bloom timing offset/i)).toBeTruthy();
  });
});
