import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as UrqlProvider, createClient } from 'urql';
import { useGraphQLQuery } from './use-graphql-query';
import { gql } from 'urql';

const TEST_QUERY = gql`
  query TestQuery {
    test {
      id
    }
  }
`;

const mockQueryFn = jest.fn();

jest.mock('urql', () => {
  const actual = jest.requireActual('urql');
  return {
    ...actual,
    useClient: () => ({
      query: () => ({
        toPromise: mockQueryFn,
      }),
    }),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useGraphQLQuery', () => {
  it('returns loading state initially', () => {
    mockQueryFn.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(
      () =>
        useGraphQLQuery({
          queryKey: ['test'],
          document: TEST_QUERY,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns data after query resolves', async () => {
    mockQueryFn.mockResolvedValue({ data: { test: { id: '1' } }, error: undefined });

    const { result } = renderHook(
      () =>
        useGraphQLQuery({
          queryKey: ['test-success'],
          document: TEST_QUERY,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ test: { id: '1' } });
  });

  it('returns error on query failure', async () => {
    mockQueryFn.mockResolvedValue({
      data: undefined,
      error: { message: 'GraphQL error' },
    });

    const { result } = renderHook(
      () =>
        useGraphQLQuery({
          queryKey: ['test-error'],
          document: TEST_QUERY,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('GraphQL error');
  });

  it('respects enabled flag', () => {
    const { result } = renderHook(
      () =>
        useGraphQLQuery({
          queryKey: ['test-disabled'],
          document: TEST_QUERY,
          enabled: false,
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockQueryFn).not.toHaveBeenCalled();
  });
});
