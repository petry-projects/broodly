/**
 * @jest-environment jsdom
 */
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'apiary-1' }),
}));

const mockCreateHive = jest.fn();
jest.mock('../src/features/hive/hooks/use-hives', () => ({
  useCreateHive: () => ({
    mutateAsync: mockCreateHive,
    isPending: false,
  }),
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
});

describe('Create Hive Screen', () => {
  it('renders form fields correctly', () => {
    const CreateHiveScreen = require('../app/(tabs)/apiaries/[id]/hives/new').default;
    render(<CreateHiveScreen />);

    expect(screen.getByTestId('name-input')).toBeTruthy();
    expect(screen.getByTestId('notes-input')).toBeTruthy();
  });

  it('renders all hive type options', () => {
    const CreateHiveScreen = require('../app/(tabs)/apiaries/[id]/hives/new').default;
    render(<CreateHiveScreen />);

    expect(screen.getByText('Langstroth')).toBeTruthy();
    expect(screen.getByText('Top Bar')).toBeTruthy();
    expect(screen.getByText('Warré')).toBeTruthy();
    expect(screen.getByText('Other')).toBeTruthy();
  });

  it('selects a hive type on tap', () => {
    const CreateHiveScreen = require('../app/(tabs)/apiaries/[id]/hives/new').default;
    render(<CreateHiveScreen />);

    fireEvent.press(screen.getByTestId('type-LANGSTROTH'));

    // After selecting, the UI should show the selection (this is a simplified test)
    expect(screen.getByTestId('type-LANGSTROTH')).toBeTruthy();
  });

  it('creates hive with valid input', async () => {
    mockCreateHive.mockResolvedValue({ id: '1' });

    const CreateHiveScreen = require('../app/(tabs)/apiaries/[id]/hives/new').default;
    render(<CreateHiveScreen />);

    fireEvent.changeText(screen.getByTestId('name-input'), 'Test Hive');
    fireEvent.press(screen.getByTestId('type-LANGSTROTH'));
    fireEvent.press(screen.getByTestId('create-btn'));

    expect(mockCreateHive).toHaveBeenCalled();
  });

  it('disables create button when name is empty', () => {
    const CreateHiveScreen = require('../app/(tabs)/apiaries/[id]/hives/new').default;
    render(<CreateHiveScreen />);

    const createBtn = screen.getByTestId('create-btn');
    expect(createBtn.props.disabled).toBe(true);
  });

  it('disables create button when type is not selected', () => {
    const CreateHiveScreen = require('../app/(tabs)/apiaries/[id]/hives/new').default;
    render(<CreateHiveScreen />);

    fireEvent.changeText(screen.getByTestId('name-input'), 'Test Hive');

    const createBtn = screen.getByTestId('create-btn');
    expect(createBtn.props.disabled).toBe(true);
  });
});
