/**
 * @jest-environment jsdom
 */
import { useAuthStore } from '../store/auth-store';

let authStateCallback: ((user: unknown) => void) | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: unknown) => void) => {
    authStateCallback = callback;
    return mockUnsubscribe;
  },
}));

jest.mock('../platform/firebase-web', () => ({
  webAuth: {},
}));

// Must import after mocks are set up
import { subscribeToAuthState } from './auth-listener.web';

beforeEach(() => {
  jest.clearAllMocks();
  authStateCallback = null;
  useAuthStore.getState().clearUser();
  useAuthStore.getState().setError(null);
  useAuthStore.getState().setLoading(true);
});

describe('subscribeToAuthState (web)', () => {
  it('returns an unsubscribe function', () => {
    const unsubscribe = subscribeToAuthState();

    expect(typeof unsubscribe).toBe('function');
  });

  it('sets user in store when Firebase reports a signed-in user', async () => {
    subscribeToAuthState();

    const mockUser = {
      uid: 'web-uid-123',
      email: 'user@gmail.com',
      displayName: 'Web User',
      getIdToken: jest.fn().mockResolvedValue('web-token-abc'),
    };

    await authStateCallback!(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual({
      uid: 'web-uid-123',
      email: 'user@gmail.com',
      displayName: 'Web User',
      idToken: 'web-token-abc',
    });
    expect(state.isLoading).toBe(false);
  });

  it('clears user in store when Firebase reports signed out', async () => {
    useAuthStore.getState().setUser({
      uid: 'old-uid',
      email: 'old@email.com',
      displayName: 'Old User',
      idToken: 'old-token',
    });

    subscribeToAuthState();
    await authStateCallback!(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('sets error and clears user when token retrieval fails', async () => {
    subscribeToAuthState();

    const mockUser = {
      uid: 'fail-uid',
      email: 'fail@email.com',
      displayName: null,
      getIdToken: jest.fn().mockRejectedValue(new Error('Token error')),
    };

    await authStateCallback!(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.error).toBe('Failed to restore session. Please sign in again.');
    expect(state.isLoading).toBe(false);
  });
});
