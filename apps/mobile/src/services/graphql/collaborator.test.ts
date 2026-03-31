import {
  COLLABORATORS_QUERY,
  INVITE_COLLABORATOR_MUTATION,
  REVOKE_COLLABORATOR_MUTATION,
  ACCESS_AUDIT_LOG_QUERY,
} from './collaborator';

function queryString(doc: { loc?: { source?: { body?: string } } }): string {
  return doc.loc?.source?.body ?? '';
}

describe('GraphQL collaborator operations', () => {
  describe('COLLABORATORS_QUERY', () => {
    it('is a query operation', () => {
      expect(queryString(COLLABORATORS_QUERY)).toMatch(/query\s+Collaborators/);
    });

    it('requests required fields', () => {
      const q = queryString(COLLABORATORS_QUERY);
      expect(q).toContain('id');
      expect(q).toContain('email');
      expect(q).toContain('status');
      expect(q).toContain('role');
      expect(q).toContain('invitedAt');
    });
  });

  describe('INVITE_COLLABORATOR_MUTATION', () => {
    it('is a mutation accepting email', () => {
      const q = queryString(INVITE_COLLABORATOR_MUTATION);
      expect(q).toMatch(/mutation\s+InviteCollaborator/);
      expect(q).toContain('$email: String!');
    });

    it('returns id, email, status', () => {
      const q = queryString(INVITE_COLLABORATOR_MUTATION);
      expect(q).toContain('id');
      expect(q).toContain('email');
      expect(q).toContain('status');
    });
  });

  describe('REVOKE_COLLABORATOR_MUTATION', () => {
    it('is a mutation accepting collaboratorId', () => {
      const q = queryString(REVOKE_COLLABORATOR_MUTATION);
      expect(q).toMatch(/mutation\s+RevokeCollaborator/);
      expect(q).toContain('$collaboratorId: UUID!');
    });
  });

  describe('ACCESS_AUDIT_LOG_QUERY', () => {
    it('is a query', () => {
      expect(queryString(ACCESS_AUDIT_LOG_QUERY)).toMatch(/query\s+AccessAuditLog/);
    });

    it('requests event fields', () => {
      const q = queryString(ACCESS_AUDIT_LOG_QUERY);
      expect(q).toContain('eventType');
      expect(q).toContain('targetEmail');
      expect(q).toContain('occurredAt');
    });
  });
});
