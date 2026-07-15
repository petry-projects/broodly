/**
 * @jest-environment jsdom
 */
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../components/ui/heading', () => {
  const { Text } = require('react-native');
  return { Heading: (props: Record<string, unknown>) => require('react').createElement(Text, props, props.children) };
});

jest.mock('../components/ui/text', () => {
  const { Text } = require('react-native');
  return { Text: (props: Record<string, unknown>) => require('react').createElement(Text, props, props.children) };
});

jest.mock('../components/ui/button', () => {
  const { View, Text } = require('react-native');
  return {
    Button: (props: Record<string, unknown>) => require('react').createElement(View, { ...props, testID: props.testID }, props.children),
    ButtonText: (props: Record<string, unknown>) => require('react').createElement(Text, {}, props.children),
  };
});

const mockCompleteTask = { mutate: jest.fn() };
const mockDeferTask = { mutate: jest.fn() };

jest.mock('../src/features/planning/hooks/use-weekly-queue', () => ({
  useWeeklyQueue: jest.fn(),
  useCompleteTask: () => mockCompleteTask,
  useDeferTask: () => mockDeferTask,
}));

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import * as planHooks from '../src/features/planning/hooks/use-weekly-queue';

describe('Plan Screen', () => {
  const defaultQueueData = {
    data: [
      {
        apiaryId: 'apiary-1',
        apiaryName: 'Back Yard',
        tasks: [
          {
            id: 'task-1',
            title: 'Inspect brood',
            hiveId: 'hive-1',
            hiveName: 'Hive 1',
            priority: 'HIGH',
            dueDate: '2026-05-10T00:00:00Z',
            status: 'PENDING',
            isOverdue: false,
            catchUpGuidance: null,
          },
        ],
      },
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isRefetching: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (planHooks.useWeeklyQueue as jest.Mock).mockReturnValue(defaultQueueData);
  });

  it('renders plan screen with title', () => {
    const PlanScreen = require('../app/(tabs)/plan/index').default;
    render(<PlanScreen />);
    expect(screen.getByText(/This Week's Plan/)).toBeTruthy();
  });

  it('displays loading state while fetching', () => {
    (planHooks.useWeeklyQueue as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    const PlanScreen = require('../app/(tabs)/plan/index').default;
    render(<PlanScreen />);
    expect(screen.getByText(/Loading your plan/)).toBeTruthy();
  });

  it('displays error state when query fails', () => {
    (planHooks.useWeeklyQueue as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
      isRefetching: false,
    });
    const PlanScreen = require('../app/(tabs)/plan/index').default;
    render(<PlanScreen />);
    expect(screen.getByText(/Couldn't load your plan/)).toBeTruthy();
  });

  it('renders tasks from queues', () => {
    const PlanScreen = require('../app/(tabs)/plan/index').default;
    render(<PlanScreen />);
    expect(screen.getByText('Inspect brood')).toBeTruthy();
    expect(screen.getByText('Hive 1')).toBeTruthy();
  });

  it('displays empty state when no tasks', () => {
    (planHooks.useWeeklyQueue as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    const PlanScreen = require('../app/(tabs)/plan/index').default;
    render(<PlanScreen />);
    expect(screen.getByText(/All caught up/)).toBeTruthy();
  });

  it('renders overdue tasks with guidance', () => {
    (planHooks.useWeeklyQueue as jest.Mock).mockReturnValue({
      data: [
        {
          apiaryId: 'apiary-1',
          apiaryName: 'Back Yard',
          tasks: [
            {
              id: 'task-1',
              title: 'Urgent inspection',
              hiveId: 'hive-1',
              hiveName: 'Hive 1',
              priority: 'CRITICAL',
              dueDate: '2026-05-01T00:00:00Z',
              status: 'PENDING',
              isOverdue: true,
              catchUpGuidance: 'Check for swarm cells',
            },
          ],
        },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    const PlanScreen = require('../app/(tabs)/plan/index').default;
    render(<PlanScreen />);
    expect(screen.getByText('URGENT')).toBeTruthy();
    expect(screen.getByText('Check for swarm cells')).toBeTruthy();
  });
});
