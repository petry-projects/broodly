/**
 * @jest-environment jsdom
 */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

// Mock TanStack Query hooks
const mockUseApiaries = jest.fn();
jest.mock('../src/features/apiary/hooks/use-apiaries', () => ({
  useApiaries: () => mockUseApiaries(),
  useDeleteApiary: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../components/ui/heading', () => {
  const { Text } = require('react-native');
  return {
    Heading: (props: Record<string, unknown>) =>
      require('react').createElement(Text, props, props.children),
  };
});

jest.mock('../components/ui/text', () => {
  const { Text } = require('react-native');
  return {
    Text: (props: Record<string, unknown>) =>
      require('react').createElement(Text, props, props.children),
  };
});

jest.mock('../components/ui/button', () => {
  const { View, Text } = require('react-native');
  return {
    Button: (props: Record<string, unknown>) =>
      require('react').createElement(View, { ...props, accessible: true }, props.children),
    ButtonText: (props: Record<string, unknown>) =>
      require('react').createElement(Text, {}, props.children),
  };
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

beforeEach(() => {
  jest.clearAllMocks();
  mockUseApiaries.mockReturnValue({
    data: undefined,
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  });
});

describe('Apiary List Screen', () => {
  it('renders all apiaries with name and hive count', () => {
    mockUseApiaries.mockReturnValue({
      data: [
        { id: '1', name: 'Backyard', region: 'Oregon', hives: [{ status: 'ACTIVE' }, { status: 'ACTIVE' }], createdAt: '', updatedAt: '' },
        { id: '2', name: 'Mountain', region: 'Colorado', hives: [{ status: 'INACTIVE' }], createdAt: '', updatedAt: '' },
      ],
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const ApiariesScreen = require('../app/(tabs)/apiaries/index').default;
    render(<ApiariesScreen />);

    expect(screen.getByText('Backyard')).toBeTruthy();
    expect(screen.getByText('Mountain')).toBeTruthy();
    expect(screen.getByText(/2 hives/)).toBeTruthy();
    expect(screen.getByText(/1 hive/)).toBeTruthy();
  });

  it('renders health status badges with correct labels', () => {
    mockUseApiaries.mockReturnValue({
      data: [
        { id: '1', name: 'Healthy Yard', region: 'OR', hives: [{ status: 'ACTIVE' }], createdAt: '', updatedAt: '' },
        { id: '2', name: 'Troubled Yard', region: 'CO', hives: [{ status: 'DEAD' }], createdAt: '', updatedAt: '' },
      ],
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const ApiariesScreen = require('../app/(tabs)/apiaries/index').default;
    render(<ApiariesScreen />);

    expect(screen.getByText('Healthy')).toBeTruthy();
    expect(screen.getByText('Critical')).toBeTruthy();
  });

  it('renders empty state with Add Apiary CTA when no apiaries', () => {
    mockUseApiaries.mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const ApiariesScreen = require('../app/(tabs)/apiaries/index').default;
    render(<ApiariesScreen />);

    expect(screen.getByText(/no apiaries/i)).toBeTruthy();
    expect(screen.getByTestId('add-apiary-btn')).toBeTruthy();
  });

  it('navigates to apiary detail on card tap', () => {
    mockUseApiaries.mockReturnValue({
      data: [
        { id: 'abc-123', name: 'Test Yard', region: 'OR', hives: [], createdAt: '', updatedAt: '' },
      ],
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const ApiariesScreen = require('../app/(tabs)/apiaries/index').default;
    render(<ApiariesScreen />);

    fireEvent.press(screen.getByTestId('apiary-card-abc-123'));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/apiaries/abc-123');
  });

  it('navigates to create apiary on add button tap', () => {
    mockUseApiaries.mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    const ApiariesScreen = require('../app/(tabs)/apiaries/index').default;
    render(<ApiariesScreen />);

    fireEvent.press(screen.getByTestId('add-apiary-btn'));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/apiaries/new');
  });
});
