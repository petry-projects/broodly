import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClient } from 'urql';
import {
  HIVES_QUERY,
  HIVE_QUERY,
  CREATE_HIVE_MUTATION,
  UPDATE_HIVE_MUTATION,
  DELETE_HIVE_MUTATION,
} from '../../../services/graphql/hive';
import { throwIfGraphQLError, assertData } from '../../../services/graphql/query-utils';
import type { Hive, CreateHiveInput, UpdateHiveInput } from '@broodly/graphql-types';

const HIVE_KEYS = {
  byApiary: (apiaryId: string) => ['hives', apiaryId] as const,
  detail: (id: string) => ['hive', id] as const,
};

export function useHives(apiaryId: string) {
  const client = useClient();

  return useQuery({
    queryKey: HIVE_KEYS.byApiary(apiaryId),
    queryFn: async () => {
      const result = await client.query(HIVES_QUERY, { apiaryId }).toPromise();
      throwIfGraphQLError(result, 'Hives query');
      return assertData(result, 'hives', 'Hives query') as Hive[];
    },
    enabled: !!apiaryId,
  });
}

export function useHive(id: string) {
  const client = useClient();

  return useQuery({
    queryKey: HIVE_KEYS.detail(id),
    queryFn: async () => {
      const result = await client.query(HIVE_QUERY, { id }).toPromise();
      throwIfGraphQLError(result, 'Hive query');
      return assertData(result, 'hive', 'Hive query') as Hive;
    },
    enabled: !!id,
  });
}

export function useCreateHive() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHiveInput) => {
      const result = await client.mutation(CREATE_HIVE_MUTATION, { input }).toPromise();
      throwIfGraphQLError(result, 'CreateHive mutation');
      return assertData(result, 'createHive', 'CreateHive mutation') as Hive;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: HIVE_KEYS.byApiary(variables.apiaryId) });
      queryClient.invalidateQueries({ queryKey: ['apiaries'] });
    },
  });
}

export function useUpdateHive() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateHiveInput }) => {
      const result = await client.mutation(UPDATE_HIVE_MUTATION, { id, input }).toPromise();
      throwIfGraphQLError(result, 'UpdateHive mutation');
      return assertData(result, 'updateHive', 'UpdateHive mutation') as Hive;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: HIVE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['apiaries'] });
    },
  });
}

export function useDeleteHive() {
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await client.mutation(DELETE_HIVE_MUTATION, { id }).toPromise();
      throwIfGraphQLError(result, 'DeleteHive mutation');
      return assertData(result, 'deleteHive', 'DeleteHive mutation') as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiaries'] });
    },
  });
}
