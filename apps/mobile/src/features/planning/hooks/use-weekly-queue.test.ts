import { renderHook, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useWeeklyQueue,
  useCompleteTask,
  useDeferTask,
  useDismissTask,
} from './use-weekly-queue';

const mockQuery = jest.fn();
const mockMutation = jest.fn();

jest.mock('urql', () => ({
  ...jest.requireActual('urql'),
  useClient: () => ({
    query: () => ({ toPromise: mockQuery }),
    mutation: () => ({ toPromise: mockMutation }),
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useWeeklyQueue', () => {
  it('returns weekly queue data', async () => {
    const queueData = [
      {
        apiaryId: 'a1',
        apiaryName: 'Backyard',
        tasks: [
          {
            id: 't1',
            title: 'Inspect Hive 1',
            hiveId: 'h1',
            hiveName: 'Hive 1',
            priority: 1,
            dueDate: '2026-03-30',
            status: 'pending',
            isOverdue: false,
            catchUpGuidance: null,
            requiredMaterials: null,
            recommendedAction: null,
          },
        ],
      },
    ];
    mockQuery.mockResolvedValue({ data: { weeklyQueue: queueData }, error: undefined });

    const { result } = renderHook(() => useWeeklyQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(queueData);
    expect(result.current.data?.[0].apiaryName).toBe('Backyard');
  });

  it('returns error when query fails', async () => {
    mockQuery.mockResolvedValue({
      data: undefined,
      error: { message: 'Server error' },
    });

    const { result } = renderHook(() => useWeeklyQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCompleteTask', () => {
  it('calls mutation with task id', async () => {
    mockMutation.mockResolvedValue({
      data: { completeTask: { id: 't1', status: 'completed', completedAt: '2026-03-30' } },
      error: undefined,
    });

    const { result } = renderHook(() => useCompleteTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('t1');
    });

    expect(mockMutation).toHaveBeenCalled();
  });
});

describe('useDeferTask', () => {
  it('calls mutation with id, reason, and newDueDate', async () => {
    mockMutation.mockResolvedValue({
      data: { deferTask: { id: 't1', status: 'deferred', dueDate: '2026-04-05' } },
      error: undefined,
    });

    const { result } = renderHook(() => useDeferTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 't1',
        reason: 'Rain',
        newDueDate: '2026-04-05',
      });
    });

    expect(mockMutation).toHaveBeenCalled();
  });
});

describe('useDismissTask', () => {
  it('calls mutation with id and reason', async () => {
    mockMutation.mockResolvedValue({
      data: { dismissTask: { id: 't1', status: 'dismissed' } },
      error: undefined,
    });

    const { result } = renderHook(() => useDismissTask(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 't1', reason: 'Not needed' });
    });

    expect(mockMutation).toHaveBeenCalled();
  });
});
