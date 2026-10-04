/**
 * @jest-environment jsdom
 */
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'apiary-1', hiveId: 'hive-1' }),
}));

const mockUseHive = jest.fn();
jest.mock('../src/features/hive/hooks/use-hives', () => ({
  useHive: () => mockUseHive(),
  useUpdateHive: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useDeleteHive: () => ({ mutateAsync: jest.fn(), isPending: false }),
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
    ButtonSpinner: () => require('react').createElement(require('react-native').View, {}, 'Loading...'),
  };
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

beforeEach(() => {
  jest.clearAllMocks();
  mockUseHive.mockReturnValue({
    data: {
      id: 'hive-1',
      name: 'Test Hive',
      type: 'LANGSTROTH',
      status: 'ACTIVE',
      notes: 'Test notes',
      createdAt: '',
      updatedAt: '',
    },
    isLoading: false,
    isError: false,
  });
});

describe('Hive Detail Screen', () => {
  it('renders loading state', () => {
    mockUseHive.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    const HiveDetailScreen = require('../app/(tabs)/apiaries/[id]/hives/[hiveId]/index').default;
    render(<HiveDetailScreen />);

    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('renders hive details', () => {
    const HiveDetailScreen = require('../app/(tabs)/apiaries/[id]/hives/[hiveId]/index').default;
    render(<HiveDetailScreen />);

    expect(screen.getByText('Test Hive')).toBeTruthy();
    expect(screen.getByText('LANGSTROTH')).toBeTruthy();
  });

  it('navigates to edit screen on edit button tap', () => {
    const HiveDetailScreen = require('../app/(tabs)/apiaries/[id]/hives/[hiveId]/index').default;
    render(<HiveDetailScreen />);

    const editBtn = screen.getByTestId('edit-hive-btn');
    fireEvent.press(editBtn);

    expect(mockPush).toHaveBeenCalled();
  });

  it('renders error state when hive fails to load', () => {
    mockUseHive.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    const HiveDetailScreen = require('../app/(tabs)/apiaries/[id]/hives/[hiveId]/index').default;
    render(<HiveDetailScreen />);

    expect(screen.getByText(/failed/i)).toBeTruthy();
  });
});
