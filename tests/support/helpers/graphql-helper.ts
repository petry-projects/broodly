import type { APIRequestContext } from '@playwright/test';

export type GraphQLResponse<T = Record<string, unknown>> = {
  data: T | null;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: {
      code: string;
      message: string;
      retryable: boolean;
    };
  }>;
};

type GraphQLRequestParams = {
  request: APIRequestContext;
  query: string;
  variables?: Record<string, unknown>;
  token?: string;
};

/**
 * Pure function for sending GraphQL requests.
 * Framework-agnostic — accepts all dependencies explicitly.
 */
export async function graphqlRequest<T = Record<string, unknown>>({
  request,
  query,
  variables,
  token,
}: GraphQLRequestParams): Promise<{
  status: number;
  body: GraphQLResponse<T>;
}> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await request.post('/graphql', {
    headers,
    data: { query, variables },
  });

  const status = response.status();
  const body = (await response.json()) as GraphQLResponse<T>;

  return { status, body };
}
