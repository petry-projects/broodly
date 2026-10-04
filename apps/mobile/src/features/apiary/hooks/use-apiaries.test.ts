import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApiaries, useApiary, useCreateApiary, useUpdateApiary, useDeleteApiary } from './use-apiaries';
import * as urql from 'urql';
import type { Apiary, CreateApiaryInput, UpdateApiaryInput } from '@broodly/graphql-types';
import React from 'react';

jest.mock('urql', () => ({
  useClient: jest.fn(),
}));

const mockUseClient = urql.useClient as jest.MockedFunction<typeof urql.useClient>;

const mockApiary: Apiary = {
  id: '1',
  name: 'Test Apiary',
  region: 'Oregon',
  latitude: 45.5,
  longitude: -122.5,
  elevationOffset: 100,
  bloomOffset: 10,
  hives: [
    { id: 'h1', name: 'Hive 1', status: 'ACTIVE', type: 'LANGSTROTH' },
    { id: 'h2', name: 'Hive 2', status: 'INACTIVE', type: 'LANGSTROTH' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockApiaries: Apiary[] = [mockApiary];

describe('useApiaries', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('fetches apiaries successfully', async () => {
    const mockClient = {
      query: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: { apiaries: mockApiaries }, error: null }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useApiaries(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockApiaries);
  });

  it('handles error when fetching apiaries', async () => {
    const mockClient = {
      query: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: null, error: { message: 'API Error' } }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useApiaries(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch apiaries');
  });

  it('handles missing data in response', async () => {
    const mockClient = {
      query: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useApiaries(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('No data returned for apiaries query');
  });
});

describe('useApiary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('fetches single apiary successfully', async () => {
    const mockClient = {
      query: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: { apiary: mockApiary }, error: null }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useApiary('1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockApiary);
  });

  it('handles error when fetching apiary', async () => {
    const mockClient = {
      query: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: null, error: { message: 'API Error' } }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useApiary('1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to fetch apiary');
  });

  it('does not fetch when id is not provided', async () => {
    const mockClient = {
      query: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: { apiary: mockApiary }, error: null }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useApiary(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useCreateApiary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('creates apiary successfully', async () => {
    const mockClient = {
      mutation: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: { createApiary: mockApiary }, error: null }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateApiary(), { wrapper });

    const input: CreateApiaryInput = { name: 'Test Apiary', region: 'Oregon' };
    await result.current.mutateAsync(input);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockApiary);
  });

  it('handles error when creating apiary', async () => {
    const mockClient = {
      mutation: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: null, error: { message: 'API Error' } }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateApiary(), { wrapper });

    const input: CreateApiaryInput = { name: 'Test Apiary', region: 'Oregon' };

    await expect(result.current.mutateAsync(input)).rejects.toThrow('Failed to create apiary');
  });
});

describe('useUpdateApiary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('updates apiary successfully', async () => {
    const updatedApiary = { ...mockApiary, name: 'Updated Name' };
    const mockClient = {
      mutation: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: { updateApiary: updatedApiary }, error: null }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateApiary(), { wrapper });

    const input: UpdateApiaryInput = { name: 'Updated Name', region: 'Oregon' };
    await result.current.mutateAsync({ id: '1', input });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(updatedApiary);
  });

  it('handles error when updating apiary', async () => {
    const mockClient = {
      mutation: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: null, error: { message: 'API Error' } }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateApiary(), { wrapper });

    const input: UpdateApiaryInput = { name: 'Updated Name', region: 'Oregon' };

    await expect(result.current.mutateAsync({ id: '1', input })).rejects.toThrow('Failed to update apiary');
  });
});

describe('useDeleteApiary', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('deletes apiary successfully', async () => {
    const mockClient = {
      mutation: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: { deleteApiary: true }, error: null }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteApiary(), { wrapper });

    await result.current.mutateAsync('1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(true);
  });

  it('handles error when deleting apiary', async () => {
    const mockClient = {
      mutation: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: null, error: { message: 'API Error' } }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteApiary(), { wrapper });

    await expect(result.current.mutateAsync('1')).rejects.toThrow('Failed to delete apiary');
  });

  it('handles missing data in response', async () => {
    const mockClient = {
      mutation: jest.fn(() => ({
        toPromise: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    };
    mockUseClient.mockReturnValue(mockClient as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteApiary(), { wrapper });

    await expect(result.current.mutateAsync('1')).rejects.toThrow('No data returned from deleteApiary mutation');
  });
});
