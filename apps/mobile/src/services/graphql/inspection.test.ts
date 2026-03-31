import {
  START_INSPECTION_MUTATION,
  ADD_OBSERVATION_MUTATION,
  COMPLETE_INSPECTION_MUTATION,
  PAUSE_INSPECTION_MUTATION,
  RESUME_INSPECTION_MUTATION,
  GET_MEDIA_UPLOAD_URL_MUTATION,
  REQUEST_IMAGE_ANALYSIS_MUTATION,
  GET_IMAGE_ANALYSIS_RESULT_QUERY,
  GET_ACOUSTIC_ANALYSIS_RESULT_QUERY,
  HIVE_INSPECTION_CONTEXT_QUERY,
} from './inspection';

function queryString(doc: { loc?: { source?: { body?: string } } }): string {
  return doc.loc?.source?.body ?? '';
}

describe('GraphQL inspection operations', () => {
  describe('START_INSPECTION_MUTATION', () => {
    it('is a mutation with hiveId and type', () => {
      const q = queryString(START_INSPECTION_MUTATION);
      expect(q).toMatch(/mutation\s+StartInspection/);
      expect(q).toContain('$hiveId: UUID!');
      expect(q).toContain('$type: InspectionType!');
    });

    it('returns id, status, startedAt', () => {
      const q = queryString(START_INSPECTION_MUTATION);
      expect(q).toContain('id');
      expect(q).toContain('status');
      expect(q).toContain('startedAt');
    });
  });

  describe('ADD_OBSERVATION_MUTATION', () => {
    it('is a mutation with inspectionId and input', () => {
      const q = queryString(ADD_OBSERVATION_MUTATION);
      expect(q).toMatch(/mutation\s+AddObservation/);
      expect(q).toContain('$inspectionId: UUID!');
      expect(q).toContain('$input: AddObservationInput!');
    });
  });

  describe('COMPLETE_INSPECTION_MUTATION', () => {
    it('is a mutation with id', () => {
      const q = queryString(COMPLETE_INSPECTION_MUTATION);
      expect(q).toMatch(/mutation\s+CompleteInspection/);
      expect(q).toContain('$id: UUID!');
    });

    it('returns completedAt', () => {
      expect(queryString(COMPLETE_INSPECTION_MUTATION)).toContain('completedAt');
    });
  });

  describe('PAUSE_INSPECTION_MUTATION', () => {
    it('is a mutation', () => {
      expect(queryString(PAUSE_INSPECTION_MUTATION)).toMatch(/mutation\s+PauseInspection/);
    });
  });

  describe('RESUME_INSPECTION_MUTATION', () => {
    it('is a mutation', () => {
      expect(queryString(RESUME_INSPECTION_MUTATION)).toMatch(/mutation\s+ResumeInspection/);
    });
  });

  describe('GET_MEDIA_UPLOAD_URL_MUTATION', () => {
    it('accepts contentType and inspectionId', () => {
      const q = queryString(GET_MEDIA_UPLOAD_URL_MUTATION);
      expect(q).toContain('$contentType: String!');
      expect(q).toContain('$inspectionId: UUID!');
    });
  });

  describe('REQUEST_IMAGE_ANALYSIS_MUTATION', () => {
    it('accepts imageId and inspectionId', () => {
      const q = queryString(REQUEST_IMAGE_ANALYSIS_MUTATION);
      expect(q).toContain('$imageId: UUID!');
      expect(q).toContain('$inspectionId: UUID!');
    });
  });

  describe('GET_IMAGE_ANALYSIS_RESULT_QUERY', () => {
    it('is a query with imageId', () => {
      const q = queryString(GET_IMAGE_ANALYSIS_RESULT_QUERY);
      expect(q).toMatch(/query\s+GetImageAnalysisResult/);
      expect(q).toContain('$imageId: UUID!');
    });
  });

  describe('HIVE_INSPECTION_CONTEXT_QUERY', () => {
    it('is a query with hiveId', () => {
      const q = queryString(HIVE_INSPECTION_CONTEXT_QUERY);
      expect(q).toMatch(/query\s+HiveInspectionContext/);
      expect(q).toContain('$hiveId: UUID!');
    });
  });
});
