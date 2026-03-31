import { useAuthStore } from './auth-store';

beforeEach(() => {
  useAuthStore.getState().clearUser();
});

describe('useAuthStore', () => {
  describe('setUser', () => {
    it('stores uid, email, displayName, and idToken', () => {
      useAuthStore.getState().setUser({
        uid: 'test-uid',
        email: 'a@b.com',
        displayName: 'Test User',
        idToken: 'test-token',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual({
        uid: 'test-uid',
        email: 'a@b.com',
        displayName: 'Test User',
        idToken: 'test-token',
      });
    });
  });

  describe('clearUser', () => {
    it('resets store to initial state', () => {
      useAuthStore.getState().setUser({
        uid: 'test-uid',
        email: 'a@b.com',
        displayName: 'Test',
        idToken: 'token',
      });

      useAuthStore.getState().clearUser();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('isAuthenticated selector', () => {
    it('returns true when user is set', () => {
      useAuthStore.getState().setUser({
        uid: 'test-uid',
        email: 'a@b.com',
        displayName: 'Test',
        idToken: 'token',
      });

      expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    });

    it('returns false when user is cleared', () => {
      useAuthStore.getState().clearUser();

      expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    });
  });

  describe('currentUserId selector', () => {
    it('returns uid when user is set', () => {
      useAuthStore.getState().setUser({
        uid: 'test-uid',
        email: 'a@b.com',
        displayName: 'Test',
        idToken: 'token',
      });

      expect(useAuthStore.getState().currentUserId()).toBe('test-uid');
    });

    it('returns null when no user', () => {
      expect(useAuthStore.getState().currentUserId()).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('sets loading state', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('sets error message', () => {
      useAuthStore.getState().setError('Something went wrong');
      expect(useAuthStore.getState().error).toBe('Something went wrong');
    });

    it('clears error when set to null', () => {
      useAuthStore.getState().setError('Error');
      useAuthStore.getState().setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
