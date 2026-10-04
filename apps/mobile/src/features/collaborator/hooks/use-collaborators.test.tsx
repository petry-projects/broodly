jest.mock('urql', () => ({
  useClient: jest.fn(),
  gql: (query: unknown) => query,
}));

import { useCollaborators, useInviteCollaborator, useRevokeCollaborator, useAccessAuditLog } from './use-collaborators';

describe('Collaborator Hooks', () => {
  it('exports useCollaborators hook', () => {
    expect(typeof useCollaborators).toBe('function');
  });

  it('exports useInviteCollaborator hook', () => {
    expect(typeof useInviteCollaborator).toBe('function');
  });

  it('exports useRevokeCollaborator hook', () => {
    expect(typeof useRevokeCollaborator).toBe('function');
  });

  it('exports useAccessAuditLog hook', () => {
    expect(typeof useAccessAuditLog).toBe('function');
  });
});
