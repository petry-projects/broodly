import { gql } from 'urql';

export const APIARIES_QUERY = gql`
  query Apiaries {
    apiaries {
      id
      name
      region
      latitude
      longitude
      elevationOffset
      bloomOffset
      hives {
        id
        name
        status
      }
      createdAt
      updatedAt
    }
  }
`;

export const APIARY_QUERY = gql`
  query Apiary($id: UUID!) {
    apiary(id: $id) {
      id
      name
      region
      latitude
      longitude
      elevationOffset
      bloomOffset
      hives {
        id
        name
        status
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_APIARY_MUTATION = gql`
  mutation CreateApiary($input: CreateApiaryInput!) {
    createApiary(input: $input) {
      id
      name
      region
    }
  }
`;

export const UPDATE_APIARY_MUTATION = gql`
  mutation UpdateApiary($id: UUID!, $input: UpdateApiaryInput!) {
    updateApiary(id: $id, input: $input) {
      id
      name
      region
    }
  }
`;

export const DELETE_APIARY_MUTATION = gql`
  mutation DeleteApiary($id: UUID!) {
    deleteApiary(id: $id)
  }
`;
