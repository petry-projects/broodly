import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCollaborators, useInviteCollaborator, useRevokeCollaborator, useAccessAuditLog } from './use-collaborators';

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

describe('useCollaborators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches collaborators', async () => {
    const mockCollaborators = [
      {
        id: '1',
        email: 'user@example.com',
        status: 'accepted' as const,
        role: 'viewer',
        invitedAt: '2026-01-01',
        acceptedAt: '2026-01-02',
      },
    ];
    mockClient.query.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { collaborators: mockCollaborators },
      }),
    });

    const { result } = renderHook(() => useCollaborators(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockCollaborators);
    });
  });

  it('throws error when query fails', async () => {
    mockClient.query.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: new Error('Query failed'),
        data: null,
      }),
    });

    const { result } = renderHook(() => useCollaborators(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useInviteCollaborator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('invites a collaborator', async () => {
    const newCollaborator = {
      id: '2',
      email: 'newuser@example.com',
      status: 'pending' as const,
      role: 'viewer',
      invitedAt: '2026-01-03',
      acceptedAt: null,
    };
    mockClient.mutation.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { inviteCollaborator: newCollaborator },
      }),
    });

    const { result } = renderHook(() => useInviteCollaborator(), { wrapper: createWrapper() });

    await result.current.mutateAsync('newuser@example.com');

    expect(result.current.data).toEqual(newCollaborator);
  });

  it('throws error when invitation fails', async () => {
    mockClient.mutation.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: new Error('Invitation failed'),
        data: null,
      }),
    });

    const { result } = renderHook(() => useInviteCollaborator(), { wrapper: createWrapper() });

    await expect(result.current.mutateAsync('invalid@example.com')).rejects.toThrow();
  });
});

describe('useRevokeCollaborator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revokes collaborator access', async () => {
    mockClient.mutation.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { revokeCollaborator: true },
      }),
    });

    const { result } = renderHook(() => useRevokeCollaborator(), { wrapper: createWrapper() });

    await result.current.mutateAsync('collab-1');

    expect(result.current.data).toBe(true);
  });
});

describe('useAccessAuditLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches audit log entries', async () => {
    const mockAuditLog = [
      { id: '1', eventType: 'INVITE', targetEmail: 'user@example.com', occurredAt: '2026-01-01' },
    ];
    mockClient.query.mockReturnValue({
      toPromise: jest.fn().mockResolvedValue({
        error: null,
        data: { accessAuditLog: mockAuditLog },
      }),
    });

    const { result } = renderHook(() => useAccessAuditLog(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockAuditLog);
    });
  });
});
