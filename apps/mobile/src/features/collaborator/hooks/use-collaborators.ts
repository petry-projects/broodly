import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClient } from 'urql';
import {
  COLLABORATORS_QUERY,
  INVITE_COLLABORATOR_MUTATION,
  REVOKE_COLLABORATOR_MUTATION,
  ACCESS_AUDIT_LOG_QUERY,
} from '../../../services/graphql/collaborator';
import { throwIfGraphQLError, assertData } from '../../../services/graphql/query-utils';

interface Collaborator {
  id: string;
  email: string;
  status: 'pending' | 'accepted';
  role: string;
  invitedAt: string;
  acceptedAt: string | null;
}

interface AuditEntry {
  id: string;
  eventType: string;
  targetEmail: string;
  occurredAt: string;
}

const COLLAB_KEYS = {
  all: ['collaborators'] as const,
  audit: ['access-audit-log'] as const,
};

export function useCollaborators() {
  const client = useClient();

  return useQuery({
    queryKey: COLLAB_KEYS.all,
    queryFn: async () => {
      const result = await client.query(COLLABORATORS_QUERY, {}).toPromise();
      throwIfGraphQLError(result, 'Collaborators query');
      return assertData(result, 'collaborators', 'Collaborators query') as Collaborator[];
    },
  });
}

export function useInviteCollaborator() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const result = await client.mutation(INVITE_COLLABORATOR_MUTATION, { email }).toPromise();
      throwIfGraphQLError(result, 'InviteCollaborator mutation');
      return assertData(result, 'inviteCollaborator', 'InviteCollaborator mutation') as Collaborator;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLAB_KEYS.all });
      queryClient.invalidateQueries({ queryKey: COLLAB_KEYS.audit });
    },
  });
}

export function useRevokeCollaborator() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collaboratorId: string) => {
      const result = await client.mutation(REVOKE_COLLABORATOR_MUTATION, { collaboratorId }).toPromise();
      throwIfGraphQLError(result, 'RevokeCollaborator mutation');
      return assertData(result, 'revokeCollaborator', 'RevokeCollaborator mutation') as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLAB_KEYS.all });
      queryClient.invalidateQueries({ queryKey: COLLAB_KEYS.audit });
    },
  });
}

export function useAccessAuditLog() {
  const client = useClient();

  return useQuery({
    queryKey: COLLAB_KEYS.audit,
    queryFn: async () => {
      const result = await client.query(ACCESS_AUDIT_LOG_QUERY, {}).toPromise();
      throwIfGraphQLError(result, 'AccessAuditLog query');
      return assertData(result, 'accessAuditLog', 'AccessAuditLog query') as AuditEntry[];
    },
  });
}
