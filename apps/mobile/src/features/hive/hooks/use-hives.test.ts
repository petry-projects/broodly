import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHives, useHive, useCreateHive, useUpdateHive, useDeleteHive } from './use-hives';
import * as hiveGraphQL from '../../../services/graphql/hive';

// Mock urql
const mockClient = {
  query: jest.fn(),
  mutation: jest.fn(),
};

jest.mock('urql', () => ({
  useClient: () => mockClient,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useHives', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches hives for an apiary', async () => {
    const mockHives = [
      { id: '1', name: 'Hive 1', type: 'LANGSTROTH', status: 'ACTIVE', notes: '', createdAt: '', updatedAt: '' },
    ];
    mockClient.query.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { hives: mockHives },
      }),
    });

    const { result } = renderHook(() => useHives('apiary-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockHives);
    });
  });

  it('throws error when hives query fails', async () => {
    mockClient.query.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: new Error('Query failed'),
        data: null,
      }),
    });

    const { result } = renderHook(() => useHives('apiary-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useHive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single hive by ID', async () => {
    const mockHive = { id: '1', name: 'Hive 1', type: 'LANGSTROTH', status: 'ACTIVE', notes: '', createdAt: '', updatedAt: '' };
    mockClient.query.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { hive: mockHive },
      }),
    });

    const { result } = renderHook(() => useHive('hive-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockHive);
    });
  });
});

describe('useCreateHive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new hive', async () => {
    const newHive = { id: '2', name: 'New Hive', type: 'LANGSTROTH', status: 'ACTIVE' };
    mockClient.mutation.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { createHive: newHive },
      }),
    });

    const { result } = renderHook(() => useCreateHive(), { wrapper: createWrapper() });

    const input = { apiaryId: 'apiary-1', name: 'New Hive', type: 'LANGSTROTH' as const };
    await result.current.mutateAsync(input);

    expect(result.current.data).toEqual(newHive);
  });
});

describe('useUpdateHive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates an existing hive', async () => {
    const updatedHive = { id: '1', name: 'Updated Hive', type: 'LANGSTROTH', status: 'ACTIVE' };
    mockClient.mutation.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { updateHive: updatedHive },
      }),
    });

    const { result } = renderHook(() => useUpdateHive(), { wrapper: createWrapper() });

    const input = { id: '1', input: { name: 'Updated Hive', type: 'LANGSTROTH' as const } };
    await result.current.mutateAsync(input);

    expect(result.current.data).toEqual(updatedHive);
  });
});

describe('useDeleteHive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a hive', async () => {
    mockClient.mutation.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { deleteHive: true },
      }),
    });

    const { result } = renderHook(() => useDeleteHive(), { wrapper: createWrapper() });

    await result.current.mutateAsync('hive-1');

    expect(result.current.data).toBe(true);
  });
});
