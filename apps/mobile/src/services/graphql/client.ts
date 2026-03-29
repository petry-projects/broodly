import { Client, fetchExchange, mapExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';
import { retryExchange } from '@urql/exchange-retry';
import { useAuthStore } from '../../store/auth-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/graphql';

export type TokenRefresher = () => Promise<string | null>;

/**
 * Creates a urql GraphQL client with auth header injection,
 * automatic token refresh on 401, and retry for transient failures.
 *
 * Note: urql is used as a transport layer only — TanStack Query
 * manages caching and persistence (see query-client.ts).
 */
export function createGraphQLClient(refreshToken?: TokenRefresher): Client {
  return new Client({
    url: API_URL,
    exchanges: [
      mapExchange({
        onError(error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[GraphQL Error]', error.message);
          }
        },
      }),
      authExchange(async (utilities) => ({
        addAuthToOperation(operation) {
          const token = useAuthStore.getState().user?.idToken;
          if (!token) return operation;
          return utilities.appendHeaders(operation, {
            Authorization: `Bearer ${token}`,
          });
        },
        didAuthError(error) {
          return error.response?.status === 401;
        },
        async refreshAuth() {
          if (refreshToken) {
            const newToken = await refreshToken();
            if (newToken) {
              const user = useAuthStore.getState().user;
              if (user) {
                useAuthStore.getState().setUser({ ...user, idToken: newToken });
              }
            } else {
              useAuthStore.getState().clearUser();
            }
          } else {
            useAuthStore.getState().clearUser();
          }
        },
      })),
      retryExchange({
        maxNumberAttempts: 3,
        retryWith(error, operation) {
          if (error.networkError) return operation;
          return null;
        },
      }),
      fetchExchange,
    ],
  });
}
