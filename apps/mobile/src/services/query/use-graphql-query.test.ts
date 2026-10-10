import { renderHook, waitFor } from '@testing-library/react-native';
import { useClient } from 'urql';
import { useGraphQLQuery } from './use-graphql-query';
import { gql } from 'urql';

jest.mock('urql');

const TEST_QUERY = gql`
  query TestQuery($id: String!) {
    test(id: $id) {
      id
      name
    }
  }
`;

interface TestData {
  test: {
    id: string;
    name: string;
  };
}

describe('useGraphQLQuery', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
    };
    (useClient as jest.Mock).mockReturnValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches data using provided document and variables', async () => {
    const mockData: TestData = {
      test: {
        id: '1',
        name: 'Test Item',
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: () =>
        Promise.resolve({
          data: mockData,
          error: undefined,
        }),
    });

    const { result } = renderHook(() =>
      useGraphQLQuery<TestData>({
        queryKey: ['test', '1'],
        document: TEST_QUERY,
        variables: { id: '1' },
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(mockClient.query).toHaveBeenCalledWith(TEST_QUERY, { id: '1' });
  });

  it('throws error when query fails', async () => {
    mockClient.query.mockReturnValue({
      toPromise: () =>
        Promise.resolve({
          data: undefined,
          error: new Error('Query failed'),
        }),
    });

    const { result } = renderHook(() =>
      useGraphQLQuery<TestData>({
        queryKey: ['test', 'error'],
        document: TEST_QUERY,
        variables: { id: 'error-id' },
      })
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('respects enabled option', () => {
    mockClient.query.mockReturnValue({
      toPromise: () => Promise.resolve({ data: {}, error: undefined }),
    });

    const { result } = renderHook(() =>
      useGraphQLQuery<TestData>({
        queryKey: ['test', 'disabled'],
        document: TEST_QUERY,
        variables: { id: '1' },
        enabled: false,
      })
    );

    expect(result.current.isIdle).toBe(true);
    expect(mockClient.query).not.toHaveBeenCalled();
  });

  it('works with empty variables', async () => {
    const mockData: TestData = {
      test: {
        id: '1',
        name: 'Test Item',
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: () =>
        Promise.resolve({
          data: mockData,
          error: undefined,
        }),
    });

    const { result } = renderHook(() =>
      useGraphQLQuery<TestData>({
        queryKey: ['test-no-vars'],
        document: TEST_QUERY,
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockClient.query).toHaveBeenCalledWith(TEST_QUERY, {});
  });

  it('passes through additional TanStack Query options', async () => {
    const mockData: TestData = {
      test: {
        id: '1',
        name: 'Test Item',
      },
    };

    mockClient.query.mockReturnValue({
      toPromise: () =>
        Promise.resolve({
          data: mockData,
          error: undefined,
        }),
    });

    const onSuccess = jest.fn();
    const { result } = renderHook(() =>
      useGraphQLQuery<TestData>({
        queryKey: ['test-options'],
        document: TEST_QUERY,
        variables: { id: '1' },
        onSuccess,
      })
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });
});
