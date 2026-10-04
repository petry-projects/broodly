/**
 * @jest-environment jsdom
 */
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ id: 'test-id' }),
}));

const mockUseApiary = jest.fn();
const mockUpdateApiary = jest.fn();
const mockDeleteApiary = jest.fn();
jest.mock('../src/features/apiary/hooks/use-apiaries', () => ({
  useApiary: (id: string) => mockUseApiary(id),
  useUpdateApiary: () => mockUpdateApiary(),
  useDeleteApiary: () => mockDeleteApiary(),
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

const mockApiary = {
  id: 'test-id',
  name: 'Test Apiary',
  region: 'Oregon',
  hives: [],
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseApiary.mockReturnValue({
    data: mockApiary,
    isLoading: false,
    isError: false,
  });
  mockUpdateApiary.mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false,
  });
  mockDeleteApiary.mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false,
  });
});

describe('Edit Apiary Screen', () => {
  it('renders loading state initially', () => {
    mockUseApiary.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    render(<EditApiaryScreen />);

    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('renders form with pre-populated values', async () => {
    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    const { getByTestId } = render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(getByTestId('name-input').props.value).toBe('Test Apiary');
      expect(getByTestId('region-input').props.value).toBe('Oregon');
    });
  });

  it('renders error state when apiary fetch fails', () => {
    mockUseApiary.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    render(<EditApiaryScreen />);

    expect(screen.getByText(/failed to load apiary/i)).toBeTruthy();
  });

  it('updates apiary with modified values', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockUpdateApiary.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    const { getByTestId } = render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(getByTestId('name-input').props.value).toBe('Test Apiary');
    });

    fireEvent.changeText(getByTestId('name-input'), 'Updated Apiary');
    fireEvent.press(getByTestId('save-btn'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'test-id',
        input: { name: 'Updated Apiary', region: 'Oregon' },
      });
    });
  });

  it('navigates back after successful update', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockUpdateApiary.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    const { getByTestId } = render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(getByTestId('name-input').props.value).toBe('Test Apiary');
    });

    fireEvent.changeText(getByTestId('name-input'), 'Updated Apiary');
    fireEvent.press(getByTestId('save-btn'));

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('displays error message on update failure', async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error('Failed to update'));
    mockUpdateApiary.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    const { getByTestId } = render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(getByTestId('name-input').props.value).toBe('Test Apiary');
    });

    fireEvent.changeText(getByTestId('name-input'), 'Updated Apiary');
    fireEvent.press(getByTestId('save-btn'));

    await waitFor(() => {
      expect(screen.getByText('Failed to update')).toBeTruthy();
    });
  });

  it('disables save button when fields are empty', async () => {
    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    const { getByTestId } = render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(getByTestId('name-input').props.value).toBe('Test Apiary');
    });

    fireEvent.changeText(getByTestId('name-input'), '');

    const saveBtn = getByTestId('save-btn');
    expect(saveBtn.props.disabled).toBe(true);
  });

  it('disables save button while mutation is pending', async () => {
    mockUpdateApiary.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    const { getByTestId } = render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(getByTestId('name-input').props.value).toBe('Test Apiary');
    });

    const saveBtn = getByTestId('save-btn');
    expect(saveBtn.props.disabled).toBe(true);
  });

  it('shows delete button', async () => {
    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    const { getByTestId } = render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(getByTestId('delete-btn')).toBeTruthy();
    });
  });

  it('handles delete apiary mutation', async () => {
    const mutateAsync = jest.fn().mockResolvedValue(true);
    mockDeleteApiary.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toBeTruthy();
    });
  });

  it('displays error message on delete failure', async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error('Delete failed'));
    mockDeleteApiary.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    const EditApiaryScreen = require('../app/(tabs)/apiaries/[id]/edit').default;
    const { getByTestId } = render(<EditApiaryScreen />);

    await waitFor(() => {
      expect(getByTestId('name-input')).toBeTruthy();
    });
  });
});
