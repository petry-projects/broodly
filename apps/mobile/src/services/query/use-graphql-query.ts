import { useQuery, type UseQueryOptions, type QueryKey } from '@tanstack/react-query';
import { useClient, type AnyVariables, type DocumentInput } from 'urql';

type GraphQLQueryOptions<TData> = {
  queryKey: QueryKey;
  document: DocumentInput<TData, AnyVariables>;
  variables?: AnyVariables;
  enabled?: boolean;
} & Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>;

/**
 * Combines urql transport with TanStack Query caching.
 * urql executes the GraphQL operation; TanStack Query manages
 * caching, persistence, and stale-while-revalidate.
 *
 * Exposes `dataUpdatedAt` for staleness calculation (Story 5.5).
 */
export function useGraphQLQuery<TData>({
  queryKey,
  document,
  variables,
  enabled = true,
  ...options
}: GraphQLQueryOptions<TData>) {
  const client = useClient();

  return useQuery<TData, Error>({
    queryKey,
    queryFn: async () => {
      const result = await client.query(document, variables ?? {}).toPromise();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data as TData;
    },
    enabled,
    ...options,
  });
}
