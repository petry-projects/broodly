import { gql } from 'urql';

export const START_INSPECTION_MUTATION = gql`
  mutation StartInspection($hiveId: UUID!, $type: InspectionType!) {
    startInspection(hiveId: $hiveId, type: $type) {
      id
      status
      startedAt
    }
  }
`;

export const ADD_OBSERVATION_MUTATION = gql`
  mutation AddObservation($inspectionId: UUID!, $input: AddObservationInput!) {
    addObservation(inspectionId: $inspectionId, input: $input) {
      id
      sequenceOrder
    }
  }
`;

export const PAUSE_INSPECTION_MUTATION = gql`
  mutation PauseInspection($id: UUID!) {
    pauseInspection(id: $id) {
      id
      status
    }
  }
`;

export const RESUME_INSPECTION_MUTATION = gql`
  mutation ResumeInspection($id: UUID!) {
    resumeInspection(id: $id) {
      id
      status
    }
  }
`;

export const COMPLETE_INSPECTION_MUTATION = gql`
  mutation CompleteInspection($id: UUID!) {
    completeInspection(id: $id) {
      id
      status
      completedAt
    }
  }
`;

export const GET_MEDIA_UPLOAD_URL_MUTATION = gql`
  mutation GetMediaUploadUrl($contentType: String!, $inspectionId: UUID!) {
    getMediaUploadUrl(contentType: $contentType, inspectionId: $inspectionId) {
      uploadUrl
      storageUri
    }
  }
`;

export const REQUEST_IMAGE_ANALYSIS_MUTATION = gql`
  mutation RequestImageAnalysis($imageId: UUID!, $inspectionId: UUID!) {
    requestImageAnalysis(imageId: $imageId, inspectionId: $inspectionId) {
      analysisId
    }
  }
`;

export const GET_IMAGE_ANALYSIS_RESULT_QUERY = gql`
  query GetImageAnalysisResult($imageId: UUID!) {
    imageAnalysisResult(imageId: $imageId) {
      findings {
        category
        interpretation
        confidence
      }
      overallConfidence
      status
    }
  }
`;

export const GET_ACOUSTIC_ANALYSIS_RESULT_QUERY = gql`
  query GetAcousticAnalysisResult($audioId: UUID!) {
    acousticAnalysisResult(audioId: $audioId) {
      queenrightConfidence
      agitationLevel
      swarmReadiness
      status
    }
  }
`;

export const HIVE_INSPECTION_CONTEXT_QUERY = gql`
  query HiveInspectionContext($hiveId: UUID!) {
    hive(id: $hiveId) {
      id
      name
      status
      type
    }
    hiveInspectionHistory(hiveId: $hiveId, limit: 1) {
      id
      type
      status
      completedAt
    }
    activeRecommendations(hiveId: $hiveId) {
      id
      action
      confidenceLevel
      confidenceType
    }
  }
`;
