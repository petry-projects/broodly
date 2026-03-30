import { test as base } from '@playwright/test';
import { graphqlRequest, type GraphQLResponse } from '../helpers/graphql-helper';

type GraphQLFixture = {
  gql: <T = Record<string, unknown>>(params: {
    query: string;
    variables?: Record<string, unknown>;
    token?: string;
  }) => Promise<{ status: number; body: GraphQLResponse<T> }>;
};

export const test = base.extend<GraphQLFixture>({
  gql: async ({ request }, use) => {
    await use((params) => graphqlRequest({ request, ...params }));
  },
});
