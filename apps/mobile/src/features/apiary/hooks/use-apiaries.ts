import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClient } from 'urql';
import {
  APIARIES_QUERY,
  APIARY_QUERY,
  CREATE_APIARY_MUTATION,
  UPDATE_APIARY_MUTATION,
  DELETE_APIARY_MUTATION,
} from '../../../services/graphql/apiary';
import { throwIfGraphQLError, assertData } from '../../../services/graphql/query-utils';
import type { Apiary, CreateApiaryInput, UpdateApiaryInput } from '@broodly/graphql-types';

const APIARY_KEYS = {
  all: ['apiaries'] as const,
  detail: (id: string) => ['apiaries', id] as const,
};

export function useApiaries() {
  const client = useClient();

  return useQuery({
    queryKey: APIARY_KEYS.all,
    queryFn: async () => {
      const result = await client.query(APIARIES_QUERY, {}).toPromise();
      throwIfGraphQLError(result, 'Apiaries query');
      return assertData(result, 'apiaries', 'Apiaries query') as Apiary[];
    },
  });
}

export function useApiary(id: string) {
  const client = useClient();

  return useQuery({
    queryKey: APIARY_KEYS.detail(id),
    queryFn: async () => {
      const result = await client.query(APIARY_QUERY, { id }).toPromise();
      throwIfGraphQLError(result, 'Apiary query');
      return assertData(result, 'apiary', 'Apiary query') as Apiary;
    },
    enabled: !!id,
  });
}

export function useCreateApiary() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateApiaryInput) => {
      const result = await client.mutation(CREATE_APIARY_MUTATION, { input }).toPromise();
      throwIfGraphQLError(result, 'CreateApiary mutation');
      return assertData(result, 'createApiary', 'CreateApiary mutation') as Apiary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APIARY_KEYS.all });
    },
  });
}

export function useUpdateApiary() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateApiaryInput }) => {
      const result = await client.mutation(UPDATE_APIARY_MUTATION, { id, input }).toPromise();
      throwIfGraphQLError(result, 'UpdateApiary mutation');
      return assertData(result, 'updateApiary', 'UpdateApiary mutation') as Apiary;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: APIARY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: APIARY_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteApiary() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await client.mutation(DELETE_APIARY_MUTATION, { id }).toPromise();
      throwIfGraphQLError(result, 'DeleteApiary mutation');
      return assertData(result, 'deleteApiary', 'DeleteApiary mutation') as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APIARY_KEYS.all });
    },
  });
}
