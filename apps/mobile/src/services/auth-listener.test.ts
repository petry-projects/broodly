import { useAuthStore } from '../store/auth-store';

// Capture the onAuthStateChanged callback
let authStateCallback: ((user: unknown) => void) | null = null;
const mockUnsubscribe = jest.fn();
const mockGetIdToken = jest.fn();

jest.mock('@react-native-firebase/auth', () => {
  const auth = jest.fn(() => ({
    onAuthStateChanged: jest.fn((callback: (user: unknown) => void) => {
      authStateCallback = callback;
      return mockUnsubscribe;
    }),
  }));
  return { __esModule: true, default: auth };
});

// We need to import after mocks are set up
import { subscribeToAuthState } from './auth-listener';

beforeEach(() => {
  jest.clearAllMocks();
  authStateCallback = null;
  useAuthStore.getState().clearUser();
});

describe('subscribeToAuthState', () => {
  it('calls setUser with user data when auth state fires with a user', async () => {
    mockGetIdToken.mockResolvedValue('fresh-token');

    subscribeToAuthState();

    expect(authStateCallback).not.toBeNull();

    // Simulate Firebase emitting a user
    await authStateCallback!({
      uid: 'user-123',
      email: 'user@example.com',
      displayName: 'Test User',
      getIdToken: mockGetIdToken,
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual({
      uid: 'user-123',
      email: 'user@example.com',
      displayName: 'Test User',
      idToken: 'fresh-token',
    });
    expect(state.isLoading).toBe(false);
  });

  it('calls clearUser when auth state fires with null', () => {
    // Pre-set a user
    useAuthStore.getState().setUser({
      uid: 'user-123',
      email: 'user@example.com',
      displayName: 'Test',
      idToken: 'token',
    });

    subscribeToAuthState();

    // Simulate Firebase emitting null (signed out)
    authStateCallback!(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('handles getIdToken failure gracefully', async () => {
    mockGetIdToken.mockRejectedValue(new Error('network failure'));

    subscribeToAuthState();

    await authStateCallback!({
      uid: 'user-123',
      email: 'user@example.com',
      displayName: 'Test User',
      getIdToken: mockGetIdToken,
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.error).toBe('Failed to restore session. Please sign in again.');
    expect(state.isLoading).toBe(false);
  });

  it('returns an unsubscribe function', () => {
    const unsubscribe = subscribeToAuthState();

    unsubscribe();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
