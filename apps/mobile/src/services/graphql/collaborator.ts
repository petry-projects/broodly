import { gql } from 'urql';

export const COLLABORATORS_QUERY = gql`
  query Collaborators {
    collaborators {
      id
      email
      status
      role
      invitedAt
      acceptedAt
    }
  }
`;

export const INVITE_COLLABORATOR_MUTATION = gql`
  mutation InviteCollaborator($email: String!) {
    inviteCollaborator(email: $email) {
      id
      email
      status
    }
  }
`;

export const REVOKE_COLLABORATOR_MUTATION = gql`
  mutation RevokeCollaborator($collaboratorId: UUID!) {
    revokeCollaborator(collaboratorId: $collaboratorId)
  }
`;

export const ACCESS_AUDIT_LOG_QUERY = gql`
  query AccessAuditLog {
    accessAuditLog {
      id
      eventType
      targetEmail
      occurredAt
    }
  }
`;
