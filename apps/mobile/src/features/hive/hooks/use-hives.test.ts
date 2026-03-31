import { renderHook, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHives, useCreateHive, useUpdateHive, useDeleteHive } from './use-hives';

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

describe('useHives', () => {
  it('returns hive list for an apiary', async () => {
    const hives = [
      { id: 'h1', name: 'Hive 1', type: 'langstroth', status: 'healthy' },
      { id: 'h2', name: 'Hive 2', type: 'top-bar', status: 'warning' },
    ];
    mockQuery.mockResolvedValue({ data: { hives }, error: undefined });

    const { result } = renderHook(() => useHives('apiary-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(hives);
  });

  it('does not fetch when apiaryId is empty', () => {
    const { result } = renderHook(() => useHives(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns error when query fails', async () => {
    mockQuery.mockResolvedValue({
      data: undefined,
      error: { message: 'Fetch error' },
    });

    const { result } = renderHook(() => useHives('apiary-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Fetch error');
  });
});

describe('useCreateHive', () => {
  it('calls mutation and returns created hive', async () => {
    const created = { id: 'h3', name: 'New Hive', type: 'langstroth', status: 'healthy' };
    mockMutation.mockResolvedValue({ data: { createHive: created }, error: undefined });

    const { result } = renderHook(() => useCreateHive(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: 'New Hive', apiaryId: 'a1' } as never);
    });

    expect(mockMutation).toHaveBeenCalled();
  });
});

describe('useUpdateHive', () => {
  it('calls mutation with id and input', async () => {
    mockMutation.mockResolvedValue({
      data: { updateHive: { id: 'h1', name: 'Updated', type: 'langstroth', status: 'healthy' } },
      error: undefined,
    });

    const { result } = renderHook(() => useUpdateHive(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 'h1', input: { name: 'Updated' } } as never);
    });

    expect(mockMutation).toHaveBeenCalled();
  });
});

describe('useDeleteHive', () => {
  it('calls mutation with id', async () => {
    mockMutation.mockResolvedValue({ data: { deleteHive: true }, error: undefined });

    const { result } = renderHook(() => useDeleteHive(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('h1');
    });

    expect(mockMutation).toHaveBeenCalled();
  });
});
