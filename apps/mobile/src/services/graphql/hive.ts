import { gql } from 'urql';

export const HIVES_QUERY = gql`
  query Hives($apiaryId: UUID!) {
    hives(apiaryId: $apiaryId) {
      id
      name
      type
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

export const HIVE_QUERY = gql`
  query Hive($id: UUID!) {
    hive(id: $id) {
      id
      name
      type
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_HIVE_MUTATION = gql`
  mutation CreateHive($input: CreateHiveInput!) {
    createHive(input: $input) {
      id
      name
      type
      status
    }
  }
`;

export const UPDATE_HIVE_MUTATION = gql`
  mutation UpdateHive($id: UUID!, $input: UpdateHiveInput!) {
    updateHive(id: $id, input: $input) {
      id
      name
      type
      status
    }
  }
`;

export const DELETE_HIVE_MUTATION = gql`
  mutation DeleteHive($id: UUID!) {
    deleteHive(id: $id)
  }
`;
