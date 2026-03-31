import {
  HIVES_QUERY,
  HIVE_QUERY,
  CREATE_HIVE_MUTATION,
  UPDATE_HIVE_MUTATION,
  DELETE_HIVE_MUTATION,
} from './hive';

function queryString(doc: { loc?: { source?: { body?: string } } }): string {
  return doc.loc?.source?.body ?? '';
}

describe('GraphQL hive operations', () => {
  describe('HIVES_QUERY', () => {
    it('is a query operation', () => {
      expect(queryString(HIVES_QUERY)).toMatch(/query\s+Hives/);
    });

    it('accepts apiaryId variable', () => {
      expect(queryString(HIVES_QUERY)).toContain('$apiaryId: UUID!');
    });

    it('requests required fields', () => {
      const q = queryString(HIVES_QUERY);
      expect(q).toContain('id');
      expect(q).toContain('name');
      expect(q).toContain('type');
      expect(q).toContain('status');
      expect(q).toContain('notes');
    });
  });

  describe('HIVE_QUERY', () => {
    it('is a query accepting id', () => {
      const q = queryString(HIVE_QUERY);
      expect(q).toMatch(/query\s+Hive\(\$id:\s*UUID!\)/);
    });
  });

  describe('CREATE_HIVE_MUTATION', () => {
    it('is a mutation operation', () => {
      expect(queryString(CREATE_HIVE_MUTATION)).toMatch(/mutation\s+CreateHive/);
    });

    it('accepts input variable', () => {
      expect(queryString(CREATE_HIVE_MUTATION)).toContain('$input: CreateHiveInput!');
    });

    it('returns id, name, type, status', () => {
      const q = queryString(CREATE_HIVE_MUTATION);
      expect(q).toContain('id');
      expect(q).toContain('name');
      expect(q).toContain('type');
      expect(q).toContain('status');
    });
  });

  describe('UPDATE_HIVE_MUTATION', () => {
    it('is a mutation accepting id and input', () => {
      const q = queryString(UPDATE_HIVE_MUTATION);
      expect(q).toMatch(/mutation\s+UpdateHive/);
      expect(q).toContain('$id: UUID!');
      expect(q).toContain('$input: UpdateHiveInput!');
    });
  });

  describe('DELETE_HIVE_MUTATION', () => {
    it('is a mutation accepting id', () => {
      const q = queryString(DELETE_HIVE_MUTATION);
      expect(q).toMatch(/mutation\s+DeleteHive/);
      expect(q).toContain('$id: UUID!');
    });
  });
});
