import {
  APIARIES_QUERY,
  APIARY_QUERY,
  CREATE_APIARY_MUTATION,
  UPDATE_APIARY_MUTATION,
  DELETE_APIARY_MUTATION,
} from './apiary';

function queryString(doc: { loc?: { source?: { body?: string } } }): string {
  return doc.loc?.source?.body ?? '';
}

describe('GraphQL apiary operations', () => {
  describe('APIARIES_QUERY', () => {
    it('is a query operation', () => {
      expect(queryString(APIARIES_QUERY)).toMatch(/query\s+Apiaries/);
    });

    it('requests id and name fields', () => {
      const q = queryString(APIARIES_QUERY);
      expect(q).toContain('id');
      expect(q).toContain('name');
    });

    it('requests location fields', () => {
      const q = queryString(APIARIES_QUERY);
      expect(q).toContain('latitude');
      expect(q).toContain('longitude');
      expect(q).toContain('region');
    });

    it('requests nested hives with id, name, status', () => {
      const q = queryString(APIARIES_QUERY);
      expect(q).toContain('hives');
      expect(q).toContain('status');
    });
  });

  describe('APIARY_QUERY', () => {
    it('is a query accepting id variable', () => {
      const q = queryString(APIARY_QUERY);
      expect(q).toMatch(/query\s+Apiary\(\$id:\s*UUID!\)/);
    });
  });

  describe('CREATE_APIARY_MUTATION', () => {
    it('is a mutation operation', () => {
      expect(queryString(CREATE_APIARY_MUTATION)).toMatch(/mutation\s+CreateApiary/);
    });

    it('accepts input variable', () => {
      expect(queryString(CREATE_APIARY_MUTATION)).toContain('$input: CreateApiaryInput!');
    });
  });

  describe('UPDATE_APIARY_MUTATION', () => {
    it('is a mutation operation', () => {
      expect(queryString(UPDATE_APIARY_MUTATION)).toMatch(/mutation\s+UpdateApiary/);
    });

    it('accepts id and input variables', () => {
      const q = queryString(UPDATE_APIARY_MUTATION);
      expect(q).toContain('$id: UUID!');
      expect(q).toContain('$input: UpdateApiaryInput!');
    });
  });

  describe('DELETE_APIARY_MUTATION', () => {
    it('is a mutation operation', () => {
      expect(queryString(DELETE_APIARY_MUTATION)).toMatch(/mutation\s+DeleteApiary/);
    });

    it('accepts id variable', () => {
      expect(queryString(DELETE_APIARY_MUTATION)).toContain('$id: UUID!');
    });
  });
});
