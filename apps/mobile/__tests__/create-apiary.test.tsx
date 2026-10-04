/**
 * @jest-environment jsdom
 */
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockBack, back: mockBack }),
  useLocalSearchParams: () => ({}),
}));

const mockUseApiaries = jest.fn();
const mockCreateApiary = jest.fn();
jest.mock('../src/features/apiary/hooks/use-apiaries', () => ({
  useApiaries: () => mockUseApiaries(),
  useCreateApiary: () => mockCreateApiary(),
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
    ButtonSpinner: () => require('react').createElement(Text, {}, 'Loading...'),
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

beforeEach(() => {
  jest.clearAllMocks();
  mockUseApiaries.mockReturnValue({
    data: [],
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  });
  mockCreateApiary.mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false,
  });
});

describe('Create Apiary Screen', () => {
  it('renders form with name and region inputs', () => {
    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    render(<CreateApiaryScreen />);

    expect(screen.getByTestId('name-input')).toBeTruthy();
    expect(screen.getByTestId('region-input')).toBeTruthy();
  });

  it('disables submit button when fields are empty', () => {
    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    render(<CreateApiaryScreen />);

    const submitBtn = screen.getByTestId('create-btn');
    expect(submitBtn.props.disabled).toBe(true);
  });

  it('enables submit button when both fields have values', () => {
    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    const { getByTestId } = render(<CreateApiaryScreen />);

    const nameInput = getByTestId('name-input');
    const regionInput = getByTestId('region-input');

    fireEvent.changeText(nameInput, 'Test Apiary');
    fireEvent.changeText(regionInput, 'Oregon');

    const submitBtn = getByTestId('create-btn');
    expect(submitBtn.props.disabled).toBe(false);
  });

  it('submits form with trimmed values', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockCreateApiary.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    const { getByTestId } = render(<CreateApiaryScreen />);

    fireEvent.changeText(getByTestId('name-input'), '  Test Apiary  ');
    fireEvent.changeText(getByTestId('region-input'), '  Oregon  ');
    fireEvent.press(getByTestId('create-btn'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        name: 'Test Apiary',
        region: 'Oregon',
      });
    });
  });

  it('navigates back after successful creation', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockCreateApiary.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    const { getByTestId } = render(<CreateApiaryScreen />);

    fireEvent.changeText(getByTestId('name-input'), 'Test Apiary');
    fireEvent.changeText(getByTestId('region-input'), 'Oregon');
    fireEvent.press(getByTestId('create-btn'));

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('shows error when at apiary limit', () => {
    const apiaries = Array(5).fill({ id: '1', name: 'Test' });
    mockUseApiaries.mockReturnValue({
      data: apiaries,
      isLoading: false,
    });

    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    render(<CreateApiaryScreen />);

    expect(screen.getByText(/maximum of 5/i)).toBeTruthy();
  });

  it('displays error message on mutation failure', async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error('Network error'));
    mockCreateApiary.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    const { getByTestId } = render(<CreateApiaryScreen />);

    fireEvent.changeText(getByTestId('name-input'), 'Test Apiary');
    fireEvent.changeText(getByTestId('region-input'), 'Oregon');
    fireEvent.press(getByTestId('create-btn'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('limits name input to 50 characters', () => {
    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    const { getByTestId } = render(<CreateApiaryScreen />);

    const nameInput = getByTestId('name-input');
    fireEvent.changeText(nameInput, 'a'.repeat(60));

    expect(nameInput.props.value).toHaveLength(50);
  });

  it('disables submit button while mutation is pending', () => {
    mockCreateApiary.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    const CreateApiaryScreen = require('../app/(tabs)/apiaries/new').default;
    const { getByTestId } = render(<CreateApiaryScreen />);

    fireEvent.changeText(getByTestId('name-input'), 'Test Apiary');
    fireEvent.changeText(getByTestId('region-input'), 'Oregon');

    const submitBtn = getByTestId('create-btn');
    expect(submitBtn.props.disabled).toBe(true);
  });
});
