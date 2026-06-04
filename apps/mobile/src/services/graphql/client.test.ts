import { useAuthStore } from '../../store/auth-store';

// Reset auth store between tests
beforeEach(() => {
  useAuthStore.getState().clearUser();
});

describe('GraphQL client', () => {
  it('createGraphQLClient returns a urql Client', () => {
    const { createGraphQLClient } = require('./client');
    const client = createGraphQLClient();
    expect(client).toBeDefined();
    expect(typeof client.query).toBe('function');
    expect(typeof client.mutation).toBe('function');
  });

  it('creates client with subscription support', () => {
    const { createGraphQLClient } = require('./client');
    const client = createGraphQLClient();
    expect(typeof client.subscription).toBe('function');
  });

  it('accepts a token refresher function', () => {
    const { createGraphQLClient } = require('./client');
    const refresher = jest.fn().mockResolvedValue('new-token');
    const client = createGraphQLClient(refresher);
    expect(client).toBeDefined();
  });
});

describe('Auth store integration', () => {
  it('auth store provides token for header injection', () => {
    useAuthStore.getState().setUser({
      uid: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      idToken: 'mock-firebase-token',
    });

    const state = useAuthStore.getState();
    expect(state.user?.idToken).toBe('mock-firebase-token');
  });

  it('clearUser removes token', () => {
    useAuthStore.getState().setUser({
      uid: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      idToken: 'mock-firebase-token',
    });
    useAuthStore.getState().clearUser();

    expect(useAuthStore.getState().user).toBeNull();
  });
});
