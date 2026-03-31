import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock urql client
const mockQuery = jest.fn();
const mockMutation = jest.fn();

jest.mock('urql', () => ({
  useClient: () => ({
    query: mockQuery,
    mutation: mockMutation,
  }),
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

import {
  useCollaborators,
  useInviteCollaborator,
  useRevokeCollaborator,
  useAccessAuditLog,
} from './use-collaborators';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

const MOCK_COLLABORATORS = [
  {
    id: '1',
    email: 'alice@example.com',
    status: 'accepted' as const,
    role: 'viewer',
    invitedAt: '2026-03-20T00:00:00Z',
    acceptedAt: '2026-03-21T00:00:00Z',
  },
  {
    id: '2',
    email: 'bob@example.com',
    status: 'pending' as const,
    role: 'viewer',
    invitedAt: '2026-03-28T00:00:00Z',
    acceptedAt: null,
  },
];

const MOCK_AUDIT_LOG = [
  {
    id: 'a1',
    eventType: 'invite',
    targetEmail: 'alice@example.com',
    occurredAt: '2026-03-20T00:00:00Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCollaborators', () => {
  it('fetches and returns collaborators list', async () => {
    mockQuery.mockReturnValue({
      toPromise: () =>
        Promise.resolve({ data: { collaborators: MOCK_COLLABORATORS } }),
    });

    const { result } = renderHook(() => useCollaborators(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_COLLABORATORS);
    expect(result.current.data).toHaveLength(2);
  });

  it('throws on query error', async () => {
    mockQuery.mockReturnValue({
      toPromise: () =>
        Promise.resolve({ error: { message: 'Unauthorized' } }),
    });

    const { result } = renderHook(() => useCollaborators(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Unauthorized');
  });
});

describe('useInviteCollaborator', () => {
  it('calls mutation with email and invalidates queries on success', async () => {
    mockMutation.mockReturnValue({
      toPromise: () =>
        Promise.resolve({
          data: {
            inviteCollaborator: {
              id: '3',
              email: 'carol@example.com',
              status: 'pending',
            },
          },
        }),
    });

    const { result } = renderHook(() => useInviteCollaborator(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('carol@example.com');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      id: '3',
      email: 'carol@example.com',
      status: 'pending',
    });
  });

  it('reports mutation error', async () => {
    mockMutation.mockReturnValue({
      toPromise: () =>
        Promise.resolve({ error: { message: 'Already invited' } }),
    });

    const { result } = renderHook(() => useInviteCollaborator(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('existing@example.com');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Already invited');
  });
});

describe('useRevokeCollaborator', () => {
  it('calls revoke mutation and invalidates queries', async () => {
    mockMutation.mockReturnValue({
      toPromise: () =>
        Promise.resolve({ data: { revokeCollaborator: true } }),
    });

    const { result } = renderHook(() => useRevokeCollaborator(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(true);
  });
});

describe('useAccessAuditLog', () => {
  it('fetches and returns audit log entries', async () => {
    mockQuery.mockReturnValue({
      toPromise: () =>
        Promise.resolve({ data: { accessAuditLog: MOCK_AUDIT_LOG } }),
    });

    const { result } = renderHook(() => useAccessAuditLog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_AUDIT_LOG);
    expect(result.current.data).toHaveLength(1);
  });
});
