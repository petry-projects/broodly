import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClient } from 'urql';
import {
  HIVES_QUERY,
  HIVE_QUERY,
  CREATE_HIVE_MUTATION,
  UPDATE_HIVE_MUTATION,
  DELETE_HIVE_MUTATION,
} from '../../../services/graphql/hive';
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
      if (result.error) throw new Error(result.error.message);
      return result.data.hives as Hive[];
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
      if (result.error) throw new Error(result.error.message);
      return result.data.hive as Hive;
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
      if (result.error) throw new Error(result.error.message);
      return result.data.createHive as Hive;
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
      if (result.error) throw new Error(result.error.message);
      return result.data.updateHive as Hive;
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
      if (result.error) throw new Error(result.error.message);
      return result.data.deleteHive as boolean;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiaries'] });
    },
  });
}
