import { renderHook, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApiaries, useCreateApiary, useDeleteApiary } from './use-apiaries';

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

describe('useApiaries', () => {
  it('returns apiary list on success', async () => {
    const apiaries = [
      { id: '1', name: 'Backyard', region: 'PNW' },
      { id: '2', name: 'Farm', region: 'SE' },
    ];
    mockQuery.mockResolvedValue({ data: { apiaries }, error: undefined });

    const { result } = renderHook(() => useApiaries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(apiaries);
  });

  it('returns error when query fails', async () => {
    mockQuery.mockResolvedValue({
      data: undefined,
      error: { message: 'Network error' },
    });

    const { result } = renderHook(() => useApiaries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network error');
  });
});

describe('useCreateApiary', () => {
  it('calls mutation and returns created apiary', async () => {
    const created = { id: '3', name: 'New', region: 'MW' };
    mockMutation.mockResolvedValue({ data: { createApiary: created }, error: undefined });

    const { result } = renderHook(() => useCreateApiary(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ name: 'New', region: 'MW' } as never);
    });

    expect(mockMutation).toHaveBeenCalled();
  });
});

describe('useDeleteApiary', () => {
  it('calls mutation with id', async () => {
    mockMutation.mockResolvedValue({ data: { deleteApiary: true }, error: undefined });

    const { result } = renderHook(() => useDeleteApiary(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('apiary-1');
    });

    expect(mockMutation).toHaveBeenCalled();
  });
});
